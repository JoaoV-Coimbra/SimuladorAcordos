import { dateDiffInDays } from "./dates.js";
import { buildInstallmentSchedule } from "./installments.js";
import { roundCurrency } from "./money.js";

// Aplica a regra financeira do acordo pre-fixado com correcao pro rata e parcela Price.
export function calculateAgreement({
  totalDebt,
  downPayment = 0,
  monthlyRatePercent,
  installmentCount,
  agreementDate,
  firstInstallmentDate,
}) {
  const normalizedTotalDebt = roundCurrency(Math.max(totalDebt, 0));
  const normalizedDownPayment = roundCurrency(
    Math.min(Math.max(downPayment, 0), normalizedTotalDebt),
  );
  const financedBalance = roundCurrency(
    Math.max(normalizedTotalDebt - normalizedDownPayment, 0),
  );
  const monthlyRate = monthlyRatePercent / 100;
  const prorataDays = Math.max(dateDiffInDays(agreementDate, firstInstallmentDate), 0);
  const dailyRate = monthlyRate / 30;
  const correctedBalance = roundCurrency(financedBalance * (1 + dailyRate * prorataDays));

  let installmentAmountExact = 0;
  if (installmentCount > 0) {
    installmentAmountExact = monthlyRate === 0
      ? correctedBalance / installmentCount
      : (
          correctedBalance *
          (monthlyRate / (1 - Math.pow(1 + monthlyRate, -installmentCount)))
        ) / (1 + monthlyRate);
  }

  const installmentAmount = roundCurrency(installmentAmountExact);
  const schedule = buildInstallmentSchedule({
    correctedBalance,
    monthlyRate,
    installmentCount,
    firstInstallmentDate,
    installmentAmountExact,
  });
  const totalPaid = roundCurrency(
    normalizedDownPayment +
      schedule.reduce((total, installment) => total + installment.installmentAmount, 0),
  );
  const financedInterest = roundCurrency(
    totalPaid - normalizedDownPayment - financedBalance,
  );
  const totalInterest = roundCurrency(totalPaid - normalizedTotalDebt);
  const interestPercent = financedBalance > 0 ? (financedInterest / financedBalance) * 100 : 0;

  return {
    totalDebt: normalizedTotalDebt,
    downPayment: normalizedDownPayment,
    financedBalance,
    monthlyRatePercent,
    installmentCount,
    agreementDate,
    firstInstallmentDate,
    prorataDays,
    dailyRatePercent: dailyRate * 100,
    correctedBalance,
    installmentAmount,
    schedule,
    totalPaid,
    financedInterest,
    totalInterest,
    interestPercent,
  };
}
