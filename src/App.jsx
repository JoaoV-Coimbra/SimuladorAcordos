import { useState } from "react";
import {
  DEFAULT_INSTALLMENTS,
  FIXED_MONTHLY_RATE_PERCENT,
  MINIMUM_FIRST_INSTALLMENT_BUSINESS_DAYS,
} from "./constants.js";
import { AgreementPanel } from "./components/AgreementPanel.jsx";
import { BrandLogos } from "./components/BrandLogos.jsx";
import { SearchPanel } from "./components/SearchPanel.jsx";
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
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPaymentAmount, setDownPaymentAmount] = useState("0.00");
  const [note, setNote] = useState("");
  const installmentCount = normalizeInstallmentCount(installmentCountInput);

  const selectedAssets = assets.filter((asset) =>
    selectedAssetIds.has(asset.id),
  );
  const totalDebt = sumCurrency(selectedAssets, (asset) => asset.amount);
  const normalizedDownPaymentAmount = hasDownPayment
    ? roundCurrency(
        Math.min(
          Math.max(
            Number.parseFloat(
              String(downPaymentAmount).replace(",", "."),
            ) || 0,
            0,
          ),
          totalDebt,
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
        monthlyRatePercent: FIXED_MONTHLY_RATE_PERCENT,
        installmentCount,
        agreementDate,
        firstInstallmentDate: normalizedFirstInstallmentDate,
      })
    : null;

  const searchDescription = buildSourceDescription(
    reportMetadata,
    uploadedFileName,
  );

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

  // Abre a impressao do navegador com o layout preparado para salvar o acordo em PDF.
  function handleExportPdf() {
    window.print();
  }

  return (
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
          monthlyRatePercent={FIXED_MONTHLY_RATE_PERCENT}
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
          onDownPaymentToggle={handleDownPaymentToggle}
          onDownPaymentAmountChange={handleDownPaymentAmountChange}
          onNoteChange={setNote}
        />
      </div>
    </main>
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
