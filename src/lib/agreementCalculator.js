import { dateDiffInDays } from "./dates.js";
import { buildInstallmentSchedule } from "./installments.js";
import { roundCurrency } from "./money.js";

// Aplica a regra financeira do acordo pre-fixado com parcela Price no modelo Pre.
export function calculateAgreement({
  totalDebt,
  downPayment = 0,
  monthlyRatePercent,
  attorneyFeesAmount = 0,
  installmentCount,
  agreementDate,
  firstInstallmentDate,
}) {
  const normalizedTotalDebt = roundCurrency(Math.max(totalDebt, 0));
  const normalizedAttorneyFeesAmount = roundCurrency(Math.max(attorneyFeesAmount, 0));
  const agreementBaseAmount = roundCurrency(
    normalizedTotalDebt + normalizedAttorneyFeesAmount,
  );
  const normalizedDownPayment = roundCurrency(
    Math.min(Math.max(downPayment, 0), agreementBaseAmount),
  );
  const financedBalance = roundCurrency(
    Math.max(agreementBaseAmount - normalizedDownPayment, 0),
  );
  const monthlyRate = monthlyRatePercent / 100;
  const prorataDays = Math.max(dateDiffInDays(agreementDate, firstInstallmentDate), 0);
  const dailyRate = monthlyRate / 30;
  const pricePrePeriod = prorataDays;
  const correctedBalance = roundCurrency(
    financedBalance * Math.pow(1 + dailyRate, prorataDays),
  );

  let installmentAmountExact = 0;
  if (installmentCount > 0) {
    installmentAmountExact = monthlyRate === 0
      ? correctedBalance / installmentCount
      : correctedBalance *
          (
            monthlyRate /
            ((1 - Math.pow(1 + monthlyRate, -installmentCount)) * (1 + monthlyRate))
          );
  }

  const schedule = buildInstallmentSchedule({
    correctedBalance,
    monthlyRate,
    installmentCount,
    firstInstallmentDate,
    installmentAmountExact,
  });
  const installmentAmount = roundCurrency(installmentAmountExact);
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
    attorneyFeesAmount: normalizedAttorneyFeesAmount,
    agreementBaseAmount,
    downPayment: normalizedDownPayment,
    financedBalance,
    monthlyRatePercent,
    installmentCount,
    agreementDate,
    firstInstallmentDate,
    prorataDays,
    pricePrePeriod,
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
