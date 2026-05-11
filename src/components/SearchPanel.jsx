import { formatCurrency, formatDate } from "../lib/formatters.js";

// Renderiza a area de upload do PDF e a grade de ativos extraidos do relatorio.
export function SearchPanel({
  assets,
  selectedAssetIds,
  statusMessage,
  uploadedFileName,
  reportMetadata,
  onFileUpload,
  onToggleAsset,
  onToggleAll
}) {
  const hasAssets = assets.length > 0;
  const allSelected = hasAssets && selectedAssetIds.size === assets.length;

  return (
    <section className="panel panel--search">
      <div className="panel__header">
        <h2>Upload da Planilha Debito</h2>
        <p>Leitura automatica dos IDs, Vlr Final e honorarios do relatorio</p>
      </div>

      <div className="upload-box">
        <label className="upload-box__button button button--primary">
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={onFileUpload}
          />
          Enviar PDF
        </label>

        <div className="upload-box__meta">
          <strong>{uploadedFileName || "Nenhum arquivo carregado"}</strong>
          <span>O sistema usa o Vlr Final dos debitos condominiais e ignora custas processuais.</span>
        </div>
      </div>

      {reportMetadata && (
        <div className="report-summary">
          <div>
            <span>Condominio</span>
            <strong>{reportMetadata.condominium || "-"}</strong>
          </div>
          <div>
            <span>Proprietario</span>
            <strong>{reportMetadata.owner || "-"}</strong>
          </div>
          <div>
            <span>Documentacao</span>
            <strong>{reportMetadata.ownerDocument || "-"}</strong>
          </div>
          <div>
            <span>Unidade</span>
            <strong>{reportMetadata.unit || "-"}</strong>
          </div>
          <div>
            <span>Total do relatorio</span>
            <strong>{reportMetadata.totalDebt || "-"}</strong>
          </div>
          <div>
            <span>Honorarios</span>
            <strong>{formatCurrency(reportMetadata.attorneyFeesAmount || 0)}</strong>
          </div>
        </div>
      )}

      {reportMetadata?.parserSummary?.skippedLines > 0 && (
        <div className="parser-warning">
          {reportMetadata.parserSummary.skippedLines} linha(s) do PDF nao puderam ser
          interpretadas automaticamente. Revise os ativos carregados antes de exportar.
        </div>
      )}

      {!hasAssets && <div className="empty-state">{statusMessage}</div>}

      {hasAssets && (
        <div className="assets-section">
          <div className="assets-section__top">
            <div>
              <h3>Ativos extraidos do PDF</h3>
              <p>{assets.length} ativo(s) encontrado(s) para simulacao.</p>
            </div>
            <button type="button" className="button button--ghost" onClick={onToggleAll}>
              {allSelected ? "Limpar selecao" : "Selecionar todos"}
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>ID</th>
                  <th>Ativo</th>
                  <th>Referencia</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const checked = selectedAssetIds.has(asset.id);
                  return (
                    <tr className={checked ? "selected" : ""} key={asset.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleAsset(asset.id)}
                          aria-label={`Selecionar ${asset.id}`}
                        />
                      </td>
                      <td>{asset.id}</td>
                      <td>{asset.id}</td>
                      <td>{asset.reference}</td>
                      <td>{formatDate(asset.dueDate)}</td>
                      <td>{formatCurrency(asset.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
