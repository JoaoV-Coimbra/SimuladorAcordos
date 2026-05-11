import { dateDiffInDays } from "./dates.js";
import { buildInstallmentSchedule } from "./installments.js";
import { roundCurrency } from "./money.js";

// Aplica a regra financeira do acordo pre-fixado com parcela Price no modelo Pre.
export function calculateAgreement({
  totalDebt,
  downPayment = 0,
  monthlyRatePercent,
  attorneyFeesPercent = 0,
  installmentCount,
  agreementDate,
  firstInstallmentDate,
}) {
  const normalizedTotalDebt = roundCurrency(Math.max(totalDebt, 0));
  const normalizedAttorneyFeesPercent = Math.max(attorneyFeesPercent, 0);
  const attorneyFeesAmount = roundCurrency(
    normalizedTotalDebt * (normalizedAttorneyFeesPercent / 100),
  );
  const agreementBaseAmount = roundCurrency(normalizedTotalDebt + attorneyFeesAmount);
  const normalizedDownPayment = roundCurrency(
    Math.min(Math.max(downPayment, 0), agreementBaseAmount),
  );
  const financedBalance = roundCurrency(
    Math.max(agreementBaseAmount - normalizedDownPayment, 0),
  );
  const monthlyRate = monthlyRatePercent / 100;
  const prorataDays = Math.max(dateDiffInDays(agreementDate, firstInstallmentDate), 0);
  const pricePrePeriod = monthlyRate === 0 ? 0 : -1;
  const correctedBalance = roundCurrency(
    financedBalance * Math.pow(1 + monthlyRate, pricePrePeriod),
  );

  let installmentAmountExact = 0;
  if (installmentCount > 0) {
    installmentAmountExact = monthlyRate === 0
      ? correctedBalance / installmentCount
      : correctedBalance *
          (monthlyRate / (1 - Math.pow(1 + monthlyRate, -installmentCount)));
  }

  const installmentAmount = roundCurrency(installmentAmountExact);
  const schedule = buildInstallmentSchedule({
    financedBalance,
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
    attorneyFeesPercent: normalizedAttorneyFeesPercent,
    attorneyFeesAmount,
    agreementBaseAmount,
    downPayment: normalizedDownPayment,
    financedBalance,
    monthlyRatePercent,
    installmentCount,
    agreementDate,
    firstInstallmentDate,
    prorataDays,
    pricePrePeriod,
    dailyRatePercent: monthlyRate / 30 * 100,
    correctedBalance,
    installmentAmount,
    schedule,
    totalPaid,
    financedInterest,
    totalInterest,
    interestPercent,
  };
}
