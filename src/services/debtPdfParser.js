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

  const assetExtraction = extractAssets(lines);

  return {
    metadata: extractReportMetadata(lines, assetExtraction),
    assets: assetExtraction.assets
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
function extractReportMetadata(lines, assetExtraction = { skippedLines: [] }) {
  const metadata = {
    condominium: "",
    unit: "",
    totalDebt: "",
    parserSummary: {
      skippedLines: assetExtraction.skippedLines.length
    }
  };
  const rawFullText = lines.join(" ");
  const normalizedFullText = normalizeSearchText(rawFullText);

  const rawCondominiumMatch = rawFullText.match(/CONDOM.NIO:\s*(.*?)\s+DATA ATUALIZA/i);
  const normalizedCondominiumMatch = normalizedFullText.match(
    /CONDOMINIO:\s*(.*?)\s+DATA ATUALIZA/i,
  );
  metadata.condominium = rawCondominiumMatch?.[1]?.trim()
    || normalizedCondominiumMatch?.[1]?.trim()
    || "";

  const rawTotalMatch = rawFullText.match(/TOTAL DO D.BITO:\s*([\d.,]+)/i);
  const normalizedTotalMatch = normalizedFullText.match(
    /TOTAL DO DEBITO:\s*([\d.,]+)/i,
  );
  metadata.totalDebt = rawTotalMatch?.[1]?.trim()
    || normalizedTotalMatch?.[1]?.trim()
    || "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const normalizedLine = normalizeSearchText(line);
    if (!normalizedLine.startsWith("UNIDADE:")) {
      continue;
    }

    const unitInlineMatch =
      line.match(/UNIDADE:\s*(.*?)\s+COD ERP:/i)
      || normalizedLine.match(/UNIDADE:\s*(.*?)\s+COD ERP:/i);
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
  const assets = [];
  const skippedLines = [];

  for (const line of lines) {
    if (!looksLikeAssetLine(line)) {
      continue;
    }

    const parsedAsset = parseAssetLine(line);
    if (parsedAsset) {
      assets.push(parsedAsset);
      continue;
    }

    skippedLines.push(line);
  }

  return {
    assets,
    skippedLines
  };
}

// Interpreta uma linha individual da tabela do PDF usando o ID como ativo e o Vlr Atualizado como valor devido.
function parseAssetLine(line) {
  const normalizedLine = line.replace(/\s+/g, " ").trim();
  const leadMatch = normalizedLine.match(
    /^(?<dueDate>\d{2}\/\d{2}\/\d{4})\s+(?<assetId>[A-Z0-9./-]+)\s+(?<rest>.+)$/i,
  );

  if (!leadMatch?.groups) {
    return null;
  }

  const { dueDate: dueDateToken, assetId, rest } = leadMatch.groups;
  const dueDate = convertPdfDateToInput(dueDateToken);
  const currencyMatches = Array.from(
    rest.matchAll(/-?\d[\d.]*,\d{2}/g),
  );

  if (!dueDate || currencyMatches.length < 2) {
    return null;
  }

  const firstMoneyIndex = currencyMatches[0].index ?? -1;
  if (firstMoneyIndex <= 0) {
    return null;
  }

  const description = rest.slice(0, firstMoneyIndex).replace(/\s+/g, " ").trim();
  const amountToken =
    currencyMatches.at(-2)?.[0] ??
    currencyMatches.at(-1)?.[0] ??
    "";

  if (!description || !amountToken) {
    return null;
  }

  return {
    id: assetId,
    name: description,
    reference: dueDateToken,
    dueDate,
    amount: parseBrazilianNumber(amountToken)
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

// Remove variacoes de acento e caracteres especiais para tornar as buscas do cabecalho mais tolerantes.
function normalizeSearchText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Identifica linhas com a estrutura geral da tabela de debitos, mesmo com pequenas variacoes no layout.
function looksLikeAssetLine(line) {
  const normalizedLine = line.replace(/\s+/g, " ").trim();
  if (!/^\d{2}\/\d{2}\/\d{4}\s+/.test(normalizedLine)) {
    return false;
  }

  const currencyMatches = normalizedLine.match(/-?\d[\d.]*,\d{2}/g) ?? [];
  return currencyMatches.length >= 2;
}
