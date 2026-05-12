import { useEffect, useState } from "react";
import {
  DEFAULT_ATTORNEY_FEES_AMOUNT,
  DEFAULT_INSTALLMENTS,
  DEFAULT_MONTHLY_RATE_PERCENT,
  MINIMUM_FIRST_INSTALLMENT_BUSINESS_DAYS,
} from "./constants.js";
import { AgreementContract } from "./components/AgreementContract.jsx";
import { AgreementPanel } from "./components/AgreementPanel.jsx";
import { BrandLogos } from "./components/BrandLogos.jsx";
import { SearchPanel } from "./components/SearchPanel.jsx";
import { buildAgreementDocumentData } from "./lib/agreementDocument.js";
import { calculateAgreement } from "./lib/agreementCalculator.js";
import {
  addBusinessDays,
  formatDateForInput,
  normalizeFirstInstallmentDate,
  parseInputDate,
} from "./lib/dates.js";
import { roundCurrency, sumCurrency } from "./lib/money.js";

// Coordena o fluxo principal da tela: upload do PDF, selecao de ativos e simulacao do acordo.
export function App() {
  const [agreementDate] = useState(() => formatDateForInput(new Date()));
  const minimumFirstInstallmentDate = formatDateForInput(
    addBusinessDays(
      parseInputDate(agreementDate),
      MINIMUM_FIRST_INSTALLMENT_BUSINESS_DAYS,
    ),
  );

  const [assets, setAssets] = useState([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState(new Set());
  const [statusMessage, setStatusMessage] = useState(
    "Envie a planilha debito em PDF para carregar os ativos automaticamente.",
  );
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [reportMetadata, setReportMetadata] = useState(null);
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(
    minimumFirstInstallmentDate,
  );
  const [installmentCountInput, setInstallmentCountInput] = useState(
    String(DEFAULT_INSTALLMENTS),
  );
  const [monthlyRateInput, setMonthlyRateInput] = useState(
    formatEditablePercent(DEFAULT_MONTHLY_RATE_PERCENT),
  );
  const [attorneyFeesAmountInput, setAttorneyFeesAmountInput] = useState(
    formatEditableMoney(DEFAULT_ATTORNEY_FEES_AMOUNT),
  );
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPaymentAmount, setDownPaymentAmount] = useState("0.00");
  const [note, setNote] = useState("");
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [contractFields, setContractFields] = useState({
    address: "",
    email: "",
    unit: ""
  });
  const [contractValidationMessage, setContractValidationMessage] = useState("");
  const installmentCount = normalizeInstallmentCount(installmentCountInput);
  const monthlyRatePercent = normalizePercent(
    monthlyRateInput,
    DEFAULT_MONTHLY_RATE_PERCENT,
  );
  const attorneyFeesAmount = normalizeMoney(attorneyFeesAmountInput);

  const selectedAssets = assets.filter((asset) =>
    selectedAssetIds.has(asset.id),
  );
  const totalDebt = sumCurrency(selectedAssets, (asset) => asset.amount);
  const agreementBaseAmount = roundCurrency(totalDebt + attorneyFeesAmount);
  const normalizedDownPaymentAmount = hasDownPayment
    ? roundCurrency(
        Math.min(
          Math.max(
            normalizeMoney(downPaymentAmount),
            0,
          ),
          agreementBaseAmount,
        ),
      )
    : 0;
  const normalizedFirstInstallmentDate = normalizeFirstInstallmentDate(
    firstInstallmentDate,
    minimumFirstInstallmentDate,
  );

  const simulation = selectedAssets.length
    ? calculateAgreement({
        totalDebt,
        downPayment: normalizedDownPaymentAmount,
        monthlyRatePercent,
        attorneyFeesAmount,
        installmentCount,
        agreementDate,
        firstInstallmentDate: normalizedFirstInstallmentDate,
      })
    : null;

  const searchDescription = buildSourceDescription(
    reportMetadata,
    uploadedFileName,
  );
  const contractDocumentData = simulation
    ? buildAgreementDocumentData({
        agreementDate,
        reportMetadata,
        selectedAssets,
        simulation,
        contractFields
      })
    : null;

  useEffect(() => {
    if (!contractDialogOpen) {
      setContractValidationMessage("");
    }
  }, [contractDialogOpen]);

  useEffect(() => {
    function handleAfterPrint() {
      document.body.classList.remove("printing-contract");
    }

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  // Le o PDF enviado, extrai os ativos e prepara a selecao inicial para simulacao.
  async function handleFileUpload(event) {
    const [file] = event.target.files ?? [];
    if (!file) {
      return;
    }

    setStatusMessage("Lendo PDF e extraindo ativos...");
    setUploadedFileName(file.name);

    try {
      const { parseDebtSpreadsheetPdf } =
        await import("./services/debtPdfParser.js");
      const parsedReport = await parseDebtSpreadsheetPdf(file);
      setAssets(parsedReport.assets);
      setSelectedAssetIds(
        new Set(parsedReport.assets.map((asset) => asset.id)),
      );
      setReportMetadata(parsedReport.metadata);
      setAttorneyFeesAmountInput(
        formatEditableMoney(parsedReport.metadata?.attorneyFeesAmount ?? 0),
      );
      setContractFields({
        address: "",
        email: "",
        unit: parsedReport.metadata?.unit ?? ""
      });
      setHasDownPayment(false);
      setDownPaymentAmount("0.00");
      setStatusMessage(
        parsedReport.assets.length
          ? buildSuccessMessage(parsedReport)
          : "Nenhum ativo encontrado no PDF enviado.",
      );
    } catch (error) {
      setAssets([]);
      setSelectedAssetIds(new Set());
      setReportMetadata(null);
      setAttorneyFeesAmountInput(formatEditableMoney(DEFAULT_ATTORNEY_FEES_AMOUNT));
      setContractFields({
        address: "",
        email: "",
        unit: ""
      });
      setStatusMessage(
        "Nao foi possivel ler este PDF. Verifique se ele segue o modelo da planilha debito.",
      );
    }

    event.target.value = "";
  }

  // Alterna a selecao individual de um ativo sem perder o restante da lista escolhida.
  function handleToggleAsset(assetId) {
    setSelectedAssetIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(assetId)) {
        nextIds.delete(assetId);
      } else {
        nextIds.add(assetId);
      }
      return nextIds;
    });
  }

  // Seleciona todos os ativos retornados ou limpa a selecao atual quando todos ja estao marcados.
  function handleToggleAll() {
    setSelectedAssetIds((currentIds) => {
      if (currentIds.size === assets.length) {
        return new Set();
      }
      return new Set(assets.map((asset) => asset.id));
    });
  }

  // Permite apagar e reescrever o campo sem travar a digitacao em torno do valor minimo.
  function handleInstallmentCountChange(value) {
    const digitsOnlyValue = value.replace(/\D/g, "");
    setInstallmentCountInput(digitsOnlyValue);
  }

  // Ao sair do campo, aplica o minimo permitido para evitar deixar o formulario invalido.
  function handleInstallmentCountBlur() {
    setInstallmentCountInput(String(normalizeInstallmentCount(installmentCountInput)));
  }

  // Ativa ou remove a entrada inicial mantendo o valor digitado para cenarios alternativos.
  function handleDownPaymentToggle(checked) {
    setHasDownPayment(checked);
  }

  // Mantem o valor digitado em formato simples para o campo numerico da entrada.
  function handleDownPaymentAmountChange(value) {
    setDownPaymentAmount(value);
  }

  // Abre o formulario complementar para montar o contrato final antes da impressao.
  function handleExportPdf() {
    if (!simulation) {
      return;
    }

    setContractDialogOpen(true);
  }

  function handleContractFieldChange(field, value) {
    setContractFields((currentFields) => ({
      ...currentFields,
      [field]: value
    }));
  }

  function handleContractSubmit(event) {
    event.preventDefault();
    const missingFields = [];
    if (!contractFields.address.trim()) {
      missingFields.push("endereco");
    }
    if (!contractFields.email.trim()) {
      missingFields.push("e-mail");
    }
    if (!contractFields.unit.trim()) {
      missingFields.push("unidade");
    }

    if (missingFields.length > 0) {
      setContractValidationMessage(
        `Preencha ${missingFields.join(", ")} antes de gerar o contrato.`,
      );
      return;
    }

    setContractDialogOpen(false);
    setContractValidationMessage("");
    printContractDocument();
  }

  function printContractDocument() {
    const contractElement = document.getElementById("contract-print-root");
    if (!contractElement) {
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      document.body.classList.add("printing-contract");
      window.setTimeout(() => {
        window.print();
      }, 50);
      return;
    }

    const styleMarkup = Array.from(
      document.querySelectorAll("style, link[rel='stylesheet']"),
    )
      .map((element) => element.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title></title>
    ${styleMarkup}
  </head>
  <body class="printing-contract">
    ${contractElement.outerHTML}
    <script>
      window.addEventListener("load", () => {
        setTimeout(() => {
          window.focus();
          window.print();
        }, 120);
      });
      window.addEventListener("afterprint", () => window.close());
    <\/script>
  </body>
</html>`);
    printWindow.document.close();
  }

  return (
    <>
      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Simulador Web</p>
            <h1>Calculadora de Acordo por PDF</h1>
          </div>
          <div className="topbar__meta">
            <BrandLogos />
            <strong>Leitura automatica de debitos</strong>
          </div>
        </header>

        <div className="workspace">
          <SearchPanel
            assets={assets}
            selectedAssetIds={selectedAssetIds}
            statusMessage={statusMessage}
            uploadedFileName={uploadedFileName}
            reportMetadata={reportMetadata}
            onFileUpload={handleFileUpload}
            onToggleAsset={handleToggleAsset}
            onToggleAll={handleToggleAll}
          />

          <AgreementPanel
            agreementDate={agreementDate}
            firstInstallmentDate={normalizedFirstInstallmentDate}
            minimumFirstInstallmentDate={minimumFirstInstallmentDate}
            installmentCount={installmentCount}
            installmentCountInput={installmentCountInput}
            monthlyRateInput={monthlyRateInput}
            attorneyFeesAmountInput={attorneyFeesAmountInput}
            note={note}
            hasDownPayment={hasDownPayment}
            downPaymentAmount={downPaymentAmount}
            selectedAssets={selectedAssets}
            simulation={simulation}
            searchDescription={searchDescription}
            onExportPdf={handleExportPdf}
            onFirstInstallmentDateChange={setFirstInstallmentDate}
            onInstallmentCountChange={handleInstallmentCountChange}
            onInstallmentCountBlur={handleInstallmentCountBlur}
            onMonthlyRateChange={setMonthlyRateInput}
            onMonthlyRateBlur={() =>
              setMonthlyRateInput(formatEditablePercent(monthlyRatePercent))
            }
            onAttorneyFeesAmountChange={setAttorneyFeesAmountInput}
            onAttorneyFeesBlur={() =>
              setAttorneyFeesAmountInput(formatEditableMoney(attorneyFeesAmount))
            }
            onDownPaymentToggle={handleDownPaymentToggle}
            onDownPaymentAmountChange={handleDownPaymentAmountChange}
            onNoteChange={setNote}
          />
        </div>

        {contractDialogOpen && (
          <div className="dialog-backdrop" role="presentation">
            <section
              className="dialog-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="contract-dialog-title"
            >
              <div className="dialog-card__header">
                <div>
                  <h2 id="contract-dialog-title">Complementar dados do contrato</h2>
                  <p>O report ja preenche nome, documento e valores. Falta informar os campos abaixo.</p>
                </div>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setContractDialogOpen(false)}
                >
                  Fechar
                </button>
              </div>

              <form className="grid" onSubmit={handleContractSubmit}>
                <label className="field field--full">
                  <span>Endereco completo</span>
                  <input
                    type="text"
                    value={contractFields.address}
                    onChange={(event) => handleContractFieldChange("address", event.target.value)}
                    placeholder="Rua, numero, complemento, bairro, cidade e CEP"
                    required
                  />
                </label>

                <label className="field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={contractFields.email}
                    onChange={(event) => handleContractFieldChange("email", event.target.value)}
                    placeholder="nome@exemplo.com"
                    required
                  />
                </label>

                <label className="field">
                  <span>Unidade</span>
                  <input
                    type="text"
                    value={contractFields.unit}
                    onChange={(event) => handleContractFieldChange("unit", event.target.value)}
                    placeholder="Ex.: 103 BLOCO 19"
                    required
                  />
                </label>

                {contractValidationMessage && (
                  <div className="dialog-warning">{contractValidationMessage}</div>
                )}

                <div className="dialog-actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setContractDialogOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="button button--primary">
                    Gerar PDF
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>

      <AgreementContract documentData={contractDocumentData} />
    </>
  );
}

// Monta a identificacao visual da origem dos ativos carregados para contextualizar a semi-proposta.
function buildSourceDescription(reportMetadata, uploadedFileName) {
  if (!reportMetadata) {
    return "Semi-proposta calculada";
  }

  const descriptionParts = [];
  if (reportMetadata.condominium) {
    descriptionParts.push(reportMetadata.condominium);
  }
  if (reportMetadata.unit) {
    descriptionParts.push(reportMetadata.unit);
  }
  if (uploadedFileName) {
    descriptionParts.push(uploadedFileName);
  }

  return descriptionParts.join(" - ");
}

// Resume a leitura destacando quando o parser precisou descartar linhas da tabela.
function buildSuccessMessage(parsedReport) {
  const assetCount = parsedReport.assets.length;
  const skippedCount = parsedReport.metadata?.parserSummary?.skippedLines ?? 0;

  if (!skippedCount) {
    return `${assetCount} ativo(s) carregado(s) para simulacao.`;
  }

  return `${assetCount} ativo(s) carregado(s); ${skippedCount} linha(s) do PDF nao puderam ser interpretadas automaticamente.`;
}

function normalizeInstallmentCount(value) {
  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue)) {
    return 1;
  }

  return Math.max(1, parsedValue);
}

function normalizePercent(value, fallbackValue) {
  const parsedValue = Number.parseFloat(String(value).replace(",", "."));
  if (Number.isNaN(parsedValue)) {
    return fallbackValue;
  }

  return Math.max(0, parsedValue);
}

function normalizeMoney(value) {
  const rawValue = String(value).trim();
  const normalizedValue = rawValue.includes(",")
    ? rawValue.replace(/\./g, "").replace(",", ".")
    : rawValue;
  const parsedValue = Number.parseFloat(normalizedValue);
  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return roundCurrency(Math.max(parsedValue, 0));
}

function formatEditablePercent(value) {
  return String(value).replace(".", ",");
}

function formatEditableMoney(value) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
