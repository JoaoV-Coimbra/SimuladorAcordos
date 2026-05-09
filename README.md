# Simulador de Acordos

Aplicação React com Vite para simular acordos pré-fixados com:

- busca por CPF ou Unidade;
- listagem de ativos pendentes;
- seleção dos ativos para composição da dívida;
- cálculo da semi-proposta com pro rata e tabela Price.

## Como rodar

1. Instale as dependências com `npm install`.
2. Rode o projeto com `npm run dev`.
3. Acesse a URL exibida pelo Vite.
4. Faça uma busca usando os exemplos mockados:
   - CPF: `12345678900`
   - Unidade: `TORRE A-101`
5. Ajuste número de parcelas, observação e data da 1ª parcela.
6. A semi-proposta será recalculada automaticamente.

## Onde ligar a API depois

No arquivo `src/services/pendingAssetsService.js`, substitua a função `fetchPendingAssets` pela chamada real da API.

Ela hoje retorna uma lista com o formato:

```js
{
  id: "ATV-001",
  ownerKey: { cpf: "12345678900", unidade: "TORRE A-101" },
  name: "Mensalidade condominial",
  reference: "Jan/2026",
  dueDate: "2026-01-10",
  amount: 1210.35
}
```

## Regras operacionais

- a data do acordo é sempre a data atual;
- a 1ª parcela deve ser no mínimo em 2 dias úteis a partir de hoje;
- a taxa a.m. fica travada para edição;
- não há entrada no fluxo atual.

## Regra de cálculo implementada

- saldo parcelado = dívida total
- taxa diária = taxa mensal / 30
- dias pro rata = diferença entre data do acordo e data da 1ª parcela
- saldo corrigido = saldo parcelado * (1 + taxa diária * dias pro rata)
- parcela = fórmula Price com pagamento no início do período sobre o saldo corrigido
- total pago = soma das parcelas
- total de juros = total pago - saldo parcelado
