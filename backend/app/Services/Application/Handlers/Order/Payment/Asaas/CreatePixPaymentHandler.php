<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Asaas;

use HiEvents\DomainObjects\Generated\AsaasPaymentDomainObjectAbstract;
use HiEvents\DomainObjects\OrderItemDomainObject;
use HiEvents\DomainObjects\Status\OrderStatus;
use HiEvents\Exceptions\Asaas\CreatePixPaymentFailedException;
use HiEvents\Exceptions\ResourceConflictException;
use HiEvents\Exceptions\UnauthorizedException;
use HiEvents\Repository\Eloquent\Value\Relationship;
use HiEvents\Repository\Interfaces\AsaasPaymentsRepositoryInterface;
use HiEvents\Repository\Interfaces\OrderRepositoryInterface;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO\CreatePixPaymentRequestDTO;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO\CreatePixPaymentResponseDTO;
use HiEvents\Services\Domain\Payment\Asaas\AsaasPixPaymentCreationService;
use HiEvents\Services\Infrastructure\Session\CheckoutSessionManagementService;
use HiEvents\Values\MoneyValue;
use Psr\Log\LoggerInterface;
use Throwable;

readonly class CreatePixPaymentHandler
{
    public function __construct(
        private OrderRepositoryInterface           $orderRepository,
        private AsaasPixPaymentCreationService     $asaasPixPaymentService,
        private CheckoutSessionManagementService   $sessionIdentifierService,
        private AsaasPaymentsRepositoryInterface  $asaasPaymentsRepository,
        private \Psr\Log\LoggerInterface          $logger,
    )
    {
    }

    /**
     * @param string $orderShortId
     * @param string $cpfCnpj CPF (11 dígitos) ou CNPJ (14 dígitos) do cliente
     * @return CreatePixPaymentResponseDTO
     * @throws CreatePixPaymentFailedException
     * @throws Throwable
     */
    public function handle(string $orderShortId, string $cpfCnpj): CreatePixPaymentResponseDTO
    {
        $this->logger->info('CreatePixPaymentHandler: Starting Pix payment creation', [
            'order_short_id' => $orderShortId,
        ]);

        $this->logger->debug('CreatePixPaymentHandler: Loading order from database');
        $order = $this->orderRepository
            ->loadRelation(new Relationship(OrderItemDomainObject::class))
            ->findByShortId($orderShortId);

        if (!$order) {
            $this->logger->warning('CreatePixPaymentHandler: Order not found', [
                'order_short_id' => $orderShortId,
            ]);
            throw new UnauthorizedException(__('Sorry, we could not verify your session. Please create a new order.'));
        }

        $this->logger->debug('CreatePixPaymentHandler: Verifying session', [
            'order_id' => $order->getId(),
            'session_id' => $order->getSessionId(),
        ]);

        if (!$this->sessionIdentifierService->verifySession($order->getSessionId())) {
            $this->logger->warning('CreatePixPaymentHandler: Session verification failed', [
                'order_id' => $order->getId(),
                'order_short_id' => $orderShortId,
            ]);
            throw new UnauthorizedException(__('Sorry, we could not verify your session. Please create a new order.'));
        }

        $this->logger->debug('CreatePixPaymentHandler: Validating order status', [
            'order_id' => $order->getId(),
            'status' => $order->getStatus(),
            'is_expired' => $order->isReservedOrderExpired(),
        ]);

        if ($order->getStatus() !== OrderStatus::RESERVED->name || $order->isReservedOrderExpired()) {
            $this->logger->warning('CreatePixPaymentHandler: Order not in valid state', [
                'order_id' => $order->getId(),
                'status' => $order->getStatus(),
                'is_expired' => $order->isReservedOrderExpired(),
            ]);
            throw new ResourceConflictException(__('Sorry, is expired or not in a valid state.'));
        }

        // Verifica se já existe um pagamento Pix para este pedido
        $this->logger->debug('CreatePixPaymentHandler: Checking for existing payment', [
            'order_id' => $order->getId(),
        ]);

        $existingPayment = $this->asaasPaymentsRepository->findFirstWhere([
            AsaasPaymentDomainObjectAbstract::ORDER_ID => $order->getId(),
        ]);

        if ($existingPayment) {
            $this->logger->info('CreatePixPaymentHandler: Existing payment found', [
                'payment_id' => $existingPayment->getId(),
                'asaas_payment_id' => $existingPayment->getAsaasPaymentId(),
                'status' => $existingPayment->getStatus(),
                'expiration_date' => $existingPayment->getExpirationDate(),
            ]);

            // Se o pagamento ainda está pendente e não expirou, retorna os dados existentes
            if ($existingPayment->getStatus() === 'PENDING' && 
                ($existingPayment->getExpirationDate() === null || 
                 \Carbon\Carbon::parse($existingPayment->getExpirationDate())->isFuture())) {
                $this->logger->info('CreatePixPaymentHandler: Returning existing valid payment', [
                    'payment_id' => $existingPayment->getAsaasPaymentId(),
                ]);

                return new CreatePixPaymentResponseDTO(
                    paymentId: $existingPayment->getAsaasPaymentId(),
                    pixCode: $existingPayment->getPixCode() ?? '',
                    qrCodeImage: $existingPayment->getQrCodeImage(),
                    expirationDate: $existingPayment->getExpirationDate() ?? \Carbon\Carbon::now()->addDays(1)->toIso8601String(),
                    status: $existingPayment->getStatus(),
                );
            }

            $this->logger->info('CreatePixPaymentHandler: Existing payment expired or completed, creating new one', [
                'payment_id' => $existingPayment->getAsaasPaymentId(),
                'status' => $existingPayment->getStatus(),
            ]);
        }

        $this->logger->info('CreatePixPaymentHandler: Creating new Pix payment', [
            'order_id' => $order->getId(),
            'amount' => $order->getTotalGross(),
            'currency' => $order->getCurrency(),
        ]);

        $paymentResponse = $this->asaasPixPaymentService->createPixPayment(
            CreatePixPaymentRequestDTO::fromArray([
                'amount' => MoneyValue::fromFloat($order->getTotalGross(), $order->getCurrency()),
                'currencyCode' => $order->getCurrency(),
                'order' => $order,
                'cpfCnpj' => $cpfCnpj,
            ])
        );

        $this->logger->info('CreatePixPaymentHandler: Pix payment created, saving to database', [
            'payment_id' => $paymentResponse->paymentId,
            'order_id' => $order->getId(),
        ]);

        // Salva o pagamento no banco de dados
        $this->asaasPaymentsRepository->create([
            AsaasPaymentDomainObjectAbstract::ORDER_ID => $order->getId(),
            AsaasPaymentDomainObjectAbstract::ASAAS_PAYMENT_ID => $paymentResponse->paymentId,
            AsaasPaymentDomainObjectAbstract::PIX_CODE => $paymentResponse->pixCode,
            AsaasPaymentDomainObjectAbstract::QR_CODE_IMAGE => $paymentResponse->qrCodeImage,
            AsaasPaymentDomainObjectAbstract::STATUS => $paymentResponse->status,
            AsaasPaymentDomainObjectAbstract::EXPIRATION_DATE => $paymentResponse->expirationDate,
            AsaasPaymentDomainObjectAbstract::EXTERNAL_REFERENCE => $order->getShortId(),
        ]);

        $this->logger->info('CreatePixPaymentHandler: Pix payment saved successfully', [
            'payment_id' => $paymentResponse->paymentId,
            'order_id' => $order->getId(),
        ]);

        return $paymentResponse;
    }
}

