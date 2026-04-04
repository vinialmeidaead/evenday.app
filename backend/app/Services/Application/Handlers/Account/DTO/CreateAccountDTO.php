<?php

namespace HiEvents\Services\Application\Handlers\Account\DTO;

use HiEvents\DataTransferObjects\BaseDTO;

final class CreateAccountDTO extends BaseDTO
{
    /**
     * @param array<string, string|null> $location_details
     */
    public function __construct(
        public readonly string  $email,
        public readonly string  $password,
        public readonly string  $first_name,
        public readonly string  $locale,
        public readonly string  $phone,
        public readonly string  $instagram,
        public readonly string  $organizer_tax_id_type,
        public readonly string  $organizer_tax_id,
        public readonly string  $pix_key_type,
        public readonly string  $pix_key_value,
        public readonly array   $location_details,
        public readonly bool    $declaration_accepted,
        public readonly string  $last_name,
        public readonly ?string $timezone = null,
        public readonly ?string $currency_code = null,
        public readonly ?string $invite_token = null,
    )
    {
    }
}
