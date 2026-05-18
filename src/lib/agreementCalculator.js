import {
  countBusinessDaysInclusive,
} from "./dates.js";
import { buildInstallmentSchedule, buildOpeningBalanceRow } from "./installments.js";
import { roundCurrency } from "./money.js";

const BUSINESS_DAYS_IN_FINANCIAL_MONTH = 22;

// Aplica a regra financeira do acordo pre-fixado com parcela Price no modelo Pre.
export function calculateAgreement({
  totalDebt,
  downPayment = 0,
  monthlyRatePercent,
  attorneyFeesAmount = 0,
  legalCostsAmount = 0,
  installmentCount,
  agreementDate,
  firstInstallmentDate,
  downPaymentDate = agreementDate,
}) {
  const normalizedBaseDebt = roundCurrency(Math.max(totalDebt, 0));
  const normalizedLegalCostsAmount = roundCurrency(Math.max(legalCostsAmount, 0));
  const normalizedTotalDebt = roundCurrency(
    normalizedBaseDebt + normalizedLegalCostsAmount,
  );
  const normalizedAttorneyFeesAmount = roundCurrency(Math.max(attorneyFeesAmount, 0));
  const agreementBaseAmount = roundCurrency(
    normalizedTotalDebt + normalizedAttorneyFeesAmount,
  );
  const normalizedDownPayment = roundCurrency(
    Math.min(Math.max(downPayment, 0), agreementBaseAmount),
  );
  const monthlyRate = monthlyRatePercent / 100;
  const dailyRate = monthlyRate / BUSINESS_DAYS_IN_FINANCIAL_MONTH;
  const hasDownPayment = normalizedDownPayment > 0;
  const effectiveDownPaymentDate = hasDownPayment ? downPaymentDate : agreementDate;
  const entryProrataDays = hasDownPayment
    ? countBusinessDaysInclusive(agreementDate, effectiveDownPaymentDate)
    : 0;
  const downPaymentInterest = hasDownPayment
    ? roundCurrency(
        agreementBaseAmount *
          (Math.pow(
            1 + monthlyRate,
            entryProrataDays / BUSINESS_DAYS_IN_FINANCIAL_MONTH,
          ) - 1),
      )
    : 0;
  const downPaymentBalanceBeforePayment = roundCurrency(
    agreementBaseAmount + downPaymentInterest,
  );
  const downPaymentAmortization = hasDownPayment
    ? roundCurrency(normalizedDownPayment - downPaymentInterest)
    : 0;
  const balanceAfterDownPayment = hasDownPayment
    ? roundCurrency(Math.max(downPaymentBalanceBeforePayment - normalizedDownPayment, 0))
    : agreementBaseAmount;

  // Sem entrada, o modelo segue Price Pre com pro rata ate a primeira parcela.
  const prorataDays = hasDownPayment
    ? entryProrataDays
    : countBusinessDaysInclusive(agreementDate, firstInstallmentDate);
  const pricePrePeriod = hasDownPayment ? 0 : prorataDays;
  const financedBalance = hasDownPayment
    ? balanceAfterDownPayment
    : roundCurrency(Math.max(agreementBaseAmount, 0));
  const correctedBalance = hasDownPayment
    ? financedBalance
    : roundCurrency(
        financedBalance *
          (
            Math.pow(
              1 + monthlyRate,
              prorataDays / BUSINESS_DAYS_IN_FINANCIAL_MONTH,
            )
          ),
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

  const installmentSchedule = buildInstallmentSchedule({
    correctedBalance,
    monthlyRate,
    installmentCount,
    firstInstallmentDate,
    installmentAmountExact,
    paymentTiming: "advance",
  });
  const schedule = hasDownPayment
    ? [
        buildOpeningBalanceRow({
          balance: correctedBalance,
          dueDate: effectiveDownPaymentDate,
        }),
        ...installmentSchedule,
      ]
    : installmentSchedule;
  const installmentAmount = roundCurrency(installmentAmountExact);
  const installmentTotal = roundCurrency(installmentAmountExact * installmentCount);
  const totalPaid = roundCurrency(
    normalizedDownPayment + installmentTotal,
  );
  const financedInterest = hasDownPayment
    ? roundCurrency(installmentTotal - correctedBalance)
    : roundCurrency(totalPaid - normalizedDownPayment - financedBalance);
  const totalInterest = roundCurrency(totalPaid - normalizedTotalDebt);
  const interestPercent = financedBalance > 0 ? (financedInterest / financedBalance) * 100 : 0;
  const downPaymentEvent = hasDownPayment
    ? {
        dueDate: effectiveDownPaymentDate,
        startingBalance: agreementBaseAmount,
        interest: downPaymentInterest,
        paymentAmount: normalizedDownPayment,
        amortization: downPaymentAmortization,
        remainingBalance: balanceAfterDownPayment,
        prorataDays: entryProrataDays,
      }
    : null;

  return {
    baseDebt: normalizedBaseDebt,
    totalDebt: normalizedTotalDebt,
    attorneyFeesAmount: normalizedAttorneyFeesAmount,
    legalCostsAmount: normalizedLegalCostsAmount,
    agreementBaseAmount,
    downPayment: normalizedDownPayment,
    financedBalance,
    monthlyRatePercent,
    installmentCount,
    agreementDate,
    firstInstallmentDate,
    downPaymentDate: effectiveDownPaymentDate,
    prorataDays,
    entryProrataDays,
    pricePrePeriod,
    dailyRatePercent: dailyRate * 100,
    correctedBalance,
    installmentAmount,
    schedule,
    totalPaid,
    financedInterest,
    totalInterest,
    interestPercent,
    downPaymentEvent,
  };
}
