<?php

namespace HiEvents\Http\Actions\Orders\Payment\Asaas;

use HiEvents\Exceptions\Asaas\CreatePixPaymentFailedException;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\CreatePixPaymentHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class CreatePixPaymentActionPublic extends BaseAction
{
    public function __construct(
        private readonly CreatePixPaymentHandler $createPixPaymentHandler,
    )
    {
        logger()->debug('CreatePixPaymentActionPublic: Constructor called', [
            'handler_class' => get_class($this->createPixPaymentHandler),
        ]);
    }

    public function __invoke(Request $request, int $eventId, string $orderShortId): JsonResponse
    {
        logger()->info('CreatePixPaymentActionPublic: Request received', [
            'event_id' => $eventId,
            'order_short_id' => $orderShortId,
            'request_method' => request()->method(),
            'request_url' => request()->fullUrl(),
            'request_headers' => request()->headers->all(),
        ]);

        try {
            // Valida CPF/CNPJ
            $validated = $request->validate([
                'cpf_cnpj' => ['required', 'string', 'regex:/^[0-9]{11,14}$/'],
            ], [
                'cpf_cnpj.required' => __('CPF or CNPJ is required for Pix payments.'),
                'cpf_cnpj.regex' => __('CPF must have 11 digits or CNPJ must have 14 digits.'),
            ]);

            // Remove caracteres não numéricos
            $cpfCnpj = preg_replace('/\D/', '', $validated['cpf_cnpj']);

            if (strlen($cpfCnpj) !== 11 && strlen($cpfCnpj) !== 14) {
                throw ValidationException::withMessages([
                    'cpf_cnpj' => __('CPF must have 11 digits or CNPJ must have 14 digits.'),
                ]);
            }

            $paymentResponse = $this->createPixPaymentHandler->handle($orderShortId, $cpfCnpj);

            logger()->info('CreatePixPaymentActionPublic: Payment created successfully', [
                'event_id' => $eventId,
                'order_short_id' => $orderShortId,
                'payment_id' => $paymentResponse->paymentId,
            ]);

            return $this->jsonResponse([
                'payment_id' => $paymentResponse->paymentId,
                'pix_code' => $paymentResponse->pixCode,
                'qr_code_image' => $paymentResponse->qrCodeImage,
                'expiration_date' => $paymentResponse->expirationDate,
                'status' => $paymentResponse->status,
            ]);
        } catch (CreatePixPaymentFailedException $e) {
            logger()->error('CreatePixPaymentActionPublic: Failed to create payment', [
                'event_id' => $eventId,
                'order_short_id' => $orderShortId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Throwable $e) {
            logger()->error('CreatePixPaymentActionPublic: Unexpected error', [
                'event_id' => $eventId,
                'order_short_id' => $orderShortId,
                'error' => $e->getMessage(),
                'exception_class' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                __('An unexpected error occurred. Please try again later.'),
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}

