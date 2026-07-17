import { useEffect, useState } from "react";
import html2pdf from "html2pdf.js";
import {
  DEFAULT_ATTORNEY_FEES_AMOUNT,
  DEFAULT_INSTALLMENTS,
  DEFAULT_MONTHLY_RATE_PERCENT,
  MINIMUM_FIRST_INSTALLMENT_BUSINESS_DAYS,
} from "./constants.js";
import { AgreementContract } from "./components/AgreementContract.jsx";
import { CaseLibrary } from "./components/CaseLibrary.jsx";
import { CalculationReport } from "./components/CalculationReport.jsx";
import { AgreementPanel } from "./components/AgreementPanel.jsx";
import { BrandLogos } from "./components/BrandLogos.jsx";
import { SearchPanel } from "./components/SearchPanel.jsx";
import { buildAgreementDocumentData } from "./lib/agreementDocument.js";
import { calculateAgreement } from "./lib/agreementCalculator.js";
import {
  buildSoficoSpreadsheetRows,
  generateSoficoCsvBlob,
  normalizeSoficoUnitId,
} from "./services/soficoSpreadsheetService.js";
import {
  addBusinessDays,
  formatDateForInput,
  normalizeFirstInstallmentDate,
  parseInputDate,
} from "./lib/dates.js";
import { roundCurrency, sumCurrency } from "./lib/money.js";

const SIGNATURE_API_URL =
  import.meta.env.VITE_SIGNATURE_API_URL || "http://127.0.0.1:8000/api/signatures";
// Chave unica usada para persistir a biblioteca local sem depender de backend.
const CASE_LIBRARY_STORAGE_KEY = "simulador-acordos:case-library:v1";

// Coordena o fluxo principal da tela: upload do PDF, selecao de ativos e simulacao do acordo.
export function App() {
  const [agreementDate, setAgreementDate] = useState(() =>
    formatDateForInput(new Date()),
  );
  const minimumFirstInstallmentDate = formatDateForInput(
    addBusinessDays(
      parseInputDate(agreementDate),
      MINIMUM_FIRST_INSTALLMENT_BUSINESS_DAYS,
    ),
  );

  const [assets, setAssets] = useState([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState(new Set());
  const [statusMessage, setStatusMessage] = useState(
    "Envie a planilha débito em PDF para carregar os ativos automaticamente.",
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
  const [agreementMode, setAgreementMode] = useState("extrajudicial");
  const [legalCostsAmountInput, setLegalCostsAmountInput] = useState("0.00");
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPaymentAmount, setDownPaymentAmount] = useState(formatEditableMoney(0));
  const [downPaymentDate, setDownPaymentDate] = useState(minimumFirstInstallmentDate);
  const [note, setNote] = useState("");
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [contractFields, setContractFields] = useState({
    address: "",
    email: "",
    unit: ""
  });
  const [signatureFields, setSignatureFields] = useState({
    nome: "",
    email: "",
    telefone: "",
    mensagem: "Assine este acordo, por favor."
  });
  const [contractValidationMessage, setContractValidationMessage] = useState("");
  const [dialogMode, setDialogMode] = useState("pdf");
  const [signatureRequestPending, setSignatureRequestPending] = useState(false);
  const [savedCases, setSavedCases] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState("");
  const [caseLibraryReady, setCaseLibraryReady] = useState(false);
  // Normalizacoes derivadas mantem a digitacao livre, mas protegem os calculos.
  const installmentCount = normalizeInstallmentCount(installmentCountInput);
  const monthlyRatePercent = normalizePercent(
    monthlyRateInput,
    DEFAULT_MONTHLY_RATE_PERCENT,
  );
  const attorneyFeesAmount = normalizeMoney(attorneyFeesAmountInput);
  const legalCostsAmount = normalizeMoney(legalCostsAmountInput);
  const isJudicialAgreement = agreementMode === "judicial";

  const selectedAssets = assets.filter((asset) =>
    selectedAssetIds.has(asset.id),
  );
  // Valores financeiros principais sao derivados da selecao atual de ativos.
  const totalDebt = sumCurrency(selectedAssets, (asset) => asset.amount);
  const judicialLegalCostsAmount = isJudicialAgreement ? legalCostsAmount : 0;
  const agreementBaseAmount = roundCurrency(
    totalDebt + judicialLegalCostsAmount + attorneyFeesAmount,
  );
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
  const normalizedDownPaymentDate = hasDownPayment
    ? normalizeDownPaymentDate(
        downPaymentDate,
        agreementDate,
        normalizedFirstInstallmentDate,
      )
    : agreementDate;

  // A simulacao so existe quando ha ativos selecionados; o restante da tela reage a isso.
  const simulation = selectedAssets.length
    ? calculateAgreement({
        totalDebt,
        downPayment: normalizedDownPaymentAmount,
        monthlyRatePercent,
        attorneyFeesAmount,
        legalCostsAmount: judicialLegalCostsAmount,
        installmentCount,
        agreementDate,
        firstInstallmentDate: normalizedFirstInstallmentDate,
        downPaymentDate: normalizedDownPaymentDate,
      })
    : null;

  const searchDescription = buildSourceDescription(
    reportMetadata,
    uploadedFileName,
  );
  // O contrato usa um objeto proprio para isolar o template dos detalhes da simulacao.
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
    // Limpa mensagens temporarias ao fechar o dialog para evitar avisos antigos.
    if (!contractDialogOpen) {
      setContractValidationMessage("");
    }
  }, [contractDialogOpen]);

  useEffect(() => {
    // Carrega casos salvos somente no cliente, pois dependem de localStorage.
    setSavedCases(loadSavedCases());
    setCaseLibraryReady(true);
  }, []);

  useEffect(() => {
    if (!caseLibraryReady) {
      return;
    }

    // Persiste cada alteracao da biblioteca local depois que a leitura inicial terminou.
    window.localStorage.setItem(
      CASE_LIBRARY_STORAGE_KEY,
      JSON.stringify(savedCases),
    );
  }, [caseLibraryReady, savedCases]);

  useEffect(() => {
    // Quando a data-base muda, a primeira parcela tambem respeita o novo minimo.
    setFirstInstallmentDate((currentDate) =>
      normalizeFirstInstallmentDate(currentDate, minimumFirstInstallmentDate),
    );
    setDownPaymentDate((currentDate) =>
      normalizeDownPaymentDate(currentDate, agreementDate, minimumFirstInstallmentDate),
    );
  }, [minimumFirstInstallmentDate]);

  useEffect(() => {
    // Garante que a classe de impressao nao fique presa no body apos o print.
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

    await processDebtPdfFile(file);
    event.target.value = "";
  }

  async function handleFileDrop(file) {
    await processDebtPdfFile(file);
  }

  async function processDebtPdfFile(file) {
    if (!isPdfFile(file)) {
      setStatusMessage("Envie um arquivo PDF válido para carregar os ativos.");
      return;
    }

    setStatusMessage("Lendo PDF e extraindo ativos...");
    setUploadedFileName(file.name);

    try {
      const { parseDebtSpreadsheetPdf } =
        await import("./services/debtPdfParser.js");
      const parsedReport = await parseDebtSpreadsheetPdf(file);
      const normalizedReportMetadata = normalizeReportMetadataUnit(
        parsedReport.metadata,
      );
      setAssets(parsedReport.assets);
      setSelectedAssetIds(
        new Set(parsedReport.assets.map((asset) => asset.id)),
      );
      setReportMetadata(normalizedReportMetadata);
      setAttorneyFeesAmountInput(
        formatEditableMoney(parsedReport.metadata?.attorneyFeesAmount ?? 0),
      );
      setAgreementMode("extrajudicial");
      setLegalCostsAmountInput(
        formatEditableMoney(parsedReport.metadata?.legalCostsAmount ?? 0),
      );
      setContractFields({
        address: "",
        email: "",
        unit: normalizedReportMetadata?.unit ?? ""
      });
      setSignatureFields({
        nome: parsedReport.metadata?.owner ?? "",
        email: "",
        telefone: "",
        mensagem: "Assine este acordo, por favor."
      });
      setHasDownPayment(false);
      setDownPaymentAmount(formatEditableMoney(0));
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
      setAgreementMode("extrajudicial");
      setLegalCostsAmountInput("0.00");
      setContractFields({
        address: "",
        email: "",
        unit: ""
      });
      setSignatureFields({
        nome: "",
        email: "",
        telefone: "",
        mensagem: "Assine este acordo, por favor."
      });
      setStatusMessage(
        "Não foi possível ler este PDF. Verifique se ele segue o modelo da planilha débito.",
      );
    }
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

  // Atualiza a data-base do acordo e reaplica as regras dependentes dela no restante da simulacao.
  function handleAgreementDateChange(value) {
    if (!value) {
      return;
    }

    setAgreementDate(value);
  }

  // Ativa ou remove a entrada inicial mantendo o valor digitado para cenarios alternativos.
  function handleDownPaymentToggle(checked) {
    setHasDownPayment(checked);
  }

  // Mantem o valor digitado em formato simples para o campo numerico da entrada.
  function handleDownPaymentAmountChange(value) {
    setDownPaymentAmount(value);
  }

  function handleDownPaymentBlur() {
    setDownPaymentAmount(formatEditableMoney(normalizeMoney(downPaymentAmount)));
  }

  // Mantem a entrada dentro do intervalo entre data-base e primeira parcela.
  function handleDownPaymentDateChange(value) {
    setDownPaymentDate(value);
  }

  // Abre o formulario complementar para montar o contrato final antes da impressao.
  function handleExportPdf() {
    if (!simulation) {
      return;
    }

    setDialogMode("pdf");
    setContractDialogOpen(true);
  }

  async function handleExportCalculationPdf() {
    if (!simulation) {
      return;
    }

    try {
      const filename = buildCalculationReportFileName({
        reportMetadata,
        contractFields,
        agreementDate,
      });
      const pdfBlob = await generateDomPdfBlob({
        elementId: "calculation-report-root",
        exportClassName: "calculation-report-root--export",
        hostClassName: "calculation-report-export-host",
        filename,
        windowWidth: 960,
        windowHeight: 680,
        orientation: "landscape",
        margin: [3, 3, 5, 3],
      });
      downloadBlob(pdfBlob, filename);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o PDF do cálculo.",
      );
    }
  }

  async function handleExportSoficoSpreadsheet() {
    if (!simulation) {
      return;
    }

    try {
      const unitId = normalizeSoficoUnitId(
        contractFields.unit || reportMetadata?.unit || "",
      );
      if (!unitId) {
        setStatusMessage(
          "Informe a unidade antes de gerar o CSV Sofico.",
        );
        setDialogMode("pdf");
        setContractDialogOpen(true);
        return;
      }

      const rows = buildSoficoSpreadsheetRows({
        unitId,
        agreementDate,
        simulation,
      });
      const csvBlob = generateSoficoCsvBlob(
        rows,
        selectedAssets.map((asset) => asset.id),
      );
      downloadBlob(
        csvBlob,
        buildSoficoSpreadsheetFileName({
          reportMetadata,
          contractFields,
          agreementDate,
        }),
      );
      setStatusMessage("CSV Sofico gerado com sucesso.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel gerar o CSV Sofico.",
      );
    }
  }

  function handleSendForSignature() {
    if (!simulation) {
      return;
    }

    // Reaproveita o dialog do contrato, adicionando os campos especificos da assinatura.
    setDialogMode("signature");
    setContractDialogOpen(true);
  }

  // Mantem os dados do contrato sincronizados e replica o e-mail para a assinatura.
  function handleContractFieldChange(field, value) {
    setContractFields((currentFields) => ({
      ...currentFields,
      [field]: value
    }));

    if (field === "email") {
      setSignatureFields((currentFields) => ({
        ...currentFields,
        email: value
      }));
    }
  }

  // Atualiza somente os campos usados no envio para a D4Sign.
  function handleSignatureFieldChange(field, value) {
    setSignatureFields((currentFields) => ({
      ...currentFields,
      [field]: value
    }));
  }

  // Valida os dados complementares antes de imprimir ou enviar o contrato.
  function handleContractSubmit(event) {
    event.preventDefault();
    const missingFields = [];
    if (!contractFields.address.trim()) {
      missingFields.push("endereço");
    }
    if (!contractFields.email.trim()) {
      missingFields.push("e-mail");
    }
    if (!contractFields.unit.trim()) {
      missingFields.push("unidade");
    }

    if (dialogMode === "signature") {
      if (!signatureFields.nome.trim()) {
        missingFields.push("nome do signatário");
      }
      if (!signatureFields.email.trim()) {
        missingFields.push("e-mail do signatário");
      }
      if (!signatureFields.telefone.trim()) {
        missingFields.push("telefone do signatário");
      }
    }

    if (missingFields.length > 0) {
      setContractValidationMessage(
        `Preencha ${missingFields.join(", ")} antes de ${
          dialogMode === "signature" ? "enviar para assinatura" : "gerar o contrato"
        }.`,
      );
      return;
    }

    if (dialogMode === "signature") {
      void submitSignatureRequest();
      return;
    }

    setContractDialogOpen(false);
    setContractValidationMessage("");
    printContractDocument();
  }

  async function submitSignatureRequest() {
    if (!contractDocumentData) {
      return;
    }

    // Confirmacao explicita antes de acionar uma integracao externa.
    const confirmed = window.confirm(
      "Confirma o envio deste contrato em PDF para assinatura eletrônica?",
    );
    if (!confirmed) {
      return;
    }

    setSignatureRequestPending(true);
    setContractValidationMessage("");

    try {
      // Gera o PDF no navegador e envia como multipart/form-data para a API.
      const pdfBlob = await generateContractPdfBlob({
        filename: buildContractFileName(contractDocumentData)
      });
      const formData = new FormData();
      formData.append("nome", signatureFields.nome.trim());
      formData.append("email", signatureFields.email.trim());
      formData.append("telefone", normalizePhone(signatureFields.telefone));
      if (signatureFields.mensagem.trim()) {
        formData.append("mensagem", signatureFields.mensagem.trim());
      }
      formData.append("pdf", pdfBlob, buildContractFileName(contractDocumentData));

      const response = await fetch(SIGNATURE_API_URL, {
        method: "POST",
        body: formData
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        // A API FastAPI devolve erros em detail; usamos esse texto quando existir.
        const errorMessage =
          payload?.detail || "Não foi possível enviar o contrato para assinatura.";
        throw new Error(errorMessage);
      }

      setContractDialogOpen(false);
      setStatusMessage(
        payload?.signature_link
          ? `Contrato enviado para assinatura com sucesso. Link: ${payload.signature_link}`
          : "Contrato enviado para assinatura com sucesso.",
      );
    } catch (error) {
      setContractValidationMessage(
        error instanceof Error
          ? error.message
          : "Falha inesperada ao enviar o contrato para assinatura.",
      );
    } finally {
      setSignatureRequestPending(false);
    }
  }

  function printContractDocument() {
    const contractElement = document.getElementById("contract-print-root");
    if (!contractElement) {
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // Fallback para navegadores que bloqueiam popup de impressao.
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

    // Cria uma janela isolada com o contrato e os estilos atuais para imprimir sem a UI.
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

  function handleSaveCase() {
    if (!simulation) {
      return;
    }

    // O titulo sugerido combina devedor/unidade, mas o usuario pode ajustar antes de salvar.
    const suggestedTitle = buildSuggestedCaseTitle({
      reportMetadata,
      contractFields,
      selectedAssets
    });
    const title = window.prompt("Como deseja salvar este caso?", suggestedTitle);
    if (title === null) {
      return;
    }

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setStatusMessage("Informe um nome válido para salvar o caso.");
      return;
    }

    const snapshot = createCaseSnapshot({
      agreementDate,
      assets,
      selectedAssetIds,
      uploadedFileName,
      reportMetadata,
      firstInstallmentDate,
      installmentCountInput,
      monthlyRateInput,
      attorneyFeesAmountInput,
      agreementMode,
      legalCostsAmountInput,
      hasDownPayment,
      downPaymentAmount,
      downPaymentDate,
      note,
      contractFields,
      signatureFields
    });
    const caseId = activeCaseId || createCaseId();
    // O snapshot guarda o estado necessario para reabrir o caso exatamente como estava.
    const nextCase = {
      id: caseId,
      title: normalizedTitle,
      pinned: activeCaseId
        ? savedCases.find((savedCase) => savedCase.id === activeCaseId)?.pinned ?? false
        : false,
      savedAt: new Date().toISOString(),
      debtorName: reportMetadata?.owner || signatureFields.nome || "",
      unit: contractFields.unit || reportMetadata?.unit || "",
      totalPaid: simulation.totalPaid,
      firstInstallmentDate: normalizedFirstInstallmentDate,
      summaryLabel: buildSourceDescription(reportMetadata, uploadedFileName),
      snapshot
    };

    setSavedCases((currentCases) => upsertSavedCase(currentCases, nextCase));
    setActiveCaseId(caseId);
    setStatusMessage(`Caso "${normalizedTitle}" salvo na biblioteca local.`);
  }

  function handleLoadCase(caseId) {
    const savedCase = savedCases.find((entry) => entry.id === caseId);
    if (!savedCase?.snapshot) {
      setStatusMessage("Não foi possível abrir este caso salvo.");
      return;
    }

    // Restaura todos os estados editaveis a partir do snapshot salvo localmente.
    restoreCaseSnapshot(savedCase.snapshot, {
      setAgreementDate,
      setAssets,
      setSelectedAssetIds,
      setUploadedFileName,
      setReportMetadata,
      setFirstInstallmentDate,
      setInstallmentCountInput,
      setMonthlyRateInput,
      setAttorneyFeesAmountInput,
      setAgreementMode,
      setLegalCostsAmountInput,
      setHasDownPayment,
      setDownPaymentAmount,
      setDownPaymentDate,
      setNote,
      setContractFields,
      setSignatureFields
    });
    setActiveCaseId(savedCase.id);
    setContractDialogOpen(false);
    setDialogMode("pdf");
    setContractValidationMessage("");
    setStatusMessage(`Caso "${savedCase.title}" carregado da biblioteca.`);
  }

  function handlePinCase(caseId) {
    // Fixar apenas altera a ordenacao visual dos casos salvos.
    setSavedCases((currentCases) =>
      sortSavedCases(
        currentCases.map((savedCase) =>
          savedCase.id === caseId
            ? { ...savedCase, pinned: !savedCase.pinned }
            : savedCase,
        ),
      ),
    );
  }

  function handleRenameCase(caseId) {
    const currentCase = savedCases.find((savedCase) => savedCase.id === caseId);
    if (!currentCase) {
      return;
    }

    const nextTitle = window.prompt("Novo nome do caso:", currentCase.title);
    if (nextTitle === null) {
      return;
    }

    const normalizedTitle = nextTitle.trim();
    if (!normalizedTitle) {
      setStatusMessage("O nome do caso não pode ficar vazio.");
      return;
    }

    // Renomear tambem atualiza savedAt para refletir a ultima edicao visivel.
    setSavedCases((currentCases) =>
      sortSavedCases(
        currentCases.map((savedCase) =>
          savedCase.id === caseId
            ? { ...savedCase, title: normalizedTitle, savedAt: new Date().toISOString() }
            : savedCase,
        ),
      ),
    );
    setStatusMessage(`Caso renomeado para "${normalizedTitle}".`);
  }

  function handleDeleteCase(caseId) {
    const currentCase = savedCases.find((savedCase) => savedCase.id === caseId);
    if (!currentCase) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja excluir o caso "${currentCase.title}" da biblioteca local?`,
    );
    if (!confirmed) {
      return;
    }

    // A exclusao remove apenas o registro local salvo no navegador.
    setSavedCases((currentCases) =>
      currentCases.filter((savedCase) => savedCase.id !== caseId),
    );
    if (activeCaseId === caseId) {
      setActiveCaseId("");
    }
    setStatusMessage(`Caso "${currentCase.title}" removido da biblioteca local.`);
  }

  return (
    <>
      <main className="app-shell">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand__mark">G5</div>
            <div>
              <strong>Simulador de Acordos</strong>
              <span>Calculadora por PDF</span>
            </div>
          </div>

          <nav className="sidebar-flow" aria-label="Fluxo do simulador">
            <span className={assets.length ? "is-active" : ""}>PDF carregado</span>
            <span className={simulation ? "is-active" : ""}>Simulação</span>
            <span className={contractDocumentData ? "is-active" : ""}>Contrato</span>
          </nav>

          <CaseLibrary
            cases={savedCases}
            activeCaseId={activeCaseId}
            onLoadCase={handleLoadCase}
            onPinCase={handlePinCase}
            onRenameCase={handleRenameCase}
            onDeleteCase={handleDeleteCase}
          />
        </aside>

        <section className="app-main">
          <header className="topbar">
            <div>
              <p className="eyebrow">Simulador Web</p>
              <h1>Calculadora de Acordo por PDF</h1>
              <p>Leitura automática, simulação financeira e contrato em um só fluxo.</p>
            </div>
            <div className="topbar__meta">
              <BrandLogos />
              <strong>Leitura automática de débitos</strong>
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
            onFileDrop={handleFileDrop}
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
            agreementMode={agreementMode}
            legalCostsAmountInput={legalCostsAmountInput}
            note={note}
            hasDownPayment={hasDownPayment}
            downPaymentAmount={downPaymentAmount}
            downPaymentDate={normalizedDownPaymentDate}
            selectedAssets={selectedAssets}
            simulation={simulation}
            searchDescription={searchDescription}
            onSaveCase={handleSaveCase}
            onExportPdf={handleExportPdf}
            onExportCalculationPdf={handleExportCalculationPdf}
            onExportSoficoSpreadsheet={handleExportSoficoSpreadsheet}
            onSendForSignature={handleSendForSignature}
            signatureRequestPending={signatureRequestPending}
            onAgreementDateChange={handleAgreementDateChange}
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
            onAgreementModeChange={setAgreementMode}
            onLegalCostsAmountChange={setLegalCostsAmountInput}
            onLegalCostsBlur={() =>
              setLegalCostsAmountInput(formatEditableMoney(legalCostsAmount))
            }
            onDownPaymentToggle={handleDownPaymentToggle}
            onDownPaymentAmountChange={handleDownPaymentAmountChange}
            onDownPaymentBlur={handleDownPaymentBlur}
            onDownPaymentDateChange={handleDownPaymentDateChange}
            onNoteChange={setNote}
          />
          </div>
        </section>

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
                  <p>
                    {dialogMode === "signature"
                      ? "Revise os dados do contrato, informe os campos da assinatura e confirme o envio."
                      : "O relatório já preenche nome, documento e valores. Falta informar os campos abaixo."}
                  </p>
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
                  <span>Endereço completo</span>
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

                {dialogMode === "signature" && (
                  <>
                    <label className="field">
                      <span>Nome do signatário</span>
                      <input
                        type="text"
                        value={signatureFields.nome}
                        onChange={(event) => handleSignatureFieldChange("nome", event.target.value)}
                        placeholder="Nome completo"
                        required
                      />
                    </label>

                    <label className="field">
                      <span>E-mail para assinatura</span>
                      <input
                        type="email"
                        value={signatureFields.email}
                        onChange={(event) => handleSignatureFieldChange("email", event.target.value)}
                        placeholder="nome@exemplo.com"
                        required
                      />
                    </label>

                    <label className="field">
                      <span>Telefone / WhatsApp</span>
                      <input
                        type="tel"
                        value={signatureFields.telefone}
                        onChange={(event) => handleSignatureFieldChange("telefone", event.target.value)}
                        placeholder="+5511999999999"
                        required
                      />
                    </label>

                    <label className="field field--full">
                      <span>Mensagem para assinatura</span>
                      <input
                        type="text"
                        value={signatureFields.mensagem}
                        onChange={(event) => handleSignatureFieldChange("mensagem", event.target.value)}
                        placeholder="Mensagem enviada junto ao pedido de assinatura"
                      />
                    </label>
                  </>
                )}

                {contractValidationMessage && (
                  <div className="dialog-warning">{contractValidationMessage}</div>
                )}

                {dialogMode === "signature" && (
                  <div className="dialog-info">
                    O sistema ainda vai pedir uma confirmação final antes de enviar o PDF para a API.
                  </div>
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
                    {dialogMode === "signature"
                      ? signatureRequestPending
                        ? "Enviando..."
                        : "Confirmar e enviar"
                      : "Gerar PDF"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>

      <AgreementContract documentData={contractDocumentData} />
      <CalculationReport
        simulation={simulation}
        selectedAssets={selectedAssets}
        searchDescription={searchDescription}
        agreementMode={agreementMode}
        note={note}
      />
    </>
  );
}

function isPdfFile(file) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function normalizeReportMetadataUnit(metadata) {
  if (!metadata) {
    return metadata;
  }

  const normalizedUnitId = normalizeSoficoUnitId(metadata.unit);
  const unit = String(normalizedUnitId ?? "").trim() || metadata.unit;

  return {
    ...metadata,
    unit
  };
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
    return `${assetCount} ativo(s) carregado(s) para simulação.`;
  }

  return `${assetCount} ativo(s) carregado(s); ${skippedCount} linha(s) do PDF não puderam ser interpretadas automaticamente.`;
}

function normalizeInstallmentCount(value) {
  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue)) {
    return 1;
  }

  return Math.max(1, parsedValue);
}

// Interpreta percentuais digitados com virgula ou ponto e aplica fallback seguro.
function normalizePercent(value, fallbackValue) {
  const parsedValue = Number.parseFloat(String(value).replace(",", "."));
  if (Number.isNaN(parsedValue)) {
    return fallbackValue;
  }

  return Math.max(0, parsedValue);
}

// Aceita formatos brasileiros e simples para converter entradas monetarias editaveis.
function normalizeMoney(value) {
  const rawValue = String(value).trim();
  const normalizedValue = normalizeEditableMoneyText(rawValue);
  const parsedValue = Number.parseFloat(normalizedValue);
  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return roundCurrency(Math.max(parsedValue, 0));
}

function normalizeEditableMoneyText(value) {
  const compactValue = value.replace(/\s/g, "");
  if (compactValue.includes(",")) {
    return compactValue.replace(/\./g, "").replace(",", ".");
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(compactValue)) {
    return compactValue.replace(/\./g, "");
  }

  return compactValue;
}

// Mantem o valor padrao da taxa no formato mais natural para usuarios pt-BR.
function formatEditablePercent(value) {
  return String(value).replace(".", ",");
}

// Exibe dinheiro editavel em pt-BR sem acoplar o input ao Intl durante a digitacao.
function formatEditableMoney(value) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Monta um PDF temporario a partir do DOM oculto do contrato.
async function generateContractPdfBlob({ filename }) {
  return generateDomPdfBlob({
    elementId: "contract-print-root",
    exportClassName: "contract-print-root--export",
    hostClassName: "contract-export-host",
    filename,
    windowWidth: 794,
    windowHeight: 1123,
    orientation: "portrait",
    missingMessage: "Contrato não encontrado para exportação.",
    prepareMessage: "Falha ao preparar o contrato para exportação.",
  });
}

// Monta um PDF temporario a partir de uma area oculta da tela.
async function generateDomPdfBlob({
  elementId,
  exportClassName,
  hostClassName,
  filename,
  windowWidth,
  windowHeight,
  orientation,
  margin = [0, 0, 0, 0],
  missingMessage = "Conteúdo não encontrado para exportação.",
  prepareMessage = "Falha ao preparar o conteúdo para exportação.",
}) {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    throw new Error(missingMessage);
  }

  const exportHost = document.createElement("div");
  exportHost.className = hostClassName;
  exportHost.innerHTML = sourceElement.outerHTML;
  document.body.appendChild(exportHost);

  const exportRoot = exportHost.querySelector(`#${elementId}`);
  if (!exportRoot) {
    exportHost.remove();
    throw new Error(prepareMessage);
  }

  exportRoot.classList.add(exportClassName);

  try {
    // Espera assets carregarem antes de converter o DOM em PDF.
    await waitForImages(exportRoot);
    const worker = html2pdf()
      .set({
        margin,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          windowWidth,
          windowHeight,
          backgroundColor: "#ffffff"
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation
        },
        pagebreak: {
          mode: ["css", "legacy"]
        }
      })
      .from(exportRoot)
      .toPdf();

    return await worker.outputPdf("blob");
  } finally {
    exportHost.remove();
  }
}

// Resolve quando todas as imagens dentro de um elemento terminaram de carregar ou falhar.
function waitForImages(element) {
  const images = Array.from(element.querySelectorAll("img"));
  const pendingImages = images.filter((image) => !image.complete);

  if (!pendingImages.length) {
    return Promise.resolve();
  }

  return Promise.all(
    pendingImages.map(
      (image) =>
        new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        }),
    ),
  );
}

// Gera um nome de arquivo estavel e sem acentos a partir do devedor/data do contrato.
function buildContractFileName(documentData) {
  const debtorName = String(documentData?.debtorName || "contrato")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const signatureDate = String(documentData?.signatureDate || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
  return `${debtorName || "contrato"}-${signatureDate || "acordo"}.pdf`;
}

function buildCalculationReportFileName({ reportMetadata, contractFields, agreementDate }) {
  const label = String(
    reportMetadata?.owner || contractFields?.unit || reportMetadata?.unit || "calculo",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `calculo-acordo-${label || "simulacao"}-${agreementDate || "data"}.pdf`;
}

function buildSoficoSpreadsheetFileName({ reportMetadata, contractFields, agreementDate }) {
  const label = String(
    reportMetadata?.owner || contractFields?.unit || reportMetadata?.unit || "acordo",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `upload-acordos-sofico-${label || "acordo"}-${agreementDate || "data"}.csv`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Normaliza telefones nacionais para o formato internacional esperado pela API.
function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

function normalizeDownPaymentDate(selectedDate, minimumDate, maximumDate) {
  if (!selectedDate || selectedDate < minimumDate) {
    return minimumDate;
  }

  if (maximumDate && selectedDate > maximumDate) {
    return maximumDate;
  }

  return selectedDate;
}

// Le a biblioteca local tolerando dados antigos ou corrompidos no localStorage.
function loadSavedCases() {
  try {
    const rawValue = window.localStorage.getItem(CASE_LIBRARY_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortSavedCases(
      parsed.filter((entry) => entry && typeof entry === "object" && entry.snapshot),
    );
  } catch {
    return [];
  }
}

// Serializa todos os estados necessarios para reconstruir a tela depois.
function createCaseSnapshot(state) {
  return {
    agreementDate: state.agreementDate,
    assets: state.assets,
    selectedAssetIds: Array.from(state.selectedAssetIds),
    uploadedFileName: state.uploadedFileName,
    reportMetadata: state.reportMetadata,
    firstInstallmentDate: state.firstInstallmentDate,
    installmentCountInput: state.installmentCountInput,
    monthlyRateInput: state.monthlyRateInput,
    attorneyFeesAmountInput: state.attorneyFeesAmountInput,
    agreementMode: state.agreementMode,
    legalCostsAmountInput: state.legalCostsAmountInput,
    hasDownPayment: state.hasDownPayment,
    downPaymentAmount: state.downPaymentAmount,
    downPaymentDate: state.downPaymentDate,
    note: state.note,
    contractFields: state.contractFields,
    signatureFields: state.signatureFields
  };
}

// Aplica um snapshot salvo sobre os setters do App sem expor detalhes ao componente filho.
function restoreCaseSnapshot(snapshot, setters) {
  setters.setAgreementDate(snapshot.agreementDate || formatDateForInput(new Date()));
  setters.setAssets(Array.isArray(snapshot.assets) ? snapshot.assets : []);
  setters.setSelectedAssetIds(new Set(snapshot.selectedAssetIds || []));
  setters.setUploadedFileName(snapshot.uploadedFileName || "");
  setters.setReportMetadata(snapshot.reportMetadata || null);
  setters.setFirstInstallmentDate(snapshot.firstInstallmentDate || "");
  setters.setInstallmentCountInput(snapshot.installmentCountInput || String(DEFAULT_INSTALLMENTS));
  setters.setMonthlyRateInput(
    snapshot.monthlyRateInput || formatEditablePercent(DEFAULT_MONTHLY_RATE_PERCENT),
  );
  setters.setAttorneyFeesAmountInput(
    snapshot.attorneyFeesAmountInput || formatEditableMoney(DEFAULT_ATTORNEY_FEES_AMOUNT),
  );
  setters.setAgreementMode(snapshot.agreementMode || "extrajudicial");
  setters.setLegalCostsAmountInput(snapshot.legalCostsAmountInput || "0.00");
  setters.setHasDownPayment(Boolean(snapshot.hasDownPayment));
  setters.setDownPaymentAmount(snapshot.downPaymentAmount || formatEditableMoney(0));
  setters.setDownPaymentDate(snapshot.downPaymentDate || snapshot.agreementDate || "");
  setters.setNote(snapshot.note || "");
  setters.setContractFields(snapshot.contractFields || { address: "", email: "", unit: "" });
  setters.setSignatureFields(
    snapshot.signatureFields || {
      nome: "",
      email: "",
      telefone: "",
      mensagem: "Assine este acordo, por favor."
    },
  );
}

// Insere ou substitui um caso mantendo a ordenacao final da biblioteca.
function upsertSavedCase(currentCases, nextCase) {
  const filteredCases = currentCases.filter((savedCase) => savedCase.id !== nextCase.id);
  return sortSavedCases([nextCase, ...filteredCases]);
}

// Ordena fixados primeiro e, dentro de cada grupo, os mais recentes acima.
function sortSavedCases(cases) {
  return [...cases].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime();
  });
}

// Monta um titulo amigavel para o prompt de salvamento do caso.
function buildSuggestedCaseTitle({ reportMetadata, contractFields, selectedAssets }) {
  const unit = contractFields.unit || reportMetadata?.unit || "";
  const owner = reportMetadata?.owner || "";
  if (owner && unit) {
    return `${owner} - ${unit}`;
  }

  if (owner) {
    return owner;
  }

  if (unit) {
    return `Caso ${unit}`;
  }

  return `Caso com ${selectedAssets.length} ativo(s)`;
}

// Usa crypto.randomUUID quando disponivel e cai para um ID temporal simples.
function createCaseId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `case-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
