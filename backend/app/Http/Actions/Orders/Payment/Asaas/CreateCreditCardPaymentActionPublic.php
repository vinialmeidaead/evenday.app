<?php

namespace HiEvents\Http\Actions\Orders\Payment\Asaas;

use HiEvents\Exceptions\Asaas\CreateCreditCardPaymentFailedException;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\CreateCreditCardPaymentHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class CreateCreditCardPaymentActionPublic extends BaseAction
{
    public function __construct(
        private readonly CreateCreditCardPaymentHandler $createCreditCardPaymentHandler,
    )
    {
        logger()->debug('CreateCreditCardPaymentActionPublic: Constructor called', [
            'handler_class' => get_class($this->createCreditCardPaymentHandler),
        ]);
    }

    public function __invoke(Request $request, int $eventId, string $orderShortId): JsonResponse
    {
        logger()->info('CreateCreditCardPaymentActionPublic: Request received', [
            'event_id' => $eventId,
            'order_short_id' => $orderShortId,
            'request_method' => request()->method(),
            'request_url' => request()->fullUrl(),
        ]);

        try {
            // Valida dados do cartão
            $validated = $request->validate([
                'cpf_cnpj' => ['required', 'string', 'regex:/^[0-9]{11,14}$/'],
                'holder_name' => ['required', 'string', 'max:255'],
                'card_number' => ['required', 'string', 'regex:/^[0-9\s]{13,19}$/'],
                'expiry_month' => ['required', 'string', 'regex:/^(0?[1-9]|1[0-2])$/'],
                'expiry_year' => ['required', 'string', 'regex:/^\d{4}$/'],
                'ccv' => ['required', 'string', 'regex:/^\d{3,4}$/'],
                'postal_code' => ['required', 'string', 'regex:/^[0-9]{8}$/'],
                'address_number' => ['required', 'string', 'max:10'],
                'address_complement' => ['nullable', 'string', 'max:255'],
                'phone' => ['required', 'string', 'regex:/^[0-9]{10,11}$/'],
                'mobile_phone' => ['nullable', 'string', 'regex:/^[0-9]{10,11}$/'],
            ], [
                'cpf_cnpj.required' => __('CPF or CNPJ is required for credit card payments.'),
                'cpf_cnpj.regex' => __('CPF must have 11 digits or CNPJ must have 14 digits.'),
                'holder_name.required' => __('Cardholder name is required.'),
                'card_number.required' => __('Card number is required.'),
                'card_number.regex' => __('Invalid card number format.'),
                'expiry_month.required' => __('Expiry month is required.'),
                'expiry_month.regex' => __('Invalid expiry month.'),
                'expiry_year.required' => __('Expiry year is required.'),
                'expiry_year.regex' => __('Invalid expiry year format.'),
                'ccv.required' => __('CVV is required.'),
                'ccv.regex' => __('CVV must have 3 or 4 digits.'),
                'postal_code.required' => __('Postal code is required.'),
                'postal_code.regex' => __('Postal code must have 8 digits.'),
                'address_number.required' => __('Address number is required.'),
                'phone.required' => __('Phone is required.'),
                'phone.regex' => __('Invalid phone format.'),
            ]);

            // Remove caracteres não numéricos
            $validated['cpf_cnpj'] = preg_replace('/\D/', '', $validated['cpf_cnpj']);

            if (strlen($validated['cpf_cnpj']) !== 11 && strlen($validated['cpf_cnpj']) !== 14) {
                throw ValidationException::withMessages([
                    'cpf_cnpj' => __('CPF must have 11 digits or CNPJ must have 14 digits.'),
                ]);
            }

            // Valida se o ano de expiração não está no passado
            $expiryYear = (int)$validated['expiry_year'];
            $expiryMonth = (int)$validated['expiry_month'];
            $currentYear = (int)date('Y');
            $currentMonth = (int)date('m');

            if ($expiryYear < $currentYear || ($expiryYear === $currentYear && $expiryMonth < $currentMonth)) {
                throw ValidationException::withMessages([
                    'expiry_month' => __('Card has expired.'),
                ]);
            }

            $paymentResponse = $this->createCreditCardPaymentHandler->handle($orderShortId, $validated);

            logger()->info('CreateCreditCardPaymentActionPublic: Payment created successfully', [
                'event_id' => $eventId,
                'order_short_id' => $orderShortId,
                'payment_id' => $paymentResponse->paymentId,
            ]);

            return $this->jsonResponse([
                'payment_id' => $paymentResponse->paymentId,
                'status' => $paymentResponse->status,
                'credit_card_number' => $paymentResponse->creditCardNumber,
                'credit_card_brand' => $paymentResponse->creditCardBrand,
            ]);
        } catch (CreateCreditCardPaymentFailedException $e) {
            logger()->error('CreateCreditCardPaymentActionPublic: Failed to create payment', [
                'event_id' => $eventId,
                'order_short_id' => $orderShortId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Throwable $e) {
            logger()->error('CreateCreditCardPaymentActionPublic: Unexpected error', [
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
