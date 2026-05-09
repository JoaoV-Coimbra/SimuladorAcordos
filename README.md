# Simulador de Acordos

Aplicacao React com Vite para montar uma semi-proposta de acordo a partir do upload de uma planilha de debito em PDF.

## Funcionalidades atuais

- upload de arquivo PDF da planilha de debito;
- leitura automatica do relatorio com `pdfjs-dist`;
- extracao de metadados do PDF, como condominio, unidade e total do relatorio;
- extracao dos ativos a partir das linhas da tabela, usando o ID do ativo e o campo de valor atualizado;
- selecao individual ou total dos ativos que entram na composicao da divida;
- simulacao automatica do acordo com pro rata e tabela Price;
- edicao da data da primeira parcela, quantidade de parcelas e observacao comercial;
- exportacao da semi-proposta pelo fluxo de impressao do navegador.

## Como rodar

1. Instale as dependencias com `npm install`.
2. Inicie o ambiente local com `npm run dev`.
3. Acesse a URL exibida pelo Vite.
4. Envie um PDF no formato esperado pela planilha de debito.
5. Revise os ativos extraidos, ajuste a selecao e preencha os parametros do acordo.
6. Use `Exportar PDF` para imprimir ou salvar a semi-proposta.

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

## Regras operacionais implementadas

- a data do acordo e sempre a data atual;
- a primeira parcela deve respeitar o minimo de `2` dias uteis a partir da data do acordo;
- a taxa mensal e fixa em `2,2% a.m.` e nao pode ser editada na interface;
- a quantidade inicial sugerida e `15` parcelas;
- nao existe entrada no fluxo atual;
- a exportacao em PDF usa `window.print()` com o layout da tela.

## Regra de calculo

- saldo parcelado = divida total selecionada;
- taxa diaria = taxa mensal / 30;
- dias pro rata = diferenca entre a data do acordo e a data da primeira parcela;
- saldo corrigido = saldo parcelado * (1 + taxa diaria * dias pro rata);
- parcela fixa = formula Price com pagamento da primeira parcela no inicio do periodo;
- o cronograma aplica juros mensais a partir da segunda parcela;
- total pago = soma das parcelas;
- total de juros = total pago - saldo parcelado.

## Estrutura relevante

- [src/App.jsx](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/src/App.jsx): coordena upload, selecao e simulacao.
- [src/services/debtPdfParser.js](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/src/services/debtPdfParser.js): leitura e extracao dos dados do PDF.
- [src/lib/agreementCalculator.js](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/src/lib/agreementCalculator.js): regra principal de calculo financeiro.
- [src/lib/installments.js](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/src/lib/installments.js): montagem do cronograma de parcelas.
- [src/components/SearchPanel.jsx](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/src/components/SearchPanel.jsx): upload e grade de ativos extraidos.
- [src/components/AgreementPanel.jsx](/C:/Users/Coimbra/Desktop/Simulador%20de%20Acordos/src/components/AgreementPanel.jsx): parametros, resumo da proposta e cronograma.

## Observacoes

- o parser atual foi feito para o modelo de PDF da planilha de debito usado pelo projeto;
- hoje nao existe integracao com API ou backend;
- se o layout do PDF mudar, a logica de extracao em `src/services/debtPdfParser.js` provavelmente precisara ser ajustada.
