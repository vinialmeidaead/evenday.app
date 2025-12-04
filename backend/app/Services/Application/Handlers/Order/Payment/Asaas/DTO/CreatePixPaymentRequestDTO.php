<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO;

use HiEvents\DataTransferObjects\BaseDTO;
use HiEvents\DomainObjects\OrderDomainObject;
use HiEvents\Values\MoneyValue;

class CreatePixPaymentRequestDTO extends BaseDTO
{
    public function __construct(
        public readonly MoneyValue        $amount,
        public readonly string            $currencyCode,
        public readonly OrderDomainObject $order,
        public readonly string            $cpfCnpj,
    )
    {
    }
}

