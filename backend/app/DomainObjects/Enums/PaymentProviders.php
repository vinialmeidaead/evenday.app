<?php

namespace HiEvents\DomainObjects\Enums;

enum PaymentProviders: string
{
    use BaseEnum;

    case STRIPE = 'STRIPE';
    case OFFLINE = 'OFFLINE';
    case ASAAS_PIX = 'ASAAS_PIX';
    case ASAAS_CREDIT_CARD = 'ASAAS_CREDIT_CARD';
}
