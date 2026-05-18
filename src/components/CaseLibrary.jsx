import { formatCurrency, formatDate } from "../lib/formatters.js";

// Exibe os casos salvos localmente para reabrir, fixar, renomear ou excluir.
export function CaseLibrary({
  cases,
  activeCaseId,
  onLoadCase,
  onPinCase,
  onRenameCase,
  onDeleteCase
}) {
  return (
    <section className="panel panel--library">
      <div className="panel__header">
        <div>
          <h2>Casos</h2>
          <p>Biblioteca local.</p>
        </div>
        <div className="library-count">{cases.length} salvo(s)</div>
      </div>

      {!cases.length && (
        <div className="empty-state">
          Salve um caso para montar sua biblioteca local dentro da aplicacao.
        </div>
      )}

      {cases.length > 0 && (
        <div className="library-list">
          {cases.map((savedCase) => (
            // Cada card representa um snapshot salvo no localStorage pelo App.
            <article
              key={savedCase.id}
              className={`library-card ${savedCase.id === activeCaseId ? "library-card--active" : ""}`}
            >
              <div className="library-card__top">
                <div>
                  <h3>{savedCase.title}</h3>
                  <p>{savedCase.unit || savedCase.debtorName || "-"}</p>
                </div>
                {savedCase.pinned && <span className="library-badge">Fixado</span>}
              </div>

              <div className="library-meta">
                <span>Total: {formatCurrency(savedCase.totalPaid || 0)}</span>
                <span>1a parcela: {savedCase.firstInstallmentDate ? formatDate(savedCase.firstInstallmentDate) : "-"}</span>
              </div>

              <div className="library-card__footer">
                <small>{formatSavedAt(savedCase.savedAt)}</small>
                <div className="library-actions">
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => onLoadCase(savedCase.id)}
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => onPinCase(savedCase.id)}
                    aria-label={savedCase.pinned ? "Desafixar caso" : "Fixar caso"}
                  >
                    {savedCase.pinned ? "Soltar" : "Fixar"}
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => onRenameCase(savedCase.id)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="button button--ghost button--danger"
                    onClick={() => onDeleteCase(savedCase.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// Formata a data de salvamento com locale brasileiro para facilitar auditoria visual.
function formatSavedAt(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return date.toLocaleString("pt-BR");
}
