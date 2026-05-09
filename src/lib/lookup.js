// Normaliza o valor de busca conforme o tipo informado para facilitar comparacoes consistentes.
export function normalizeLookupValue(value, type) {
  if (type === "cpf") {
    return value.replace(/\D/g, "");
  }

  return value.trim().toUpperCase();
}
