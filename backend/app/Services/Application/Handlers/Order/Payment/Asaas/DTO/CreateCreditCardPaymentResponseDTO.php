<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO;

use HiEvents\DataTransferObjects\BaseDTO;

class CreateCreditCardPaymentResponseDTO extends BaseDTO
{
    public function __construct(
        public readonly string $paymentId,
        public readonly string $status,
        public readonly ?string $creditCardNumber,
        public readonly ?string $creditCardBrand,
    )
    {
    }
}
