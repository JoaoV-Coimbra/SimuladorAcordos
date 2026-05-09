const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

// Formata um numero como moeda BRL para exibicao na interface.
export function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

// Formata percentuais mantendo duas casas decimais para o resumo financeiro.
export function formatPercent(value) {
  return percentFormatter.format(value || 0);
}

// Converte a data YYYY-MM-DD para o padrao visual DD/MM/YYYY.
export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
