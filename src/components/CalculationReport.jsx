import { formatCurrency, formatDate, formatPercent } from "../lib/formatters.js";
import g5JusLogo from "../assets/g5jus-logo-from-docx.png";

export function CalculationReport({
  simulation,
  selectedAssets,
  searchDescription,
  agreementMode,
  bankTariffAmount = 0,
  isBankTariffWaived = false,
  note,
}) {
  if (!simulation) {
    return null;
  }

  const isJudicialAgreement = agreementMode === "judicial";
  const activeSchedule = simulation.schedule.filter(
    (installment) => installment.installmentNumber > 0,
  );
  const visualBankTariffAmount = isBankTariffWaived ? 0 : bankTariffAmount;
  const calculationRows = [
    ["Dívida original", formatCurrency(simulation.baseDebt)],
    ["Custas", formatCurrency(simulation.legalCostsAmount)],
    ["Honorários", formatCurrency(simulation.attorneyFeesAmount)],
    ["Base do acordo", formatCurrency(simulation.agreementBaseAmount)],
    ["Entrada", formatCurrency(simulation.downPayment)],
    ["Saldo financiado", formatCurrency(simulation.financedBalance)],
    ["Correção até a 1ª parcela", `${simulation.prorataDays} dia(s) úteis`],
    ["Taxa mensal", `${formatPercent(simulation.monthlyRatePercent)}%`],
    ["Saldo corrigido", formatCurrency(simulation.correctedBalance)],
    ["Parcelamento", `${simulation.installmentCount}x de ${formatCurrency(simulation.installmentAmount)}`],
    ["Juros do parcelamento", formatCurrency(simulation.financedInterest)],
    ["Total do acordo", formatCurrency(simulation.totalPaid)],
  ];

  return (
    <section id="calculation-report-root" className="calculation-report-root">
      <article className="calculation-report">
        <header className="calculation-report__header">
          <div>
            <p>Cálculo do acordo</p>
            <h1>Resumo para conferência</h1>
            <span>{searchDescription}</span>
          </div>
          <div className="calculation-report__brand" aria-label="G5Jus">
            <img src={g5JusLogo} alt="G5Jus" />
          </div>
          <div className="calculation-report__stamp">
            <strong>{formatCurrency(simulation.totalPaid)}</strong>
            <span>Total do acordo</span>
          </div>
        </header>

        <section className="calculation-report__summary">
          <ReportMetric label="Base" value={formatCurrency(simulation.agreementBaseAmount)} />
          <ReportMetric label="Entrada" value={formatCurrency(simulation.downPayment)} />
          <ReportMetric label="Parcela" value={formatCurrency(simulation.installmentAmount)} />
          <ReportMetric label="Total" value={formatCurrency(simulation.totalPaid)} />
        </section>

        <section className="calculation-report__section">
          <div className="calculation-report__section-title">
            <h2>Parâmetros usados</h2>
            <p>
              {formatDate(simulation.agreementDate)} | 1ª parcela em{" "}
              {formatDate(simulation.firstInstallmentDate)} |{" "}
              {isJudicialAgreement ? "Judicial" : "Extrajudicial"} | Price Pré |{" "}
              {selectedAssets.length} ativo(s)
            </p>
          </div>
          <div className="calculation-report__table-wrap">
            <table className="calculation-report__table calculation-report__table--pairs">
              <tbody>
                {calculationRows.map(([label, value]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {simulation.downPaymentEvent && (
          <section className="calculation-report__section">
            <div className="calculation-report__section-title">
              <h2>Entrada</h2>
              <p>Evento financeiro separado antes do parcelamento.</p>
            </div>
            <div className="calculation-report__table-wrap">
              <table className="calculation-report__table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Saldo inicial</th>
                    <th>Juros</th>
                    <th>Pagamento</th>
                    <th>Amortização</th>
                    <th>Saldo final</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{formatDate(simulation.downPaymentEvent.dueDate)}</td>
                    <td>{formatCurrency(simulation.downPaymentEvent.startingBalance)}</td>
                    <td>{formatCurrency(simulation.downPaymentEvent.interest)}</td>
                    <td>{formatCurrency(simulation.downPaymentEvent.paymentAmount)}</td>
                    <td>{formatCurrency(simulation.downPaymentEvent.amortization)}</td>
                    <td>{formatCurrency(simulation.downPaymentEvent.remainingBalance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="calculation-report__section calculation-report__section--schedule">
          <div className="calculation-report__section-title">
            <h2>Cronograma de parcelas</h2>
            <p>Parcela financeira separada da tarifa de processamento do boleto.</p>
          </div>
          <div className="calculation-report__table-wrap">
            <table className="calculation-report__table calculation-report__table--schedule">
              <thead>
                <tr>
                  <th>Parc.</th>
                  <th>Vencimento</th>
                  <th>Juros</th>
                  <th>Amortização</th>
                  <th>Parcela</th>
                  <th>Tarifa Processamento</th>
                  <th>Total boleto</th>
                  <th>Saldo final</th>
                </tr>
              </thead>
              <tbody>
                {activeSchedule.map((installment) => (
                  <tr key={installment.installmentNumber}>
                    <td>{installment.installmentNumber}</td>
                    <td>{formatDate(installment.dueDate)}</td>
                    <td>{formatCurrency(installment.interest)}</td>
                    <td>{formatCurrency(installment.amortization)}</td>
                    <td>{formatCurrency(installment.installmentAmount)}</td>
                    <td>{formatCurrency(visualBankTariffAmount)}</td>
                    <td>
                      {formatCurrency(installment.installmentAmount + visualBankTariffAmount)}
                    </td>
                    <td>{formatCurrency(installment.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="calculation-report__footer">
          <span>Ativos: {selectedAssets.map((asset) => asset.id).join(", ")}</span>
          <span>Observação: {note.trim() || "Sem observações adicionais."}</span>
        </section>
      </article>
    </section>
  );
}

function ReportMetric({ label, value }) {
  return (
    <div className="calculation-report__metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
