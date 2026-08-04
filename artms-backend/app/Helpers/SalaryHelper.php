<?php

namespace App\Helpers;

class SalaryHelper
{
    /**
     * Compute salary breakdown for a given monthly min and max salary.
     *
     * Standard PH Labor Standard formulas:
     * - Annual = Monthly * 12
     * - Weekly = Annual / 52
     * - Daily  = Annual / 261 (assuming standard 5-day work week of 261 days/year)
     * - Hourly = Daily / 8
     *
     * @param float|int|null $min
     * @param float|int|null $max
     * @param string|null $type 'exact' or 'range'
     * @return array|null
     */
    public static function compute($min, $max = null, $type = 'exact')
    {
        $minVal = $min !== null && $min !== '' ? floatval($min) : null;
        $maxVal = $max !== null && $max !== '' ? floatval($max) : null;

        if ($minVal === null && $maxVal === null) {
            return null;
        }

        $isExact = $type === 'exact' || ($minVal !== null && $minVal === $maxVal) || $maxVal === null;

        if ($isExact && $minVal !== null) {
            $monthly = $minVal;
            $annual  = $monthly * 12;
            $weekly  = $annual / 52;
            $daily   = $annual / 261;
            $hourly  = $daily / 8;

            return [
                'type' => 'exact',
                'monthly' => round($monthly, 2),
                'weekly'  => round($weekly, 2),
                'daily'   => round($daily, 2),
                'hourly'  => round($hourly, 2),
            ];
        }

        // Salary Range
        $minMonthly = $minVal ?? 0;
        $maxMonthly = $maxVal ?? $minMonthly;

        $minAnnual = $minMonthly * 12;
        $maxAnnual = $maxMonthly * 12;

        return [
            'type' => 'range',
            'monthly' => ['min' => round($minMonthly, 2), 'max' => round($maxMonthly, 2)],
            'weekly'  => ['min' => round($minAnnual / 52, 2), 'max' => round($maxAnnual / 52, 2)],
            'daily'   => ['min' => round($minAnnual / 261, 2), 'max' => round($maxAnnual / 261, 2)],
            'hourly'  => ['min' => round(($minAnnual / 261) / 8, 2), 'max' => round(($maxAnnual / 261) / 8, 2)],
        ];
    }
}
