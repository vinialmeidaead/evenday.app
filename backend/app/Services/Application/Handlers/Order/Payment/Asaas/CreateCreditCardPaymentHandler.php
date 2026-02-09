<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Asaas;

use HiEvents\DomainObjects\Generated\AsaasPaymentDomainObjectAbstract;
use HiEvents\DomainObjects\OrderItemDomainObject;
use HiEvents\DomainObjects\Status\OrderStatus;
use HiEvents\Exceptions\Asaas\CreateCreditCardPaymentFailedException;
use HiEvents\Exceptions\ResourceConflictException;
use HiEvents\Exceptions\UnauthorizedException;
use HiEvents\Repository\Eloquent\Value\Relationship;
use HiEvents\Repository\Interfaces\AsaasPaymentsRepositoryInterface;
use HiEvents\Repository\Interfaces\OrderRepositoryInterface;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO\CreateCreditCardPaymentRequestDTO;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO\CreateCreditCardPaymentResponseDTO;
use HiEvents\Services\Domain\Payment\Asaas\AsaasCreditCardPaymentCreationService;
use HiEvents\Services\Infrastructure\Session\CheckoutSessionManagementService;
use HiEvents\Values\MoneyValue;
use Psr\Log\LoggerInterface;
use Throwable;

readonly class CreateCreditCardPaymentHandler
{
    public function __construct(
        private OrderRepositoryInterface                    $orderRepository,
        private AsaasCreditCardPaymentCreationService       $asaasCreditCardPaymentService,
        private CheckoutSessionManagementService            $sessionIdentifierService,
        private AsaasPaymentsRepositoryInterface           $asaasPaymentsRepository,
        private \Psr\Log\LoggerInterface                   $logger,
    )
    {
    }

    /**
     * @param string $orderShortId
     * @param array $cardData Dados do cartão e titular
     * @return CreateCreditCardPaymentResponseDTO
     * @throws CreateCreditCardPaymentFailedException
     * @throws Throwable
     */
    public function handle(string $orderShortId, array $cardData): CreateCreditCardPaymentResponseDTO
    {
        $this->logger->info('CreateCreditCardPaymentHandler: Starting credit card payment creation', [
            'order_short_id' => $orderShortId,
        ]);

        $this->logger->debug('CreateCreditCardPaymentHandler: Loading order from database');
        $order = $this->orderRepository
            ->loadRelation(new Relationship(OrderItemDomainObject::class))
            ->findByShortId($orderShortId);

        if (!$order) {
            $this->logger->warning('CreateCreditCardPaymentHandler: Order not found', [
                'order_short_id' => $orderShortId,
            ]);
            throw new UnauthorizedException(__('Sorry, we could not verify your session. Please create a new order.'));
        }

        $this->logger->debug('CreateCreditCardPaymentHandler: Verifying session', [
            'order_id' => $order->getId(),
            'session_id' => $order->getSessionId(),
        ]);

        if (!$this->sessionIdentifierService->verifySession($order->getSessionId())) {
            $this->logger->warning('CreateCreditCardPaymentHandler: Session verification failed', [
                'order_id' => $order->getId(),
                'order_short_id' => $orderShortId,
            ]);
            throw new UnauthorizedException(__('Sorry, we could not verify your session. Please create a new order.'));
        }

        $this->logger->debug('CreateCreditCardPaymentHandler: Validating order status', [
            'order_id' => $order->getId(),
            'status' => $order->getStatus(),
            'is_expired' => $order->isReservedOrderExpired(),
        ]);

        if ($order->getStatus() !== OrderStatus::RESERVED->name || $order->isReservedOrderExpired()) {
            $this->logger->warning('CreateCreditCardPaymentHandler: Order not in valid state', [
                'order_id' => $order->getId(),
                'status' => $order->getStatus(),
                'is_expired' => $order->isReservedOrderExpired(),
            ]);
            throw new ResourceConflictException(__('Sorry, is expired or not in a valid state.'));
        }

        // Verifica se já existe um pagamento para este pedido
        $this->logger->debug('CreateCreditCardPaymentHandler: Checking for existing payment', [
            'order_id' => $order->getId(),
        ]);

        $existingPayment = $this->asaasPaymentsRepository->findFirstWhere([
            AsaasPaymentDomainObjectAbstract::ORDER_ID => $order->getId(),
        ]);

        if ($existingPayment && $existingPayment->getStatus() === 'RECEIVED') {
            $this->logger->info('CreateCreditCardPaymentHandler: Payment already received', [
                'payment_id' => $existingPayment->getId(),
                'asaas_payment_id' => $existingPayment->getAsaasPaymentId(),
                'status' => $existingPayment->getStatus(),
            ]);
            throw new ResourceConflictException(__('This order has already been paid.'));
        }

        $this->logger->info('CreateCreditCardPaymentHandler: Creating new credit card payment', [
            'order_id' => $order->getId(),
            'amount' => $order->getTotalGross(),
            'currency' => $order->getCurrency(),
        ]);

        // Remove caracteres não numéricos do CPF/CNPJ
        $cpfCnpj = preg_replace('/\D/', '', $cardData['cpf_cnpj']);

        $paymentResponse = $this->asaasCreditCardPaymentService->createCreditCardPayment(
            CreateCreditCardPaymentRequestDTO::fromArray([
                'amount' => MoneyValue::fromFloat($order->getTotalGross(), $order->getCurrency()),
                'currencyCode' => $order->getCurrency(),
                'order' => $order,
                'cpfCnpj' => $cpfCnpj,
                'holderName' => $cardData['holder_name'],
                'cardNumber' => preg_replace('/\D/', '', $cardData['card_number']),
                'expiryMonth' => str_pad($cardData['expiry_month'], 2, '0', STR_PAD_LEFT),
                'expiryYear' => $cardData['expiry_year'],
                'ccv' => $cardData['ccv'],
                'postalCode' => preg_replace('/\D/', '', $cardData['postal_code']),
                'addressNumber' => $cardData['address_number'],
                'addressComplement' => $cardData['address_complement'] ?? null,
                'phone' => preg_replace('/\D/', '', $cardData['phone']),
                'mobilePhone' => isset($cardData['mobile_phone']) ? preg_replace('/\D/', '', $cardData['mobile_phone']) : null,
                'installmentCount' => isset($cardData['installment_count']) ? (int)$cardData['installment_count'] : 1,
            ])
        );

        $this->logger->info('CreateCreditCardPaymentHandler: Credit card payment created, saving to database', [
            'payment_id' => $paymentResponse->paymentId,
            'order_id' => $order->getId(),
        ]);

        // Salva o pagamento no banco de dados
        $this->asaasPaymentsRepository->create([
            AsaasPaymentDomainObjectAbstract::ORDER_ID => $order->getId(),
            AsaasPaymentDomainObjectAbstract::ASAAS_PAYMENT_ID => $paymentResponse->paymentId,
            AsaasPaymentDomainObjectAbstract::STATUS => $paymentResponse->status,
            AsaasPaymentDomainObjectAbstract::EXTERNAL_REFERENCE => $order->getShortId(),
        ]);

        $this->logger->info('CreateCreditCardPaymentHandler: Credit card payment saved successfully', [
            'payment_id' => $paymentResponse->paymentId,
            'order_id' => $order->getId(),
        ]);

        return $paymentResponse;
    }
}
