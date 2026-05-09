// Arredonda valores monetarios para duas casas decimais.
export function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Soma uma colecao de valores monetarios e devolve o total ja arredondado.
export function sumCurrency(items, selector) {
  return roundCurrency(items.reduce((total, item) => total + selector(item), 0));
}
