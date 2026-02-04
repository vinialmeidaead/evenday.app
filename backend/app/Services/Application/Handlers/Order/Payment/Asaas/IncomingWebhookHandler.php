<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Asaas;

use HiEvents\Exceptions\Asaas\AsaasWebhookValidationException;
use HiEvents\Exceptions\CannotAcceptPaymentException;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO\AsaasWebhookDTO;
use HiEvents\Services\Domain\Payment\Asaas\EventHandlers\PaymentConfirmedHandler;
use Illuminate\Cache\Repository;
use Psr\Log\LoggerInterface;
use Throwable;

class IncomingWebhookHandler
{
    private static array $validEvents = [
        'PAYMENT.CONFIRMED',
        'PAYMENT_CONFIRMED', // Formato alternativo do Asaas
        'PAYMENT.RECEIVED',
        'PAYMENT_RECEIVED', // Formato alternativo do Asaas
        'PAYMENT.OVERDUE',
        'PAYMENT_OVERDUE', // Formato alternativo do Asaas
        'PAYMENT.REFUNDED',
        'PAYMENT_REFUNDED', // Formato alternativo do Asaas
    ];

    public function __construct(
        private readonly PaymentConfirmedHandler $paymentConfirmedHandler,
        private readonly LoggerInterface         $logger,
        private readonly Repository              $cache,
    )
    {
    }

    private function getWebhookToken(): ?string
    {
        return config('services.asaas.webhook_token');
    }

    /**
     * @throws AsaasWebhookValidationException
     * @throws Throwable
     */
    public function handle(AsaasWebhookDTO $webhookDTO): void
    {
        $this->logger->info('IncomingWebhookHandler: Processing Asaas webhook', [
            'event' => $webhookDTO->event,
            'payment_id' => $webhookDTO->payment['id'] ?? null,
        ]);

        try {
            // Valida token de autenticação se configurado E se o Asaas enviou um token
            // Se o token estiver configurado mas o Asaas não enviar, não validamos
            // (o Asaas pode não enviar token em alguns casos ou configurações)
            $webhookToken = $this->getWebhookToken();
            $this->logger->debug('IncomingWebhookHandler: Validating webhook token', [
                'token_configured' => !empty($webhookToken),
                'token_received' => !empty($webhookDTO->accessToken),
            ]);

            // Só valida se ambos estiverem presentes
            if ($webhookToken && $webhookDTO->accessToken) {
                if ($webhookDTO->accessToken !== $webhookToken) {
                    $this->logger->error('IncomingWebhookHandler: Invalid webhook token', [
                        'expected_prefix' => substr($webhookToken, 0, 10),
                        'received_prefix' => substr($webhookDTO->accessToken, 0, 10),
                    ]);
                    throw new AsaasWebhookValidationException('Invalid webhook token');
                }
                $this->logger->debug('IncomingWebhookHandler: Webhook token validated successfully');
            } else {
                $this->logger->debug('IncomingWebhookHandler: Skipping token validation (token not configured or not sent by Asaas)');
            }

            $event = $webhookDTO->event;

            $this->logger->debug('IncomingWebhookHandler: Checking if event is valid', [
                'event' => $event,
                'valid_events' => self::$validEvents,
            ]);

            if (!in_array($event, self::$validEvents, true)) {
                $this->logger->info('IncomingWebhookHandler: Event has no handler', [
                    'event' => $event,
                    'valid_events' => self::$validEvents,
                ]);

                return;
            }

            $paymentId = $webhookDTO->payment['id'] ?? null;

            $this->logger->debug('IncomingWebhookHandler: Checking if event already handled', [
                'event' => $event,
                'payment_id' => $paymentId,
            ]);

            if ($this->hasEventBeenHandled($event, $paymentId)) {
                $this->logger->info('IncomingWebhookHandler: Event already handled, skipping', [
                    'event' => $event,
                    'payment_id' => $paymentId,
                ]);

                return;
            }

            $this->logger->info('IncomingWebhookHandler: Processing event', [
                'event' => $event,
                'payment_id' => $paymentId,
                'payment_data' => $webhookDTO->payment,
            ]);

            switch ($event) {
                case 'PAYMENT.CONFIRMED':
                case 'PAYMENT_CONFIRMED': // Formato alternativo do Asaas
                case 'PAYMENT.RECEIVED':
                case 'PAYMENT_RECEIVED': // Formato alternativo do Asaas
                    $this->logger->info('IncomingWebhookHandler: Handling payment confirmed/received event', [
                        'payment_id' => $paymentId,
                        'event' => $event,
                    ]);
                    $this->paymentConfirmedHandler->handleEvent($webhookDTO->payment);
                    $this->logger->info('IncomingWebhookHandler: Payment confirmed handler completed', [
                        'payment_id' => $paymentId,
                    ]);
                    break;
                case 'PAYMENT.OVERDUE':
                case 'PAYMENT_OVERDUE': // Formato alternativo do Asaas
                    // Opcional: tratar pagamentos vencidos
                    $this->logger->info('IncomingWebhookHandler: Payment overdue event received', [
                        'payment_id' => $paymentId,
                    ]);
                    break;
                case 'PAYMENT.REFUNDED':
                case 'PAYMENT_REFUNDED': // Formato alternativo do Asaas
                    // Opcional: tratar estornos
                    $this->logger->info('IncomingWebhookHandler: Payment refunded event received', [
                        'payment_id' => $paymentId,
                    ]);
                    break;
            }

            $this->markEventAsHandled($event, $paymentId);

            $this->logger->info('IncomingWebhookHandler: Webhook processed successfully', [
                'event' => $event,
                'payment_id' => $paymentId,
            ]);
        } catch (CannotAcceptPaymentException $exception) {
            $this->logger->error('Cannot accept Asaas payment', [
                'exception' => $exception->getMessage(),
                'payment_data' => $webhookDTO->payment,
            ]);

            throw $exception;
        } catch (Throwable $exception) {
            $this->logger->error('Failed to handle Asaas webhook', [
                'exception' => $exception->getMessage(),
                'event' => $webhookDTO->event,
                'payment_data' => $webhookDTO->payment,
            ]);

            throw $exception;
        }
    }

    private function hasEventBeenHandled(string $event, ?string $paymentId): bool
    {
        if (!$paymentId) {
            return false;
        }

        $cacheKey = "asaas_event_{$event}_{$paymentId}";
        return $this->cache->has($cacheKey);
    }

    private function markEventAsHandled(string $event, ?string $paymentId): void
    {
        if (!$paymentId) {
            return;
        }

        $this->logger->info('Marking Asaas event as handled', [
            'event' => $event,
            'payment_id' => $paymentId,
        ]);

        $cacheKey = "asaas_event_{$event}_{$paymentId}";
        $this->cache->put($cacheKey, true, now()->addMinutes(60));
    }
}

