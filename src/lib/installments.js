import { addMonthsToInputDate } from "./dates.js";
import { roundCurrency } from "./money.js";

// Gera a tabela detalhada das parcelas em um fluxo Price com pagamento no inicio do periodo.
export function buildInstallmentSchedule({
  correctedBalance,
  monthlyRate,
  installmentCount,
  firstInstallmentDate,
  installmentAmountExact,
}) {
  const schedule = [];
  let carriedBalance = correctedBalance;

  for (let installmentNumber = 1; installmentNumber <= installmentCount; installmentNumber += 1) {
    const isFirstInstallment = installmentNumber === 1;
    const startingBalance = carriedBalance;
    const interestExact = isFirstInstallment ? 0 : startingBalance * monthlyRate;
    const balanceBeforePayment = startingBalance + interestExact;
    const installmentExact = installmentAmountExact;
    const amortizationExact = installmentExact - interestExact;
    const remainingBalance = Math.max(balanceBeforePayment - installmentExact, 0);
    const isLastInstallment = installmentNumber === installmentCount;
    const roundedRemainingBalance = roundCurrency(remainingBalance);

    schedule.push({
      installmentNumber,
      dueDate: addMonthsToInputDate(firstInstallmentDate, installmentNumber - 1),
      startingBalance: roundCurrency(startingBalance),
      balanceBeforePayment: roundCurrency(balanceBeforePayment),
      interest: roundCurrency(interestExact),
      installmentAmount: roundCurrency(installmentExact),
      amortization: roundCurrency(amortizationExact),
      remainingBalance: isLastInstallment && roundedRemainingBalance <= 0.01
        ? 0
        : roundedRemainingBalance,
    });

    carriedBalance = remainingBalance;
  }

  return schedule;
}
