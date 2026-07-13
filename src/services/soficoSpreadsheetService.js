const COLUMN_HEADERS = [
  "UNIDADE_ID",
  "DATA",
  "TIPO",
  "VLR_ATUALIZADO",
  "HONORARIOS",
  "VLR_TOTAL",
  "QT_PARCELAS",
  "PARCELA",
  "VENCIMENTO",
  "VLR_PARCELA",
];

export function generateSoficoCsvBlob(rows, assetIds = []) {
  const csvRows = [
    COLUMN_HEADERS,
    ...rows.map(buildDataCsvRow),
    buildAssetsCsvRow(assetIds),
  ];
  const csvContent = csvRows.map(formatCsvRow).join("\r\n");

  return new Blob([csvContent], {
    type: "text/csv;charset=utf-8",
  });
}

export function buildSoficoSpreadsheetRows({
  unitId,
  agreementDate,
  simulation,
}) {
  const installments = simulation.schedule.filter(
    (installment) => installment.installmentNumber > 0,
  );
  const agreementType = simulation.installmentCount > 1 ? "Parcelado" : "Parcelado";

  return installments.map((installment) => ({
    unitId,
    agreementDate,
    agreementType,
    updatedAmount: simulation.totalDebt,
    attorneyFeesAmount: simulation.attorneyFeesAmount,
    totalAmount: simulation.correctedBalance,
    installmentCount: simulation.installmentCount,
    installmentNumber: installment.installmentNumber,
    dueDate: installment.dueDate,
    installmentAmount: installment.installmentAmount,
  }));
}

export function normalizeSoficoUnitId(value) {
  const rawValue = String(value || "").trim();
  const digitsMatch = rawValue.match(/\d+/);
  if (!digitsMatch) {
    return rawValue;
  }

  return Number.parseInt(digitsMatch[0], 10);
}

function buildDataCsvRow(row) {
  return [
    row.unitId,
    formatCsvDate(row.agreementDate),
    row.agreementType,
    formatCsvNumber(row.updatedAmount, 2),
    formatCsvNumber(row.attorneyFeesAmount, 2),
    formatCsvNumber(row.totalAmount, 2),
    row.installmentCount,
    row.installmentNumber,
    formatCsvDate(row.dueDate),
    formatCsvNumber(row.installmentAmount, 2),
  ];
}

function buildAssetsCsvRow(assetIds) {
  return [
    "ATIVOS",
    ...assetIds.map(normalizeAssetIdCellValue),
  ];
}

function normalizeAssetIdCellValue(value) {
  const rawValue = String(value ?? "").trim().replace(/[.\s-]/g, "");
  if (/^\d+$/.test(rawValue)) {
    return Number.parseInt(rawValue, 10);
  }

  return rawValue;
}

function formatCsvRow(values) {
  return values.map(formatCsvField).join(";");
}

function formatCsvField(value) {
  const textValue = String(value ?? "");
  if (!/[;"\r\n]/.test(textValue)) {
    return textValue;
  }

  return `"${textValue.replace(/"/g, '""')}"`;
}

function formatCsvNumber(value, fractionDigits = 0) {
  return Number(value || 0)
    .toFixed(fractionDigits)
    .replace(".", ",");
}

function formatCsvDate(value) {
  const [year, month, day] = String(value || "").split("-");
  if (!year || !month || !day) {
    return String(value || "");
  }

  return `${day}/${month}/${year}`;
}
