<?php

namespace HiEvents\Services\Domain\Payment\Asaas\DTO;

class InstallmentCalculationResult
{
    public function __construct(
        public readonly float $originalValue,
        public readonly int $installmentCount,
        public readonly float $surchargePercentage,
        public readonly float $totalValue,
        public readonly float $installmentValue,
    ) {
    }

    /**
     * Retorna o valor do acréscimo em reais
     */
    public function getSurchargeAmount(): float
    {
        return $this->totalValue - $this->originalValue;
    }

    /**
     * Retorna os dados formatados para array
     */
    public function toArray(): array
    {
        return [
            'original_value' => $this->originalValue,
            'installment_count' => $this->installmentCount,
            'surcharge_percentage' => $this->surchargePercentage,
            'surcharge_amount' => $this->getSurchargeAmount(),
            'total_value' => $this->totalValue,
            'installment_value' => $this->installmentValue,
        ];
    }
}
