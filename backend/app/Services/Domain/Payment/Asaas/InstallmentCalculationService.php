<?php

namespace HiEvents\Services\Domain\Payment\Asaas;

use HiEvents\Services\Domain\Payment\Asaas\DTO\InstallmentCalculationResult;

class InstallmentCalculationService
{
    /**
     * Tabela de acréscimos por número de parcelas
     */
    private const INSTALLMENT_SURCHARGES = [
        1 => 0.00,
        2 => 6.30,
        3 => 7.70,
        4 => 9.00,
        5 => 10.30,
        6 => 11.60,
        7 => 12.90,
        8 => 14.20,
        9 => 15.50,
        10 => 16.80,
        11 => 18.10,
        12 => 19.40,
    ];

    /**
     * Calcula o valor total com acréscimo baseado no número de parcelas
     *
     * @param float $originalValue Valor original sem acréscimo
     * @param int $installmentCount Número de parcelas (1 a 12)
     * @return InstallmentCalculationResult Resultado do cálculo
     */
    public function calculate(float $originalValue, int $installmentCount): InstallmentCalculationResult
    {
        if ($installmentCount < 1 || $installmentCount > 12) {
            throw new \InvalidArgumentException(
                __('Installment count must be between 1 and 12.')
            );
        }

        $surchargePercentage = self::INSTALLMENT_SURCHARGES[$installmentCount];
        
        // Calcula o valor total com acréscimo
        $totalValue = $originalValue * (1 + ($surchargePercentage / 100));
        
        // Calcula o valor de cada parcela
        // Se for 1x, não divide
        if ($installmentCount === 1) {
            $installmentValue = $totalValue;
        } else {
            // Divide o valor total pelo número de parcelas
            // A diferença será compensada na última parcela conforme documentação do Asaas
            $installmentValue = floor(($totalValue * 100) / $installmentCount) / 100;
        }

        return new InstallmentCalculationResult(
            originalValue: $originalValue,
            installmentCount: $installmentCount,
            surchargePercentage: $surchargePercentage,
            totalValue: $totalValue,
            installmentValue: $installmentValue,
        );
    }

    /**
     * Retorna a tabela de acréscimos disponível
     *
     * @return array Array associativo [parcelas => acréscimo_percentual]
     */
    public function getSurchargeTable(): array
    {
        return self::INSTALLMENT_SURCHARGES;
    }

    /**
     * Retorna o acréscimo percentual para um número específico de parcelas
     *
     * @param int $installmentCount Número de parcelas
     * @return float Acréscimo percentual
     */
    public function getSurchargeForInstallments(int $installmentCount): float
    {
        if ($installmentCount < 1 || $installmentCount > 12) {
            throw new \InvalidArgumentException(
                __('Installment count must be between 1 and 12.')
            );
        }

        return self::INSTALLMENT_SURCHARGES[$installmentCount];
    }
}
