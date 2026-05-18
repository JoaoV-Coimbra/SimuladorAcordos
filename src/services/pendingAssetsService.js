import { normalizeLookupValue } from "../lib/lookup.js";

const mockAssetsDatabase = [
  {
    id: "ATV-001",
    ownerKey: { cpf: "12345678900", unidade: "TORRE A-101" },
    name: "Mensalidade condominial",
    reference: "Jan/2026",
    dueDate: "2026-01-10",
    amount: 1210.35
  },
  {
    id: "ATV-002",
    ownerKey: { cpf: "12345678900", unidade: "TORRE A-101" },
    name: "Mensalidade condominial",
    reference: "Fev/2026",
    dueDate: "2026-02-10",
    amount: 1198.4
  },
  {
    id: "ATV-003",
    ownerKey: { cpf: "12345678900", unidade: "TORRE A-101" },
    name: "Fundo de reserva",
    reference: "Mar/2026",
    dueDate: "2026-03-10",
    amount: 1204.3
  },
  {
    id: "ATV-004",
    ownerKey: { cpf: "98765432100", unidade: "TORRE B-202" },
    name: "Mensalidade condominial",
    reference: "Abr/2026",
    dueDate: "2026-04-10",
    amount: 840.15
  },
  {
    id: "ATV-005",
    ownerKey: { cpf: "98765432100", unidade: "TORRE B-202" },
    name: "Rateio extraordinario",
    reference: "Mai/2026",
    dueDate: "2026-05-10",
    amount: 650.55
  }
];

// Simula a consulta de ativos pendentes e concentra o ponto de troca futura pela API real.
export async function fetchPendingAssets(searchType, rawSearchValue) {
  // Normalizacao evita diferenca entre CPF pontuado e sem pontuacao ou unidade em caixa distinta.
  const searchValue = normalizeLookupValue(rawSearchValue, searchType);

  // Troque este mock pelo fetch da API quando o endpoint estiver definido.
  return mockAssetsDatabase.filter((asset) => {
    if (searchType === "cpf") {
      return asset.ownerKey.cpf === searchValue;
    }

    return normalizeLookupValue(asset.ownerKey.unidade, "unidade") === searchValue;
  });
}
