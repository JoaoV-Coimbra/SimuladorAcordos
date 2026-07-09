import JSZip from "jszip";
import soficoTemplateUrl from "../assets/Upload_Acordos.xlsx?url";

const SHEET_PATH = "xl/worksheets/sheet1.xml";
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

export async function generateSoficoSpreadsheetBlob(rows, assetIds = []) {
  const templateResponse = await fetch(soficoTemplateUrl);
  if (!templateResponse.ok) {
    throw new Error("Nao foi possivel carregar o modelo da planilha Sofico.");
  }

  const templateBuffer = await templateResponse.arrayBuffer();
  const workbookZip = await JSZip.loadAsync(templateBuffer);
  const sheetFile = workbookZip.file(SHEET_PATH);
  if (!sheetFile) {
    throw new Error("A aba principal do modelo Sofico nao foi encontrada.");
  }

  const sheetXml = await sheetFile.async("string");
  const rowXml = [
    buildHeaderRow(),
    ...rows.map(buildDataRow),
    buildAssetsRow(assetIds, rows.length + 2),
  ].join("");
  const lastRowNumber = Math.max(rows.length + 2, 1);
  const lastColumn = columnName(Math.max(COLUMN_HEADERS.length, assetIds.length + 1) - 1);
  const nextSheetXml = sheetXml
    .replace(/<dimension ref="[^"]*"\/>/, `<dimension ref="A1:${lastColumn}${lastRowNumber}"/>`)
    .replace(/<sheetData>[\s\S]*<\/sheetData>/, `<sheetData>${rowXml}</sheetData>`);

  workbookZip.file(SHEET_PATH, nextSheetXml);
  return workbookZip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

function buildAssetsRow(assetIds, rowNumber) {
  const cells = [
    buildTextCell(`A${rowNumber}`, "ATIVOS"),
    ...assetIds.map((assetId, index) =>
      buildCell(`${columnName(index + 1)}${rowNumber}`, normalizeAssetIdCellValue(assetId), 0),
    ),
  ];

  return `<row r="${rowNumber}" spans="1:${Math.max(cells.length, COLUMN_HEADERS.length)}" x14ac:dyDescent="0.25">${cells.join("")}</row>`;
}

export function normalizeSoficoUnitId(value) {
  const rawValue = String(value || "").trim();
  const digitsMatch = rawValue.match(/\d+/);
  if (!digitsMatch) {
    return rawValue;
  }

  return Number.parseInt(digitsMatch[0], 10);
}

function buildHeaderRow() {
  const cells = COLUMN_HEADERS.map((header, index) =>
    buildTextCell(`${columnName(index)}1`, header, index === 1 || index === 8 ? 2 : undefined),
  );

  return `<row r="1" spans="1:10" x14ac:dyDescent="0.25">${cells.join("")}</row>`;
}

function buildDataRow(row, index) {
  const rowNumber = index + 2;
  const cells = [
    buildCell(`A${rowNumber}`, row.unitId),
    buildNumberCell(`B${rowNumber}`, toExcelDateSerial(row.agreementDate), 1),
    buildTextCell(`C${rowNumber}`, row.agreementType),
    buildNumberCell(`D${rowNumber}`, row.updatedAmount),
    buildNumberCell(`E${rowNumber}`, row.attorneyFeesAmount),
    buildNumberCell(`F${rowNumber}`, row.totalAmount),
    buildNumberCell(`G${rowNumber}`, row.installmentCount),
    buildNumberCell(`H${rowNumber}`, row.installmentNumber),
    buildNumberCell(`I${rowNumber}`, toExcelDateSerial(row.dueDate), 1),
    buildNumberCell(`J${rowNumber}`, row.installmentAmount),
  ];

  return `<row r="${rowNumber}" spans="1:10" x14ac:dyDescent="0.25">${cells.join("")}</row>`;
}

function buildCell(reference, value, styleId) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return buildNumberCell(reference, value, styleId);
  }

  return buildTextCell(reference, value, styleId);
}

function buildNumberCell(reference, value, styleId) {
  const styleAttribute = styleId === undefined ? "" : ` s="${styleId}"`;
  return `<c r="${reference}"${styleAttribute}><v>${formatXmlNumber(value)}</v></c>`;
}

function buildTextCell(reference, value, styleId) {
  const styleAttribute = styleId === undefined ? "" : ` s="${styleId}"`;
  return `<c r="${reference}"${styleAttribute} t="inlineStr"><is><t>${escapeXml(
    value,
  )}</t></is></c>`;
}

function columnName(index) {
  let columnIndex = index + 1;
  let name = "";
  while (columnIndex > 0) {
    const remainder = (columnIndex - 1) % 26;
    name = String.fromCharCode("A".charCodeAt(0) + remainder) + name;
    columnIndex = Math.floor((columnIndex - 1) / 26);
  }

  return name;
}

function normalizeAssetIdCellValue(value) {
  const rawValue = String(value ?? "").trim().replace(/[.\s-]/g, "");
  if (/^\d+$/.test(rawValue)) {
    return Number.parseInt(rawValue, 10);
  }

  return rawValue;
}

function formatXmlNumber(value) {
  return String(Number(value || 0).toFixed(2)).replace(/\.00$/, "");
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toExcelDateSerial(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = Date.UTC(year, month - 1, day);
  const excelEpoch = Date.UTC(1899, 11, 30);
  return Math.round((date - excelEpoch) / 86400000);
}
