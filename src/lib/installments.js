import { addMonthsToInputDate } from "./dates.js";
import { roundCurrency } from "./money.js";

// Gera a tabela detalhada das parcelas em um fluxo Price com pagamento no inicio do periodo.
export function buildInstallmentSchedule({
  correctedBalance,
  monthlyRate,
  installmentCount,
  firstInstallmentDate,
  installmentAmountExact,
  paymentTiming = "advance",
  firstInstallmentInterestExact = null,
}) {
  const schedule = [];
  let carriedBalance = correctedBalance;

  for (let installmentNumber = 1; installmentNumber <= installmentCount; installmentNumber += 1) {
    // A primeira parcela nao recebe juros mensais porque o modelo e Price Pre.
    const isFirstInstallment = installmentNumber === 1;
    const startingBalance = carriedBalance;
    const interestExact = isFirstInstallment && firstInstallmentInterestExact !== null
      ? firstInstallmentInterestExact
      : paymentTiming === "advance" && isFirstInstallment
        ? 0
        : startingBalance * monthlyRate;
    const balanceBeforePayment = startingBalance + interestExact;
    const installmentExact = installmentAmountExact;
    const amortizationExact = installmentExact - interestExact;
    const remainingBalance = Math.max(balanceBeforePayment - installmentExact, 0);
    const isLastInstallment = installmentNumber === installmentCount;
    // Pequenas sobras de arredondamento no fim sao zeradas para nao exibir centavos residuais.
    const roundedRemainingBalance = roundCurrency(remainingBalance);
    const dueDate = addMonthsToInputDate(firstInstallmentDate, installmentNumber - 1);

    schedule.push({
      installmentNumber,
      dueDate,
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

// Cria a linha de mes zero usada quando a entrada vira o primeiro evento financeiro.
export function buildOpeningBalanceRow({ balance, dueDate }) {
  return {
    installmentNumber: 0,
    dueDate,
    startingBalance: roundCurrency(balance),
    balanceBeforePayment: roundCurrency(balance),
    interest: 0,
    installmentAmount: 0,
    amortization: 0,
    remainingBalance: roundCurrency(balance),
  };
}
