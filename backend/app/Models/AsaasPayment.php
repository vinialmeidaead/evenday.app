<?php

namespace HiEvents\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AsaasPayment extends BaseModel
{
    use SoftDeletes;

    protected function getTimestampsEnabled(): bool
    {
        return true;
    }

    protected function getCastMap(): array
    {
        return [
            'asaas_response' => 'array',
            'payment_date' => 'datetime',
            'expiration_date' => 'datetime',
        ];
    }

    protected function getFillableFields(): array
    {
        return [
            'order_id',
            'asaas_payment_id',
            'asaas_customer_id',
            'amount_received',
            'pix_code',
            'qr_code_image',
            'status',
            'payment_date',
            'expiration_date',
            'external_reference',
            'asaas_response',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}

