<?php

namespace HiEvents\Services\Domain\Payment\Asaas\EventHandlers;

use HiEvents\DomainObjects\Enums\PaymentProviders;
use HiEvents\DomainObjects\Generated\AsaasPaymentDomainObjectAbstract;
use HiEvents\DomainObjects\Generated\OrderDomainObjectAbstract;
use HiEvents\DomainObjects\OrderDomainObject;
use HiEvents\DomainObjects\OrderItemDomainObject;
use HiEvents\DomainObjects\Status\AttendeeStatus;
use HiEvents\DomainObjects\Status\OrderApplicationFeeStatus;
use HiEvents\DomainObjects\Status\OrderPaymentStatus;
use HiEvents\DomainObjects\Status\OrderStatus;
use HiEvents\Events\OrderStatusChangedEvent;
use HiEvents\Exceptions\CannotAcceptPaymentException;
use HiEvents\Repository\Eloquent\AsaasPaymentsRepository;
use HiEvents\Repository\Eloquent\Value\Relationship;
use HiEvents\Repository\Interfaces\AffiliateRepositoryInterface;
use HiEvents\Repository\Interfaces\AttendeeRepositoryInterface;
use HiEvents\Repository\Interfaces\OrderRepositoryInterface;
use HiEvents\Services\Domain\Order\OrderApplicationFeeService;
use HiEvents\Services\Domain\Product\ProductQuantityUpdateService;
use HiEvents\Services\Infrastructure\DomainEvents\DomainEventDispatcherService;
use HiEvents\Services\Infrastructure\DomainEvents\Enums\DomainEventType;
use HiEvents\Services\Infrastructure\DomainEvents\Events\OrderEvent;
use Illuminate\Cache\Repository;
use Illuminate\Database\DatabaseManager;
use Psr\Log\LoggerInterface;
use Throwable;

class PaymentConfirmedHandler
{
    private array $currentPaymentData = [];

    public function __construct(
        private readonly OrderRepositoryInterface                        $orderRepository,
        private readonly AsaasPaymentsRepository                        $asaasPaymentsRepository,
        private readonly AffiliateRepositoryInterface                    $affiliateRepository,
        private readonly ProductQuantityUpdateService                    $quantityUpdateService,
        private readonly AttendeeRepositoryInterface                     $attendeeRepository,
        private readonly DatabaseManager                                 $databaseManager,
        private readonly LoggerInterface                                 $logger,
        private readonly Repository                                      $cache,
        private readonly DomainEventDispatcherService                    $domainEventDispatcherService,
        private readonly OrderApplicationFeeService                      $orderApplicationFeeService,
    )
    {
    }

    /**
     * @throws Throwable
     */
    public function handleEvent(array $paymentData): void
    {
        $paymentId = $paymentData['id'] ?? null;
        
        $this->logger->info('PaymentConfirmedHandler: Processing payment confirmed event', [
            'payment_id' => $paymentId,
            'payment_status' => $paymentData['status'] ?? null,
            'payment_value' => $paymentData['value'] ?? null,
        ]);

        if (!$paymentId) {
            $this->logger->error('PaymentConfirmedHandler: Payment ID missing from event', [
                'payment_data' => $paymentData,
            ]);
            return;
        }

        if ($this->isPaymentAlreadyHandled($paymentId)) {
            $this->logger->info('PaymentConfirmedHandler: Payment already handled, skipping', [
                'payment_id' => $paymentId,
            ]);
            return;
        }

        $this->logger->debug('PaymentConfirmedHandler: Starting database transaction');

        $this->databaseManager->transaction(function () use ($paymentData, $paymentId) {
            // Armazena os dados do pagamento para uso posterior
            $this->currentPaymentData = $paymentData;
            
            $this->logger->debug('PaymentConfirmedHandler: Searching for Asaas payment in database', [
                'payment_id' => $paymentId,
            ]);

            /** @var \HiEvents\DomainObjects\AsaasPaymentDomainObject $asaasPayment */
            $asaasPayment = $this->asaasPaymentsRepository
                ->loadRelation(new Relationship(OrderDomainObject::class, name: 'order'))
                ->findFirstWhere([
                    AsaasPaymentDomainObjectAbstract::ASAAS_PAYMENT_ID => $paymentId,
                ]);

            if (!$asaasPayment) {
                $this->logger->error('PaymentConfirmedHandler: Asaas payment not found in database', [
                    'payment_id' => $paymentId,
                    'payment_data' => $paymentData,
                ]);
                return;
            }

            $this->logger->info('PaymentConfirmedHandler: Asaas payment found', [
                'payment_id' => $paymentId,
                'order_id' => $asaasPayment->getOrderId(),
                'current_status' => $asaasPayment->getStatus(),
            ]);

            $this->logger->debug('PaymentConfirmedHandler: Validating payment and order status');
            $this->validatePaymentAndOrderStatus($asaasPayment, $paymentData);

            $this->logger->debug('PaymentConfirmedHandler: Updating Asaas payment info');
            $this->updateAsaasPaymentInfo($paymentData, $asaasPayment);

            $this->logger->debug('PaymentConfirmedHandler: Updating order statuses');
            $updatedOrder = $this->updateOrderStatuses($asaasPayment);

            $this->logger->debug('PaymentConfirmedHandler: Updating attendee statuses');
            $this->updateAttendeeStatuses($updatedOrder);

            $this->logger->debug('PaymentConfirmedHandler: Updating product quantities');
            $this->quantityUpdateService->updateQuantitiesFromOrder($updatedOrder);

            $this->logger->info('PaymentConfirmedHandler: Dispatching OrderStatusChangedEvent');
            OrderStatusChangedEvent::dispatch($updatedOrder);

            $this->logger->info('PaymentConfirmedHandler: Dispatching OrderEvent');
            $this->domainEventDispatcherService->dispatch(
                new OrderEvent(
                    type: DomainEventType::ORDER_CREATED,
                    orderId: $updatedOrder->getId()
                ),
            );

            $this->markPaymentAsHandled($paymentId, $updatedOrder);

            $this->logger->debug('PaymentConfirmedHandler: Storing application fee payment');
            $this->storeApplicationFeePayment($updatedOrder);

            $this->logger->info('PaymentConfirmedHandler: Payment confirmed event processed successfully', [
                'payment_id' => $paymentId,
                'order_id' => $updatedOrder->getId(),
            ]);
        });
    }

    private function updateOrderStatuses(\HiEvents\DomainObjects\AsaasPaymentDomainObject $asaasPayment): OrderDomainObject
    {
        // Determina o provider baseado no billingType do pagamento
        // Usa os dados do webhook armazenados em currentPaymentData
        $paymentData = $this->currentPaymentData;
        $billingType = $paymentData['billingType'] ?? null;
        
        // Se não tiver billingType nos dados do webhook, tenta usar os dados salvos
        if (!$billingType) {
            $savedData = $asaasPayment->getAsaasResponse();
            if (is_array($savedData)) {
                $billingType = $savedData['billingType'] ?? null;
            }
        }
        
        $paymentProvider = PaymentProviders::ASAAS_PIX->value;
        if ($billingType === 'CREDIT_CARD') {
            $paymentProvider = PaymentProviders::ASAAS_CREDIT_CARD->value;
        }

        $this->logger->info('PaymentConfirmedHandler: Updating order statuses', [
            'order_id' => $asaasPayment->getOrderId(),
            'new_payment_status' => OrderPaymentStatus::PAYMENT_RECEIVED->name,
            'new_status' => OrderStatus::COMPLETED->name,
            'billing_type' => $billingType,
            'payment_provider' => $paymentProvider,
        ]);

        $updatedOrder = $this->orderRepository
            ->loadRelation(OrderItemDomainObject::class)
            ->updateFromArray($asaasPayment->getOrderId(), [
                OrderDomainObjectAbstract::PAYMENT_STATUS => OrderPaymentStatus::PAYMENT_RECEIVED->name,
                OrderDomainObjectAbstract::STATUS => OrderStatus::COMPLETED->name,
                OrderDomainObjectAbstract::PAYMENT_PROVIDER => $paymentProvider,
            ]);

        $this->logger->info('PaymentConfirmedHandler: Order statuses updated', [
            'order_id' => $updatedOrder->getId(),
            'payment_status' => $updatedOrder->getPaymentStatus(),
            'status' => $updatedOrder->getStatus(),
        ]);

        // Update affiliate sales if this order has an affiliate
        if ($updatedOrder->getAffiliateId()) {
            $this->logger->info('PaymentConfirmedHandler: Updating affiliate sales', [
                'order_id' => $updatedOrder->getId(),
                'affiliate_id' => $updatedOrder->getAffiliateId(),
                'amount' => $updatedOrder->getTotalGross(),
            ]);

            $this->affiliateRepository->incrementSales(
                affiliateId: $updatedOrder->getAffiliateId(),
                amount: $updatedOrder->getTotalGross()
            );
        }

        return $updatedOrder;
    }

    private function updateAsaasPaymentInfo(array $paymentData, \HiEvents\DomainObjects\AsaasPaymentDomainObject $asaasPayment): void
    {
        $amountReceived = isset($paymentData['value']) ? (int)($paymentData['value'] * 100) : null; // Convert to minor unit
        $paymentDate = isset($paymentData['paymentDate']) ? $paymentData['paymentDate'] : null;

        $this->logger->info('PaymentConfirmedHandler: Updating Asaas payment info', [
            'payment_id' => $paymentData['id'] ?? null,
            'order_id' => $asaasPayment->getOrderId(),
            'new_status' => $paymentData['status'] ?? 'CONFIRMED',
            'amount_received' => $amountReceived,
            'payment_date' => $paymentDate,
        ]);

        $this->asaasPaymentsRepository->updateWhere(
            attributes: [
                AsaasPaymentDomainObjectAbstract::STATUS => $paymentData['status'] ?? 'CONFIRMED',
                AsaasPaymentDomainObjectAbstract::AMOUNT_RECEIVED => $amountReceived,
                AsaasPaymentDomainObjectAbstract::PAYMENT_DATE => $paymentDate,
                AsaasPaymentDomainObjectAbstract::ASAAS_RESPONSE => $paymentData,
            ],
            where: [
                AsaasPaymentDomainObjectAbstract::ASAAS_PAYMENT_ID => $paymentData['id'],
                AsaasPaymentDomainObjectAbstract::ORDER_ID => $asaasPayment->getOrderId(),
            ]
        );

        $this->logger->debug('PaymentConfirmedHandler: Asaas payment info updated');
    }

    /**
     * @throws CannotAcceptPaymentException
     */
    private function validatePaymentAndOrderStatus(
        \HiEvents\DomainObjects\AsaasPaymentDomainObject $asaasPayment,
        array $paymentData
    ): void {
        $order = $asaasPayment->getOrder();

        if (!$order) {
            throw new CannotAcceptPaymentException(
                __('Order not found for payment: :id', ['id' => $paymentData['id']])
            );
        }

        if (!in_array($order->getPaymentStatus(), [
            OrderPaymentStatus::AWAITING_PAYMENT->name,
            OrderPaymentStatus::PAYMENT_FAILED->name,
        ], true)) {
            throw new CannotAcceptPaymentException(
                __('Order is not awaiting payment. Order: :id',
                    ['id' => $asaasPayment->getOrderId()]
                )
            );
        }

        // Verifica se o pedido expirou
        if ($order->isReservedOrderExpired()) {
            // Para Pix, não fazemos estorno automático como no Stripe
            // O organizador pode decidir manualmente
            $this->logger->warning('Asaas payment received for expired order', [
                'order_id' => $order->getId(),
                'payment_id' => $paymentData['id'],
            ]);
        }
    }

    private function updateAttendeeStatuses(OrderDomainObject $updatedOrder): void
    {
        $this->logger->debug('PaymentConfirmedHandler: Updating attendee statuses', [
            'order_id' => $updatedOrder->getId(),
        ]);

        $this->attendeeRepository->updateWhere(
            attributes: [
                'status' => AttendeeStatus::ACTIVE->name,
            ],
            where: [
                'order_id' => $updatedOrder->getId(),
                'status' => AttendeeStatus::AWAITING_PAYMENT->name,
            ],
        );

        $this->logger->info('PaymentConfirmedHandler: Attendee statuses updated', [
            'order_id' => $updatedOrder->getId(),
        ]);
    }

    private function markPaymentAsHandled(string $paymentId, OrderDomainObject $updatedOrder): void
    {
        $this->logger->info('Asaas payment confirmed event handled', [
            'payment_id' => $paymentId,
            'order_id' => $updatedOrder->getId(),
        ]);

        $this->cache->put('asaas_payment_handled_' . $paymentId, true, 3600);
    }

    private function isPaymentAlreadyHandled(string $paymentId): bool
    {
        return $this->cache->has('asaas_payment_handled_' . $paymentId);
    }

    private function storeApplicationFeePayment(OrderDomainObject $updatedOrder): void
    {
        // Para pagamentos via Asaas, não há application fee como no Stripe Connect
        // Todos os pagamentos vão para conta central da Evenday
        // Se necessário calcular fee, pode ser feito aqui
        $paymentProvider = $updatedOrder->getPaymentProvider() === PaymentProviders::ASAAS_CREDIT_CARD->value
            ? PaymentProviders::ASAAS_CREDIT_CARD
            : PaymentProviders::ASAAS_PIX;
            
        $this->orderApplicationFeeService->createOrderApplicationFee(
            orderId: $updatedOrder->getId(),
            applicationFeeAmountMinorUnit: 0, // Sem fee para Asaas
            orderApplicationFeeStatus: OrderApplicationFeeStatus::PAID,
            paymentMethod: $paymentProvider,
            currency: $updatedOrder->getCurrency(),
        );
    }
}

