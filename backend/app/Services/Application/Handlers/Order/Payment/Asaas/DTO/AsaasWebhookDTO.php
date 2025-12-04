<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO;

use HiEvents\DataTransferObjects\BaseDTO;

class AsaasWebhookDTO extends BaseDTO
{
    public function __construct(
        public readonly string $event,
        public readonly array  $payment,
        public readonly ?string $accessToken = null,
    )
    {
    }

    public static function fromRequest(array $data, ?string $accessToken = null): self
    {
        return new self(
            event: $data['event'] ?? '',
            payment: $data['payment'] ?? [],
            accessToken: $accessToken,
        );
    }
}

