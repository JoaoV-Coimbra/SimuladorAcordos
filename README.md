# Simulador de Acordos

Aplicacao React com Vite para montar uma semi-proposta de acordo a partir do upload de uma planilha de debito em PDF, gerar o contrato final e enviar o PDF para assinatura eletronica por meio da API FastAPI/D4Sign.

## Funcionalidades atuais

- upload de arquivo PDF da planilha de debito;
- leitura automatica do relatorio com `pdfjs-dist`;
- extracao de metadados do PDF, como condominio, unidade e total do relatorio;
- extracao dos ativos a partir da secao de debitos condominiais, usando o ID do ativo e o campo Vlr Final;
- selecao individual ou total dos ativos que entram na composicao da divida;
- simulacao automatica do acordo com pro rata e tabela Price;
- edicao da data do acordo, data da primeira parcela, quantidade de parcelas, taxa, honorarios, entrada e observacao comercial;
- geracao do contrato em formato imprimivel;
- exportacao do contrato para PDF com `html2pdf.js`;
- envio do PDF gerado para assinatura eletronica pela API `/api/signatures`;
- biblioteca local de casos salvos no `localStorage`.

## Como rodar

1. Instale as dependencias com `npm install`.
2. Inicie o ambiente local com `npm run dev`.
3. Acesse a URL exibida pelo Vite.
4. Envie um PDF no formato esperado pela planilha de debito.
5. Revise os ativos extraidos, ajuste a selecao e preencha os parametros do acordo.
6. Use `Gerar contrato PDF` para imprimir/salvar o contrato ou `Enviar para assinatura` para chamar a API.

## Integracao com a API

O front envia contratos para assinatura usando `multipart/form-data`.

Por padrao, a URL usada e:

```bash
http://127.0.0.1:8000/api/signatures
```

Para alterar, crie um `.env` no projeto do front com:

```bash
VITE_SIGNATURE_API_URL=http://127.0.0.1:8000/api/signatures
```

Campos enviados:

- `nome`
- `email`
- `telefone`
- `mensagem` opcional
- `pdf` com o contrato gerado no navegador

Observacao: se o front e a API rodarem em portas diferentes, a API precisa liberar CORS para a origem do Vite, normalmente `http://127.0.0.1:5173`.

## Scripts

- `npm run dev`: sobe o projeto em desenvolvimento.
- `npm run build`: gera a build de producao em `dist/`.
- `npm run preview`: abre a build gerada localmente.

## Fluxo atual da aplicacao

1. O usuario envia o PDF da planilha de debito.
2. O sistema le todas as paginas e agrupa os textos em linhas.
3. Sao extraidos os metadados principais do cabecalho do relatorio.
4. Cada linha valida da tabela vira um ativo com `id`, `name`, `reference`, `dueDate` e `amount`.
5. Todos os ativos encontrados entram selecionados por padrao.
6. A semi-proposta e recalculada automaticamente sempre que a selecao ou os parametros mudam.
7. O usuario complementa endereco, e-mail e unidade para montar o contrato.
8. O contrato pode ser impresso/salvo ou enviado para assinatura pela API.

## Regras operacionais implementadas

- a data do acordo e sempre a data atual;
- a primeira parcela deve respeitar o minimo de `2` dias uteis a partir da data do acordo;
- a taxa mensal inicial e `2,2% a.m.` e pode ser editada na interface;
- a quantidade inicial sugerida e `15` parcelas;
- a entrada e opcional e limitada ao valor base do acordo;
- a geracao local usa impressao do navegador;
- o envio para assinatura usa `html2pdf.js` para criar um `Blob` PDF e mandar para o backend.

## Regra de calculo

- saldo parcelado = divida total selecionada + honorarios advocaticios - entrada;
- taxa diaria = taxa mensal / 30;
- dias pro rata = diferenca entre a data do acordo e a data da primeira parcela;
- saldo corrigido = saldo parcelado * (1 + taxa diaria) ^ dias pro rata;
- parcela fixa = formula Price no modelo Pre sobre o saldo corrigido;
- o cronograma aplica juros mensais a partir da segunda parcela;
- total pago = entrada + soma das parcelas;
- total de juros = total pago - divida total selecionada.

## Estrutura relevante

- [src/App.jsx](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/SimuladorAcordos-main/src/App.jsx): coordena upload, selecao e simulacao.
- [src/services/debtPdfParser.js](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/SimuladorAcordos-main/src/services/debtPdfParser.js): leitura e extracao dos dados do PDF.
- [src/lib/agreementCalculator.js](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/SimuladorAcordos-main/src/lib/agreementCalculator.js): regra principal de calculo financeiro.
- [src/lib/installments.js](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/SimuladorAcordos-main/src/lib/installments.js): montagem do cronograma de parcelas.
- [src/lib/agreementDocument.js](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/SimuladorAcordos-main/src/lib/agreementDocument.js): monta os dados finais usados no contrato.
- [src/components/SearchPanel.jsx](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/SimuladorAcordos-main/src/components/SearchPanel.jsx): upload e grade de ativos extraidos.
- [src/components/AgreementPanel.jsx](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/SimuladorAcordos-main/src/components/AgreementPanel.jsx): parametros, resumo da proposta e cronograma.
- [src/components/AgreementContract.jsx](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/SimuladorAcordos-main/src/components/AgreementContract.jsx): template visual do contrato final.
- [src/components/CaseLibrary.jsx](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/SimuladorAcordos-main/src/components/CaseLibrary.jsx): biblioteca local de casos salvos.

## Observacoes

- o parser atual foi feito para o modelo de PDF da planilha de debito usado pelo projeto;
- a integracao com API ja existe no front, mas depende da API FastAPI estar rodando e configurada;
- se o layout do PDF mudar, a logica de extracao em `src/services/debtPdfParser.js` provavelmente precisara ser ajustada.
