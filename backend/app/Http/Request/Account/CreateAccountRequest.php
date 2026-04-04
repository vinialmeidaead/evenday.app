<?php

declare(strict_types=1);

namespace HiEvents\Http\Request\Account;

use HiEvents\Http\Request\BaseRequest;
use HiEvents\Locale;
use HiEvents\Validators\Rules\RulesHelper;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class CreateAccountRequest extends BaseRequest
{
    public const PIX_KEY_TYPES = ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP'];

    protected function prepareForValidation(): void
    {
        $taxId = $this->input('organizer_tax_id');
        if (is_string($taxId)) {
            $this->merge([
                'organizer_tax_id' => preg_replace('/\D/', '', $taxId),
            ]);
        }

        $ig = $this->input('instagram');
        if (is_string($ig)) {
            $this->merge([
                'instagram' => ltrim(trim($ig), '@'),
            ]);
        }

        $pix = $this->input('pix_key_value');
        if (is_string($pix)) {
            $this->merge(['pix_key_value' => trim($pix)]);
        }

        $loc = $this->input('location_details');
        if (is_array($loc) && isset($loc['country']) && is_string($loc['country'])) {
            $loc['country'] = strtoupper(trim($loc['country']));
            $this->merge(['location_details' => $loc]);
        }
    }

    public function rules(): array
    {
        $currencies = include __DIR__ . '/../../../../data/currencies.php';

        return [
            'first_name' => RulesHelper::REQUIRED_STRING,
            'last_name' => RulesHelper::REQUIRED_STRING,
            'email' => RulesHelper::REQUIRED_EMAIL,
            'password' => ['required', 'confirmed', Password::min(8)],
            'timezone' => ['timezone:all'],
            'currency_code' => [Rule::in(array_values($currencies))],
            'locale' => ['nullable', Rule::in(Locale::getSupportedLocales())],
            'invite_token' => ['nullable', 'string'],

            'phone' => ['required', 'string', 'min:10', 'max:20'],
            'instagram' => ['required', 'string', 'max:255'],
            'organizer_tax_id_type' => ['required', Rule::in(['CPF', 'CNPJ'])],
            'organizer_tax_id' => [
                'required',
                'string',
                'regex:/^\d+$/',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!is_string($value)) {
                        return;
                    }
                    $type = $this->input('organizer_tax_id_type');
                    $len = strlen($value);
                    if ($type === 'CPF' && $len !== 11) {
                        $fail(__('O CPF deve conter exatamente 11 dígitos.'));
                    }
                    if ($type === 'CNPJ' && $len !== 14) {
                        $fail(__('O CNPJ deve conter exatamente 14 dígitos.'));
                    }
                },
            ],
            'pix_key_type' => ['required', 'string', Rule::in(self::PIX_KEY_TYPES)],
            'pix_key_value' => ['required', 'string', 'max:500'],
            'declaration_accepted' => ['required', 'accepted'],

            'location_details' => ['required', 'array'],
            'location_details.zip_or_postal_code' => ['required', 'string', 'max:20'],
            'location_details.address_line_1' => ['required', 'string', 'max:255'],
            'location_details.address_line_2' => ['nullable', 'string', 'max:255'],
            'location_details.city' => ['required', 'string', 'max:85'],
            'location_details.state_or_region' => ['required', 'string', 'max:85'],
            'location_details.country' => ['required', 'string', 'size:2'],
            'location_details.venue_name' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'phone' => __('WhatsApp'),
            'instagram' => __('Instagram'),
            'organizer_tax_id' => __('CPF/CNPJ'),
            'organizer_tax_id_type' => __('Tipo de documento'),
            'pix_key_type' => __('Tipo de chave PIX'),
            'pix_key_value' => __('Chave PIX'),
            'location_details.zip_or_postal_code' => __('CEP'),
            'location_details.address_line_1' => __('Endereço'),
            'location_details.city' => __('Cidade'),
            'location_details.state_or_region' => __('Estado'),
            'location_details.country' => __('País'),
            'declaration_accepted' => __('Declaração'),
        ];
    }
}
