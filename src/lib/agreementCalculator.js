import { dateDiffInDays } from "./dates.js";
<<<<<<< HEAD
import { buildInstallmentSchedule } from "./installments.js";
=======
>>>>>>> ab550870fd549ed22a3618a73191a427c65de7da
import { roundCurrency } from "./money.js";

// Aplica a regra financeira do acordo pre-fixado com correcao pro rata e parcela Price.
export function calculateAgreement({
  totalDebt,
  monthlyRatePercent,
  installmentCount,
  agreementDate,
  firstInstallmentDate
}) {
  const financedBalance = roundCurrency(Math.max(totalDebt, 0));
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
<<<<<<< HEAD
  const schedule = buildInstallmentSchedule({
    correctedBalance,
    monthlyRate,
    installmentCount,
    firstInstallmentDate,
    installmentAmountExact,
  });
  const totalPaid = roundCurrency(
    schedule.reduce((total, installment) => total + installment.installmentAmount, 0),
  );
=======
  const totalPaid = roundCurrency(installmentAmountExact * installmentCount);
>>>>>>> ab550870fd549ed22a3618a73191a427c65de7da
  const totalInterest = roundCurrency(totalPaid - financedBalance);
  const interestPercent = financedBalance > 0 ? (totalInterest / financedBalance) * 100 : 0;
  const effectiveCostPercent = financedBalance > 0 ? (totalInterest / financedBalance) * 100 : 0;

  return {
    totalDebt,
    financedBalance,
    monthlyRatePercent,
    installmentCount,
    agreementDate,
    firstInstallmentDate,
    prorataDays,
    dailyRatePercent: dailyRate * 100,
    correctedBalance,
    installmentAmount,
<<<<<<< HEAD
    schedule,
=======
>>>>>>> ab550870fd549ed22a3618a73191a427c65de7da
    totalPaid,
    totalInterest,
    interestPercent,
    effectiveCostPercent
  };
}
