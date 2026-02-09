<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO;

use HiEvents\DataTransferObjects\BaseDTO;
use HiEvents\DomainObjects\OrderDomainObject;
use HiEvents\Values\MoneyValue;

class CreateCreditCardPaymentRequestDTO extends BaseDTO
{
    public function __construct(
        public readonly MoneyValue        $amount,
        public readonly string            $currencyCode,
        public readonly OrderDomainObject $order,
        public readonly string            $cpfCnpj,
        public readonly string            $holderName,
        public readonly string            $cardNumber,
        public readonly string            $expiryMonth,
        public readonly string            $expiryYear,
        public readonly string            $ccv,
        public readonly string            $postalCode,
        public readonly string            $addressNumber,
        public readonly ?string           $addressComplement,
        public readonly string            $phone,
        public readonly ?string           $mobilePhone,
        public readonly int                $installmentCount = 1,
    )
    {
    }
}
