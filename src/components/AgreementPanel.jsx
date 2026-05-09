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
  onFirstInstallmentDateChange,
  onInstallmentCountChange,
  onNoteChange
}) {
  return (
    <section className="panel panel--proposal">
      <div className="panel__header">
        <h2>Dados do Acordo</h2>
        <p>Parametros usados na semi-proposta</p>
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
        <section className="proposal">
          <div className="proposal__header">
            <div>
              <h3>Semi-proposta de acordo</h3>
              <p>{searchDescription}</p>
            </div>
            <div className="proposal__badge">Calculo automatico</div>
          </div>

          <div className="proposal__grid">
            <ResultCard label="Divida total" value={formatCurrency(simulation.totalDebt)} highlight />
            <ResultCard label="Saldo parcelado" value={formatCurrency(simulation.financedBalance)} />
            <ResultCard label="Parcela (Price)" value={formatCurrency(simulation.installmentAmount)} />
            <ResultCard label="Taxa a.m." value={`${formatPercent(simulation.monthlyRatePercent)}%`} />
          </div>

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
                  </li>
                ))}
              </ul>
              <div className="proposal-note">
                <strong>Observacao</strong>
                <p>{note.trim() || "Sem observacoes adicionais."}</p>
              </div>
            </aside>
          </div>
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

// Renderiza uma linha padrao da tabela de resumo financeiro do acordo.
function SummaryRow({ label, value }) {
  return (
    <tr>
      <th>{label}</th>
      <td>{value}</td>
    </tr>
  );
}
