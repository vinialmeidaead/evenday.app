<?php

namespace HiEvents\Http\Actions\Common\Webhooks;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\ResponseCodes;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO\AsaasWebhookDTO;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\IncomingWebhookHandler;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

class AsaasIncomingWebhookAction extends BaseAction
{
    public function __invoke(Request $request): Response
    {
        logger()->info('AsaasIncomingWebhookAction: Webhook received', [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'has_access_token' => $request->hasHeader('asaas-access-token'),
        ]);

        try {
            $payload = $request->all();
            $accessToken = $request->header('asaas-access-token');

            logger()->debug('AsaasIncomingWebhookAction: Webhook payload', [
                'event' => $payload['event'] ?? 'unknown',
                'payment_id' => $payload['payment']['id'] ?? null,
                'payload_keys' => array_keys($payload),
            ]);

            dispatch(static function (IncomingWebhookHandler $handler) use ($payload, $accessToken) {
                logger()->info('AsaasIncomingWebhookAction: Dispatching webhook handler');
                $handler->handle(AsaasWebhookDTO::fromRequest($payload, $accessToken));
            })->catch(function (Throwable $exception) use ($payload) {
                logger()->error('AsaasIncomingWebhookAction: Failed to handle webhook in queue', [
                    'exception' => $exception->getMessage(),
                    'exception_class' => get_class($exception),
                    'trace' => $exception->getTraceAsString(),
                    'payload' => $payload,
                ]);
            });

            logger()->info('AsaasIncomingWebhookAction: Webhook queued successfully');

        } catch (Throwable $exception) {
            logger()->error('AsaasIncomingWebhookAction: Error processing webhook', [
                'exception' => $exception->getMessage(),
                'exception_class' => get_class($exception),
                'trace' => $exception->getTraceAsString(),
            ]);

            return $this->noContentResponse(ResponseCodes::HTTP_BAD_REQUEST);
        }

        return $this->noContentResponse();
    }
}

