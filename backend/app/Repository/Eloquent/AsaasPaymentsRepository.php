<?php

namespace HiEvents\Repository\Eloquent;

use HiEvents\DomainObjects\AsaasPaymentDomainObject;
use HiEvents\Models\AsaasPayment;
use HiEvents\Repository\Interfaces\AsaasPaymentsRepositoryInterface;

class AsaasPaymentsRepository extends BaseRepository implements AsaasPaymentsRepositoryInterface
{
    protected function getModel(): string
    {
        return AsaasPayment::class;
    }

    public function getDomainObject(): string
    {
        return AsaasPaymentDomainObject::class;
    }
}

