import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Le o PDF da planilha de debitos e devolve os ativos extraidos com os metadados do relatorio.
export async function parseDebtSpreadsheetPdf(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageLines = groupTextItemsIntoLines(textContent.items);
    lines.push(...pageLines);
  }

  return {
    metadata: extractReportMetadata(lines),
    assets: extractAssets(lines)
  };
}

// Agrupa os textos extraidos pelo PDF em linhas para facilitar a leitura do relatorio tabular.
function groupTextItemsIntoLines(items) {
  const sortedItems = items
    .filter((item) => item.str && item.str.trim())
    .map((item) => ({
      x: item.transform[4],
      y: item.transform[5],
      text: item.str.trim()
    }))
    .sort((a, b) => {
      const verticalDistance = b.y - a.y;
      if (Math.abs(verticalDistance) > 2.5) {
        return verticalDistance;
      }

      return a.x - b.x;
    });

  const rows = [];

  for (const item of sortedItems) {
    const lastRow = rows.at(-1);
    if (!lastRow || Math.abs(lastRow.y - item.y) > 2.5) {
      rows.push({
        y: item.y,
        items: [item]
      });
      continue;
    }

    lastRow.items.push(item);
  }

  return rows
    .map((row) => row.items
      .sort((a, b) => a.x - b.x)
      .map((item) => item.text.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
    )
    .filter(Boolean);
}

// Extrai os dados de contexto do cabecalho, como condominio, unidade e total do relatorio.
function extractReportMetadata(lines) {
  const metadata = {
    condominium: "",
    unit: "",
    totalDebt: ""
  };
  const fullText = lines.join(" ");

  const condominiumMatch = fullText.match(/CONDOM.NIO:\s*(.*?)\s+DATA ATUALIZA/i);
  if (condominiumMatch) {
    metadata.condominium = condominiumMatch[1].trim();
  }

  const totalMatch = fullText.match(/TOTAL DO D.BITO:\s*([\d.,]+)/i);
  if (totalMatch) {
    metadata.totalDebt = totalMatch[1].trim();
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.startsWith("UNIDADE:")) {
      continue;
    }

    const unitInlineMatch = line.match(/UNIDADE:\s*(.*?)\s+COD ERP:/i);
    if (unitInlineMatch && unitInlineMatch[1].trim()) {
      metadata.unit = unitInlineMatch[1].trim();
      break;
    }

    const nextLine = lines[index + 1] ?? "";
    if (nextLine) {
      metadata.unit = nextLine.trim();
      break;
    }
  }

  return metadata;
}

// Percorre as linhas de debito e monta a lista de ativos com ID, vencimento e valor atualizado.
function extractAssets(lines) {
  return lines
    .filter((line) => /^\d{2}\/\d{2}\/\d{4}\s+[\d.]+/.test(line))
    .map((line) => parseAssetLine(line))
    .filter(Boolean);
}

// Interpreta uma linha individual da tabela do PDF usando o ID como ativo e o Vlr Atualizado como valor devido.
function parseAssetLine(line) {
  const tokens = line.split(/\s+/);
  if (tokens.length < 9) {
    return null;
  }

  const dueDate = convertPdfDateToInput(tokens[0]);
  const assetId = tokens[1];
  const monetaryValues = tokens.slice(-6);
  const descriptionTokens = tokens.slice(2, -6);

  if (!dueDate || !descriptionTokens.length || monetaryValues.length < 6) {
    return null;
  }

  return {
    id: assetId,
    name: descriptionTokens.join(" "),
    reference: tokens[0],
    dueDate,
    amount: parseBrazilianNumber(monetaryValues[4])
  };
}

// Converte a data do relatorio no formato DD/MM/YYYY para o padrao YYYY-MM-DD usado nos inputs.
function convertPdfDateToInput(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return "";
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

// Converte valores monetarios brasileiros com virgula decimal para numero JavaScript.
function parseBrazilianNumber(value) {
  return Number.parseFloat(value.replace(/\./g, "").replace(",", "."));
}
