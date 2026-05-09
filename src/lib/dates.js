// Converte um objeto Date para o formato YYYY-MM-DD usado pelos inputs HTML.
export function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Reconstrui uma data local a partir de uma string do input evitando ambiguidade de fuso.
export function parseInputDate(value) {
  return new Date(`${value}T00:00:00`);
}

// Soma apenas dias uteis a uma data base, ignorando sabados e domingos.
export function addBusinessDays(date, days) {
  const next = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    next.setDate(next.getDate() + 1);
    if (!isWeekend(next)) {
      addedDays += 1;
    }
  }

  return next;
}

// Identifica se uma data cai em fim de semana para apoiar as regras de vencimento.
export function isWeekend(date) {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

// Calcula a diferenca em dias corridos entre duas datas no formato do input.
export function dateDiffInDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = parseInputDate(startDate);
  const end = parseInputDate(endDate);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

// Ajusta a data da primeira parcela para nunca ficar antes do minimo permitido pela regra.
export function normalizeFirstInstallmentDate(selectedDate, minimumDate) {
  if (!selectedDate || selectedDate < minimumDate) {
    return minimumDate;
  }

  return selectedDate;
}
