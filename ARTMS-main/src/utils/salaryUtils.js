/**
 * Utility functions for calculating and formatting salary breakdown rates
 * (Weekly, Daily, Hourly) from Monthly Salary inputs.
 *
 * Formulas based on standard PH Labor Standard (261 working days / year):
 * - Annual = Monthly * 12
 * - Weekly = Annual / 52
 * - Daily  = Annual / 261 (approx 21.75 working days / month)
 * - Hourly = Daily / 8
 */

export const fmtMoney = (val) => {
  if (val == null || val === "" || isNaN(val)) return "—";
  const num = Number(val);
  return "₱" + num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function calculateSalaryBreakdown(min, max, type = 'exact') {
  const minVal = min !== null && min !== "" && !isNaN(min) ? Number(min) : null;
  const maxVal = max !== null && max !== "" && !isNaN(max) ? Number(max) : null;

  if (minVal === null && maxVal === null) return null;

  const isExact = type === 'exact' || (minVal !== null && minVal === maxVal) || maxVal === null;

  if (isExact && minVal !== null) {
    const monthly = minVal;
    const annual = monthly * 12;
    const weekly = annual / 52;
    const daily = annual / 261;
    const hourly = daily / 8;

    return {
      type: 'exact',
      monthly,
      weekly,
      daily,
      hourly,
      formatted: {
        monthly: fmtMoney(monthly),
        weekly: fmtMoney(weekly),
        daily: fmtMoney(daily),
        hourly: fmtMoney(hourly),
      }
    };
  }

  // Salary Range
  const minMonthly = minVal ?? 0;
  const maxMonthly = maxVal ?? minMonthly;

  const minAnnual = minMonthly * 12;
  const maxAnnual = maxMonthly * 12;

  const minWeekly = minAnnual / 52;
  const maxWeekly = maxAnnual / 52;

  const minDaily = minAnnual / 261;
  const maxDaily = maxAnnual / 261;

  const minHourly = minDaily / 8;
  const maxHourly = maxDaily / 8;

  return {
    type: 'range',
    monthly: { min: minMonthly, max: maxMonthly },
    weekly: { min: minWeekly, max: maxWeekly },
    daily: { min: minDaily, max: maxDaily },
    hourly: { min: minHourly, max: maxHourly },
    formatted: {
      monthly: `${fmtMoney(minMonthly)} – ${fmtMoney(maxMonthly)}`,
      weekly: `${fmtMoney(minWeekly)} – ${fmtMoney(maxWeekly)}`,
      daily: `${fmtMoney(minDaily)} – ${fmtMoney(maxDaily)}`,
      hourly: `${fmtMoney(minHourly)} – ${fmtMoney(maxHourly)}`,
    }
  };
}
