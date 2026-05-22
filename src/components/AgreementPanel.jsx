import { formatCurrency, formatDate, formatPercent } from "../lib/formatters.js";

// Exibe os parametros do acordo e o resumo calculado com base nos ativos selecionados.
export function AgreementPanel({
  agreementDate,
  firstInstallmentDate,
  minimumFirstInstallmentDate,
  installmentCount,
  installmentCountInput,
  monthlyRateInput,
  attorneyFeesAmountInput,
  agreementMode,
  legalCostsAmountInput,
  note,
  hasDownPayment,
  downPaymentAmount,
  downPaymentDate,
  selectedAssets,
  simulation,
  searchDescription,
  onSaveCase,
  onExportPdf,
  onExportCalculationPdf,
  onSendForSignature,
  signatureRequestPending,
  onAgreementDateChange,
  onFirstInstallmentDateChange,
  onInstallmentCountChange,
  onInstallmentCountBlur,
  onMonthlyRateChange,
  onMonthlyRateBlur,
  onAttorneyFeesAmountChange,
  onAttorneyFeesBlur,
  onAgreementModeChange,
  onLegalCostsAmountChange,
  onLegalCostsBlur,
  onDownPaymentToggle,
  onDownPaymentAmountChange,
  onDownPaymentDateChange,
  onNoteChange,
}) {
  // O painel recebe tudo ja calculado pelo App e apenas renderiza/propaga edicoes.
  const isJudicialAgreement = agreementMode === "judicial";

  return (
    <section className="panel panel--proposal">
      <div className="panel__header">
        <div>
          <h2>Dados do Acordo</h2>
          <p>Parametros usados no contrato</p>
        </div>
        <div className="panel__header-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={onSaveCase}
            disabled={!simulation}
          >
            Salvar caso
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={onExportPdf}
            disabled={!simulation}
          >
            Gerar contrato PDF
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={onExportCalculationPdf}
            disabled={!simulation}
          >
            Gerar calculo PDF
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={onSendForSignature}
            disabled={!simulation || signatureRequestPending}
          >
            {signatureRequestPending ? "Enviando assinatura..." : "Enviar para assinatura"}
          </button>
        </div>
      </div>

      <form className="agreement-form">
        <div className="grid">
          <label className="field">
            <span>Data do acordo</span>
            <input
              type="date"
              value={agreementDate}
              onChange={(event) => onAgreementDateChange(event.target.value)}
              required
            />
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
            <input
              type="text"
              inputMode="decimal"
              value={monthlyRateInput}
              onChange={(event) => onMonthlyRateChange(event.target.value)}
              onBlur={onMonthlyRateBlur}
            />
          </label>

          <label className="field">
            <span>Numero de parcelas</span>
            <input
              type="number"
              min="1"
              step="1"
              value={installmentCountInput}
              onChange={(event) => onInstallmentCountChange(event.target.value)}
              onBlur={onInstallmentCountBlur}
            />
          </label>

          <label className="field">
            <span>Honorarios advocaticios (R$)</span>
            <input
              type="text"
              inputMode="decimal"
              value={attorneyFeesAmountInput}
              onChange={(event) => onAttorneyFeesAmountChange(event.target.value)}
              onBlur={onAttorneyFeesBlur}
            />
          </label>

          <div className="field field--segmented">
            <span>Tipo de acordo</span>
            <div className="segmented-control" role="group" aria-label="Tipo de acordo">
              <button
                type="button"
                className={`segment-button ${agreementMode === "extrajudicial" ? "is-active" : ""}`}
                onClick={() => onAgreementModeChange("extrajudicial")}
              >
                Extrajudicial
              </button>
              <button
                type="button"
                className={`segment-button ${isJudicialAgreement ? "is-active" : ""}`}
                onClick={() => onAgreementModeChange("judicial")}
              >
                Judicial
              </button>
            </div>
          </div>

          {isJudicialAgreement && (
            <label className="field">
              <span>Custas processuais (R$)</span>
              <input
                type="text"
                inputMode="decimal"
                value={legalCostsAmountInput}
                onChange={(event) => onLegalCostsAmountChange(event.target.value)}
                onBlur={onLegalCostsBlur}
              />
            </label>
          )}

          <div className="field field--segmented">
            <span>Entrada</span>
            <div className="segmented-control" role="group" aria-label="Entrada no acordo">
              <button
                type="button"
                className={`segment-button ${!hasDownPayment ? "is-active" : ""}`}
                onClick={() => onDownPaymentToggle(false)}
              >
                Sem entrada
              </button>
              <button
                type="button"
                className={`segment-button ${hasDownPayment ? "is-active" : ""}`}
                onClick={() => onDownPaymentToggle(true)}
              >
                Com entrada
              </button>
            </div>
          </div>

          {hasDownPayment && (
            <>
              <label className="field">
                <span>Valor da entrada</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={downPaymentAmount}
                  onChange={(event) => onDownPaymentAmountChange(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Data da entrada</span>
                <input
                  type="date"
                  min={agreementDate}
                  max={firstInstallmentDate}
                  value={downPaymentDate}
                  onChange={(event) => onDownPaymentDateChange(event.target.value)}
                />
              </label>
            </>
          )}

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
        <section className="proposal proposal-sheet">
          <div className="proposal__hero">
            <div>
              <h3>Semi-proposta de acordo</h3>
              <p>{searchDescription}</p>
            </div>
            <div className="proposal__hero-meta">
              <div className="proposal__badge">Calculo automatico</div>
              {simulation.downPayment > 0 && (
                <div className="proposal__badge proposal__badge--secondary">
                  Entrada de {formatCurrency(simulation.downPayment)}
                </div>
              )}
              <strong>{simulation.installmentCount} parcelas Price</strong>
            </div>
          </div>

          <div className="proposal__grid proposal__grid--headline">
            <ResultCard
              label="Saldo corrigido"
              value={formatCurrency(simulation.correctedBalance)}
              highlight
            />
            <ResultCard label="Honorarios" value={formatCurrency(simulation.attorneyFeesAmount)} />
            {simulation.legalCostsAmount > 0 && (
              <ResultCard label="Custas" value={formatCurrency(simulation.legalCostsAmount)} />
            )}
            <ResultCard label="Entrada" value={formatCurrency(simulation.downPayment)} />
            <ResultCard label="Saldo parcelado" value={formatCurrency(simulation.financedBalance)} />
            <ResultCard label="Parcela (Price)" value={formatCurrency(simulation.installmentAmount)} />
            <ResultCard label="Taxa a.m." value={`${formatPercent(simulation.monthlyRatePercent)}%`} />
          </div>

          <div className="proposal__overview">
            <section className="info-card">
              <div className="info-card__header">
                <h4>Resumo financeiro</h4>
                <p>Base de calculo do acordo com tabela Price no modelo Pre.</p>
              </div>
              <div className="info-grid">
                <InfoPill label="Data do acordo" value={formatDate(simulation.agreementDate)} />
                <InfoPill label="1a parcela" value={formatDate(simulation.firstInstallmentDate)} />
                <InfoPill
                  label="Tipo de acordo"
                  value={isJudicialAgreement ? "Judicial" : "Extrajudicial"}
                />
                {simulation.legalCostsAmount > 0 && (
                  <InfoPill label="Custas processuais" value={formatCurrency(simulation.legalCostsAmount)} />
                )}
                <InfoPill label="Divida total" value={formatCurrency(simulation.totalDebt)} />
                <InfoPill label="Dias pro rata" value={simulation.prorataDays} />
                <InfoPill label="Taxa diaria" value={`${formatPercent(simulation.dailyRatePercent)}%`} />
                <InfoPill label="Periodo Price" value={simulation.pricePrePeriod} />
                <InfoPill label="Valor dos honorarios" value={formatCurrency(simulation.attorneyFeesAmount)} />
                <InfoPill label="Base do acordo" value={formatCurrency(simulation.agreementBaseAmount)} />
                <InfoPill label="Entrada" value={formatCurrency(simulation.downPayment)} />
                {simulation.downPaymentEvent && (
                  <InfoPill label="Data da entrada" value={formatDate(simulation.downPaymentDate)} />
                )}
                <InfoPill label="Saldo corrigido" value={formatCurrency(simulation.correctedBalance)} />
                <InfoPill label="Total pago" value={formatCurrency(simulation.totalPaid)} />
                <InfoPill label="Juros do parcelamento" value={formatCurrency(simulation.financedInterest)} />
                <InfoPill label="Juros sobre saldo" value={`${formatPercent(simulation.interestPercent)}%`} />
                <InfoPill label="Diferenca vs. divida" value={formatCurrency(simulation.totalInterest)} />
              </div>
            </section>

            <aside className="proposal__aside info-card">
              <div className="info-card__header">
                <h4>Ativos incluidos</h4>
                <p>Itens usados para compor a semi-proposta.</p>
              </div>
              <ul className="selected-assets-list">
                {selectedAssets.map((asset) => (
                  // Lista resumida dos ativos que entraram na base do acordo.
                  <li key={asset.id}>
                    <span className="selected-assets-list__label">Ativo</span>
                    <strong>{asset.id}</strong>
                    <span className="selected-assets-list__label">Dt.Vencimento</span>
                    <span>{formatDate(asset.dueDate)}</span>
                  </li>
                ))}
              </ul>
              <div className="proposal-note">
                <strong>Observacao</strong>
                <p>{note.trim() || "Sem observacoes adicionais."}</p>
              </div>
            </aside>
          </div>

          <section className="proposal-print-summary info-card">
            <div className="info-card__header">
              <h4>Condicoes da semi-proposta</h4>
              <p>Resumo usado para montar o contrato em PDF.</p>
            </div>
            <div className="proposal-print-summary__content">
                <p>
                Divida consolidada em {formatCurrency(simulation.totalDebt)}
                {simulation.legalCostsAmount > 0
                  ? `, incluindo custas processuais de ${formatCurrency(simulation.legalCostsAmount)}`
                  : ""}, com honorarios advocaticios de {formatCurrency(simulation.attorneyFeesAmount)} e
                {simulation.downPayment > 0
                  ? ` entrada de ${formatCurrency(simulation.downPayment)} e`
                  : ""}{" "}
                saldo parcelado em {simulation.installmentCount} parcela(s) no modelo Price, com
                primeira parcela de{" "}
                {formatCurrency(simulation.installmentAmount)}.
              </p>
              <p>
                Primeira parcela prevista para {formatDate(simulation.firstInstallmentDate)}.
                Total estimado do acordo: {formatCurrency(simulation.totalPaid)}.
              </p>
            </div>
          </section>

          <div className="proposal-schedule">
            <div className="proposal-schedule__header">
              <h4>Cronograma de parcelas</h4>
              <p>
                {simulation.downPaymentEvent
                  ? "Entrada destacada e saldo remanescente parcelado no modelo Price."
                  : "Parcelas fixas no modelo Price com pagamento da 1a parcela no inicio do periodo."}
              </p>
            </div>

            {simulation.downPaymentEvent && (
              <div className="table-wrap entry-table-wrap">
                <table className="schedule-table schedule-table--entry">
                  <thead>
                    <tr>
                      <th>Descricao</th>
                      <th>Data</th>
                      <th>Saldo inicial</th>
                      <th>Juros</th>
                      <th>Pagamento</th>
                      <th>Amortizacao</th>
                      <th>Saldo final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Entrada</td>
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
            )}

            <div className="table-wrap">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th title="Parcela">Parc.</th>
                    <th title="Vencimento">Venc.</th>
                    <th title="Saldo base">Base</th>
                    <th title="Juros">Juros</th>
                    <th title="Saldo antes do pagamento">Antes</th>
                    <th title="Amortizacao">Amort.</th>
                    <th title="Parcela fixa">Parcela</th>
                    <th title="Saldo final">Final</th>
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

// Destaca um indicador secundario do resumo financeiro em formato de card compacto.
function InfoPill({ label, value }) {
  return (
    <article className="info-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
