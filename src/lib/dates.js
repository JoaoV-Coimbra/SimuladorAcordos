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

// Soma apenas dias uteis a uma data base, ignorando fins de semana e feriados.
export function addBusinessDays(date, days) {
  const next = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    next.setDate(next.getDate() + 1);
    if (isBusinessDay(next)) {
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

// Dia util financeiro usado pela planilha: exclui fins de semana e feriados nacionais.
export function isBusinessDay(date) {
  return !isWeekend(date) && !isBrazilianHoliday(date);
}

function isBrazilianHoliday(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const fixedHolidayKey = `${month}-${day}`;
  const fixedHolidays = new Set([
    "1-1",
    "4-21",
    "5-1",
    "9-7",
    "10-12",
    "11-2",
    "11-15",
    "11-20",
    "12-25",
  ]);

  if (fixedHolidays.has(fixedHolidayKey)) {
    return true;
  }

  const easter = getEasterDate(date.getFullYear());
  const movableHolidays = [
    addDays(easter, -48),
    addDays(easter, -47),
    addDays(easter, -2),
    addDays(easter, 60),
  ];

  return movableHolidays.some((holiday) => isSameDate(date, holiday));
}

function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDate(firstDate, secondDate) {
  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
}

// Conta dias uteis apos a data inicial ate a data final, reproduzindo o NWdays da planilha.
export function countBusinessDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = parseInputDate(startDate);
  const end = parseInputDate(endDate);
  if (start >= end) {
    return 0;
  }

  const current = new Date(start);
  current.setDate(current.getDate() + 1);

  let businessDays = 0;
  while (current <= end) {
    if (isBusinessDay(current)) {
      businessDays += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return businessDays;
}

// Conta dias uteis incluindo as duas pontas do intervalo.
export function countBusinessDaysInclusive(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }

  const current = parseInputDate(startDate);
  const end = parseInputDate(endDate);
  if (current > end) {
    return 0;
  }

  let businessDays = 0;
  while (current <= end) {
    if (isBusinessDay(current)) {
      businessDays += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return businessDays;
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

// Avanca meses mantendo o padrao YYYY-MM-DD para montar a agenda de parcelas.
export function addMonthsToInputDate(value, monthsToAdd) {
  const date = parseInputDate(value);
  const targetDay = date.getDate();
  const next = new Date(date);

  next.setMonth(next.getMonth() + monthsToAdd + 1, 0);
  next.setDate(Math.min(targetDay, next.getDate()));

  return formatDateForInput(next);
}

// Ajusta a data da primeira parcela para nunca ficar antes do minimo permitido pela regra.
export function normalizeFirstInstallmentDate(selectedDate, minimumDate) {
  if (!selectedDate || selectedDate < minimumDate) {
    return minimumDate;
  }

  return selectedDate;
}
