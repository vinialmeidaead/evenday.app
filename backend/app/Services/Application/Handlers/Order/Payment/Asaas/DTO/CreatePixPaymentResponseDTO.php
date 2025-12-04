<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO;

use HiEvents\DataTransferObjects\BaseDTO;

class CreatePixPaymentResponseDTO extends BaseDTO
{
    public function __construct(
        public readonly string $paymentId,
        public readonly string $pixCode,
        public readonly ?string $qrCodeImage,
        public readonly string $expirationDate,
        public readonly string $status,
    )
    {
    }
}

