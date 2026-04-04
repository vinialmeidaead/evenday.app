<?php

declare(strict_types=1);

namespace HiEvents\Http\Request\Account;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('organizer_tax_id') && is_string($this->input('organizer_tax_id'))) {
            $this->merge([
                'organizer_tax_id' => preg_replace('/\D/', '', $this->input('organizer_tax_id')),
            ]);
        }

        if ($this->has('pix_key_value') && is_string($this->input('pix_key_value'))) {
            $this->merge(['pix_key_value' => trim($this->input('pix_key_value'))]);
        }
    }

    public function rules(): array
    {
        $currencies = include __DIR__ . '/../../../../data/currencies.php';

        return [
            'name' => 'required|string',
            'timezone' => 'required|timezone:all',
            'currency_code' => [Rule::in(array_values($currencies))],

            'organizer_tax_id_type' => ['sometimes', 'nullable', Rule::in(['CPF', 'CNPJ'])],
            'organizer_tax_id' => [
                'sometimes',
                'nullable',
                'string',
                'regex:/^\d*$/',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || $value === '') {
                        return;
                    }
                    if (!is_string($value)) {
                        return;
                    }
                    $type = $this->input('organizer_tax_id_type');
                    $len = strlen($value);
                    if (!$type) {
                        $fail(__('Selecione o tipo de documento (CPF ou CNPJ).'));

                        return;
                    }
                    if ($type === 'CPF' && $len !== 11) {
                        $fail(__('O CPF deve conter exatamente 11 dígitos.'));
                    }
                    if ($type === 'CNPJ' && $len !== 14) {
                        $fail(__('O CNPJ deve conter exatamente 14 dígitos.'));
                    }
                },
            ],
            'pix_key_type' => ['sometimes', 'nullable', 'string', Rule::in(CreateAccountRequest::PIX_KEY_TYPES)],
            'pix_key_value' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
