import { formatCurrency, formatDate, formatDateLong } from "./formatters.js";

const CREDITOR_NAME =
  "G5 CR\u00c9DITOS CONDOMINIAIS FUNDO DE INVESTIMENTO EM DIREITOS CREDIT\u00d3RIOS N\u00c3O-PADRONIZADOS";
const CREDITOR_DOCUMENT = "32.948.668/0001-51";
const DEFAULT_SIGNATURE_CITY = "Rio de Janeiro";
const DEFAULT_BANK_TARIFF = "R$ 5,50";
const DEFAULT_FOOTER_ADDRESS =
  "Av. Borges de Medeiros, n\u00ba 633, Sala 706, Leblon, Rio de Janeiro/RJ, 22430-041";
const DEFAULT_FOOTER_PHONE = "(55 21) 3205-9180";

// Concentra as variáveis do contrato para manter o template desacoplado da simulação e do parser.
export function buildAgreementDocumentData({
  agreementDate,
  reportMetadata,
  selectedAssets,
  simulation,
  contractFields
}) {
  const debtPeriod = buildDebtPeriodLabel(selectedAssets);
  const debtorDocument = normalizeDocument(reportMetadata?.ownerDocument);
  const debtorName = (reportMetadata?.owner || "").trim();
  const condominium = (reportMetadata?.condominium || "").trim();
  const unit = (contractFields.unit || reportMetadata?.unit || "").trim();
  const address = (contractFields.address || "").trim();
  const email = (contractFields.email || "").trim();
  const installmentCount = simulation?.installmentCount ?? 0;
  const installmentCountExtenso = numberToPortugueseWords(installmentCount).toUpperCase();

  return {
    creditorName: CREDITOR_NAME,
    creditorDocument: CREDITOR_DOCUMENT,
    debtorName,
    debtorDocument,
    debtorAddress: address,
    debtorEmail: email,
    condominium,
    unit,
    consolidatedDebtAmount: formatCurrency(simulation?.agreementBaseAmount ?? 0),
    debtPeriod,
    installmentCount,
    installmentCountExtenso,
    installmentAmount: formatCurrency(simulation?.installmentAmount ?? 0),
    firstInstallmentDate: formatDate(simulation?.firstInstallmentDate),
    signatureDate: formatDateLong(agreementDate),
    signatureCity: DEFAULT_SIGNATURE_CITY,
    bankTariffAmount: DEFAULT_BANK_TARIFF,
    footerAddress: DEFAULT_FOOTER_ADDRESS,
    footerPhone: DEFAULT_FOOTER_PHONE
  };
}

function buildDebtPeriodLabel(selectedAssets) {
  if (!selectedAssets?.length) {
    return "";
  }

  const orderedDates = selectedAssets
    .map((asset) => asset.dueDate)
    .filter(Boolean)
    .sort();

  if (!orderedDates.length) {
    return "";
  }

  const start = formatMonthYear(orderedDates[0]);
  const end = formatMonthYear(orderedDates.at(-1));
  return start && end ? `${start} até ${end}` : "";
}

function formatMonthYear(value) {
  if (!value) {
    return "";
  }

  const [year, month] = value.split("-");
  if (!year || !month) {
    return "";
  }

  return `${month}/${year}`;
}

function normalizeDocument(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  return String(value || "").trim();
}

function numberToPortugueseWords(value) {
  const number = Math.max(0, Number.parseInt(value, 10) || 0);
  if (number === 0) {
    return "zero";
  }

  const units = [
    "",
    "um",
    "dois",
    "tres",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove"
  ];
  const teens = [
    "dez",
    "onze",
    "doze",
    "treze",
    "quatorze",
    "quinze",
    "dezesseis",
    "dezessete",
    "dezoito",
    "dezenove"
  ];
  const tens = [
    "",
    "",
    "vinte",
    "trinta",
    "quarenta",
    "cinquenta",
    "sessenta",
    "setenta",
    "oitenta",
    "noventa"
  ];
  const hundreds = [
    "",
    "cento",
    "duzentos",
    "trezentos",
    "quatrocentos",
    "quinhentos",
    "seiscentos",
    "setecentos",
    "oitocentos",
    "novecentos"
  ];

  if (number === 100) {
    return "cem";
  }

  if (number < 10) {
    return units[number];
  }

  if (number < 20) {
    return teens[number - 10];
  }

  if (number < 100) {
    const ten = Math.floor(number / 10);
    const unit = number % 10;
    return [tens[ten], units[unit]].filter(Boolean).join(" e ");
  }

  if (number < 1000) {
    const hundred = Math.floor(number / 100);
    const remainder = number % 100;
    return [hundreds[hundred], remainder ? numberToPortugueseWords(remainder) : ""]
      .filter(Boolean)
      .join(" e ");
  }

  return String(number);
}
