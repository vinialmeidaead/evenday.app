<?php

namespace HiEvents\Http\Actions\Orders\Payment\Asaas;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Services\Domain\Payment\Asaas\InstallmentCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CalculateInstallmentActionPublic extends BaseAction
{
    public function __construct(
        private readonly InstallmentCalculationService $installmentCalculationService,
    )
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'original_value' => ['required', 'numeric', 'min:0'],
                'installment_count' => ['required', 'integer', 'min:1', 'max:12'],
            ], [
                'original_value.required' => __('Original value is required.'),
                'original_value.numeric' => __('Original value must be a number.'),
                'original_value.min' => __('Original value must be greater than or equal to 0.'),
                'installment_count.required' => __('Installment count is required.'),
                'installment_count.integer' => __('Installment count must be an integer.'),
                'installment_count.min' => __('Installment count must be at least 1.'),
                'installment_count.max' => __('Installment count cannot exceed 12.'),
            ]);

            $calculation = $this->installmentCalculationService->calculate(
                (float)$validated['original_value'],
                (int)$validated['installment_count']
            );

            return $this->jsonResponse($calculation->toArray());
        } catch (ValidationException $e) {
            return $this->errorResponse(
                $e->getMessage(),
                422,
                ['errors' => $e->errors()]
            );
        } catch (\Throwable $e) {
            logger()->error('CalculateInstallmentActionPublic: Unexpected error', [
                'error' => $e->getMessage(),
                'exception_class' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                __('An unexpected error occurred. Please try again later.'),
                500
            );
        }
    }
}
