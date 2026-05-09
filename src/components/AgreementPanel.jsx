import { formatCurrency, formatDate, formatPercent } from "../lib/formatters.js";

// Exibe os parametros do acordo e o resumo calculado com base nos ativos selecionados.
export function AgreementPanel({
  agreementDate,
  firstInstallmentDate,
  minimumFirstInstallmentDate,
  installmentCount,
  monthlyRatePercent,
  note,
  selectedAssets,
  simulation,
  searchDescription,
<<<<<<< HEAD
  onExportPdf,
=======
>>>>>>> ab550870fd549ed22a3618a73191a427c65de7da
  onFirstInstallmentDateChange,
  onInstallmentCountChange,
  onNoteChange
}) {
  return (
    <section className="panel panel--proposal">
      <div className="panel__header">
<<<<<<< HEAD
        <div>
          <h2>Dados do Acordo</h2>
          <p>Parametros usados na semi-proposta</p>
        </div>
        <div className="panel__header-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={onExportPdf}
            disabled={!simulation}
          >
            Exportar PDF
          </button>
        </div>
=======
        <h2>Dados do Acordo</h2>
        <p>Parametros usados na semi-proposta</p>
>>>>>>> ab550870fd549ed22a3618a73191a427c65de7da
      </div>

      <form className="agreement-form">
        <div className="grid">
          <label className="field">
            <span>Data do acordo</span>
            <input type="date" value={agreementDate} disabled readOnly />
          </label>

          <label className="field">
            <span>1a parcela</span>
            <input
              type="date"
              min={minimumFirstInstallmentDate}
              value={firstInstallmentDate}
              onChange={(event) => onFirstInstallmentDateChange(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Taxa a.m. (%)</span>
            <input type="number" value={monthlyRatePercent} disabled readOnly />
          </label>

          <label className="field">
            <span>Numero de parcelas</span>
            <input
              type="number"
              min="1"
              step="1"
              value={installmentCount}
              onChange={(event) => onInstallmentCountChange(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Observacao comercial</span>
            <input
              type="text"
              placeholder="Ex.: condicao padrao de negociacao"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
            />
          </label>
        </div>
      </form>

      {!simulation && (
        <div className="empty-state empty-state--compact">
          Selecione ao menos um ativo para gerar a semi-proposta.
        </div>
      )}

      {simulation && (
<<<<<<< HEAD
        <section className="proposal proposal-sheet">
          <div className="proposal__hero">
=======
        <section className="proposal">
          <div className="proposal__header">
>>>>>>> ab550870fd549ed22a3618a73191a427c65de7da
            <div>
              <h3>Semi-proposta de acordo</h3>
              <p>{searchDescription}</p>
            </div>
<<<<<<< HEAD
            <div className="proposal__hero-meta">
              <div className="proposal__badge">Calculo automatico</div>
              <strong>{simulation.installmentCount} parcelas fixas</strong>
            </div>
          </div>

          <div className="proposal__grid proposal__grid--headline">
=======
            <div className="proposal__badge">Calculo automatico</div>
          </div>

          <div className="proposal__grid">
>>>>>>> ab550870fd549ed22a3618a73191a427c65de7da
            <ResultCard label="Divida total" value={formatCurrency(simulation.totalDebt)} highlight />
            <ResultCard label="Saldo parcelado" value={formatCurrency(simulation.financedBalance)} />
            <ResultCard label="Parcela (Price)" value={formatCurrency(simulation.installmentAmount)} />
            <ResultCard label="Taxa a.m." value={`${formatPercent(simulation.monthlyRatePercent)}%`} />
          </div>

<<<<<<< HEAD
          <div className="proposal__overview">
            <section className="info-card">
              <div className="info-card__header">
                <h4>Resumo financeiro</h4>
                <p>Base de calculo do acordo com pro rata e tabela Price.</p>
              </div>
              <div className="info-grid">
                <InfoPill label="Data do acordo" value={formatDate(simulation.agreementDate)} />
                <InfoPill label="1a parcela" value={formatDate(simulation.firstInstallmentDate)} />
                <InfoPill label="Dias pro rata" value={simulation.prorataDays} />
                <InfoPill label="Taxa diaria" value={`${formatPercent(simulation.dailyRatePercent)}%`} />
                <InfoPill label="Saldo corrigido" value={formatCurrency(simulation.correctedBalance)} />
                <InfoPill label="Total pago" value={formatCurrency(simulation.totalPaid)} />
                <InfoPill label="Total de juros" value={formatCurrency(simulation.totalInterest)} />
                <InfoPill label="% de juros" value={`${formatPercent(simulation.interestPercent)}%`} />
                <InfoPill label="CET estimado" value={`${formatPercent(simulation.effectiveCostPercent)}%`} />
              </div>
            </section>

            <aside className="proposal__aside info-card">
              <div className="info-card__header">
                <h4>Ativos incluidos</h4>
                <p>Itens usados para compor a semi-proposta.</p>
              </div>
              <ul className="selected-assets-list">
                {selectedAssets.map((asset) => (
                  <li key={asset.id}>
                    <strong>{asset.id}</strong>
                    <span>{formatAssetMonthYear(asset.dueDate)}</span>
=======
          <div className="calculation-layout">
            <div className="table-wrap">
              <table className="calculation-table">
                <tbody>
                  <SummaryRow label="Data do acordo" value={formatDate(simulation.agreementDate)} />
                  <SummaryRow label="1a parcela" value={formatDate(simulation.firstInstallmentDate)} />
                  <SummaryRow label="Dias pro rata" value={simulation.prorataDays} />
                  <SummaryRow label="Taxa diaria" value={`${formatPercent(simulation.dailyRatePercent)}%`} />
                  <SummaryRow label="Saldo corrigido" value={formatCurrency(simulation.correctedBalance)} />
                  <SummaryRow label="Total pago" value={formatCurrency(simulation.totalPaid)} />
                  <SummaryRow label="Total de juros" value={formatCurrency(simulation.totalInterest)} />
                  <SummaryRow label="% de juros" value={`${formatPercent(simulation.interestPercent)}%`} />
                  <SummaryRow label="CET estimado" value={`${formatPercent(simulation.effectiveCostPercent)}%`} />
                </tbody>
              </table>
            </div>

            <aside className="proposal__aside">
              <h4>Ativos incluidos</h4>
              <ul className="selected-assets-list">
                {selectedAssets.map((asset) => (
                  <li key={asset.id}>
                    <strong>{asset.name}</strong>
                    <span>{asset.reference} - venc. {formatDate(asset.dueDate)} - {formatCurrency(asset.amount)}</span>
>>>>>>> ab550870fd549ed22a3618a73191a427c65de7da
                  </li>
                ))}
              </ul>
              <div className="proposal-note">
                <strong>Observacao</strong>
                <p>{note.trim() || "Sem observacoes adicionais."}</p>
              </div>
            </aside>
          </div>
<<<<<<< HEAD

          <div className="proposal-schedule">
            <div className="proposal-schedule__header">
              <h4>Cronograma de parcelas</h4>
              <p>Parcelas fixas no modelo Price com pagamento da 1a parcela no inicio do periodo.</p>
            </div>

            <div className="table-wrap">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Parcela</th>
                    <th>Vencimento</th>
                    <th>Saldo base</th>
                    <th>Juros</th>
                    <th>Saldo antes do pgto</th>
                    <th>Amortizacao</th>
                    <th>Parcela fixa</th>
                    <th>Saldo final</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.schedule.map((installment) => (
                    <tr key={installment.installmentNumber}>
                      <td>{installment.installmentNumber}</td>
                      <td>{formatDate(installment.dueDate)}</td>
                      <td>{formatCurrency(installment.startingBalance)}</td>
                      <td>{formatCurrency(installment.interest)}</td>
                      <td>{formatCurrency(installment.balanceBeforePayment)}</td>
                      <td>{formatCurrency(installment.amortization)}</td>
                      <td>{formatCurrency(installment.installmentAmount)}</td>
                      <td>{formatCurrency(installment.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
=======
>>>>>>> ab550870fd549ed22a3618a73191a427c65de7da
        </section>
      )}
    </section>
  );
}

// Mostra um indicador resumido de valor no topo da semi-proposta.
function ResultCard({ label, value, highlight = false }) {
  return (
    <article className={`result-card ${highlight ? "result-card--highlight" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

<<<<<<< HEAD
// Destaca um indicador secundario do resumo financeiro em formato de card compacto.
function InfoPill({ label, value }) {
  return (
    <article className="info-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatAssetMonthYear(value) {
  if (!value) {
    return "-";
  }

  const [year, month] = value.split("-");
  return `${month}/${year}`;
}
=======
// Renderiza uma linha padrao da tabela de resumo financeiro do acordo.
function SummaryRow({ label, value }) {
  return (
    <tr>
      <th>{label}</th>
      <td>{value}</td>
    </tr>
  );
}
>>>>>>> ab550870fd549ed22a3618a73191a427c65de7da
