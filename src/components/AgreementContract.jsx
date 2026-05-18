import g5JusLogo from "../assets/g5jus-logo-from-docx.png";

// Renderiza o contrato em formato de documento para impressão e salvamento em PDF.
export function AgreementContract({ documentData }) {
  // Sem dados calculados ainda, o template fica fora do DOM.
  if (!documentData) {
    return null;
  }

  return (
    <section id="contract-print-root" className="contract-print-root" aria-hidden="true">
      <header className="contract-page-header">
        <img src={g5JusLogo} alt="G5Jus" className="contract-page-header__logo" />
      </header>

      <footer className="contract-page-footer">
        <p>{documentData.footerAddress}</p>
        <p>{documentData.footerPhone}</p>
      </footer>

      <article className="contract-sheet">
        <header className="contract-header">
          <img src={g5JusLogo} alt="G5Jus" className="contract-header__logo" />
          <h1>ACORDO DE CONFISSÃO DE DÍVIDA COM PARCELAMENTO</h1>
        </header>

        <div className="contract-body">
          <p>
            <strong>CREDOR:</strong> {documentData.creditorName}, inscrito no CNPJ/MF sob o
            n.º {documentData.creditorDocument}, neste ato representado por seu advogado.
          </p>

          <p>
            <strong>DEVEDOR:</strong> {documentData.debtorName}, inscrito no CPF/MF sob o n.º{" "}
            {documentData.debtorDocument}, residente e domiciliado na {documentData.debtorAddress}.
          </p>

          <ol className="contract-clauses">
            <li>
              O DEVEDOR reconhece e confessa dever ao CREDOR a quantia líquida, certa e exigível
              de {documentData.consolidatedDebtAmount}, referente às cotas condominiais vencidas e
              não pagas de {documentData.debtPeriod}, da unidade {documentData.unit} do{" "}
              {documentData.condominium}, valor este que já contempla atualização monetária, multa,
              juros moratórios e honorários, consolidando-se como capital único da presente
              confissão de dívida.
            </li>

            <li>
              O valor consolidado será pago em {documentData.installmentCount} (
              {documentData.installmentCountExtenso}) parcelas mensais e sucessivas, fixas no
              valor de {documentData.installmentAmount}, vencendo-se a primeira em{" "}
              {documentData.firstInstallmentDate} e as demais no mesmo dia dos meses subsequentes.
            </li>

            <li>
              O pagamento das parcelas será realizado por meio de boletos bancários, a serem
              mensalmente enviados pelo setor financeiro do CREDOR ao endereço de e-mail:{" "}
              {documentData.debtorEmail} e serão acrescidos da tarifa bancária de registro e
              processamento no valor de {documentData.bankTariffAmount}.
            </li>

            <li>
              Eventuais dúvidas de natureza financeira relacionadas ao parcelamento deverão ser
              sanadas através do e-mail financeiro@sofico.com.br.
            </li>

            <li>
              Será ônus do DEVEDOR obter os boletos e efetuar o pagamento dentro das datas
              pactuadas para pagamento de cada parcela.
            </li>

            <li>
              O DEVEDOR compromete-se e obriga-se, a contar da data de assinatura desta negociação
              até o seu integral cumprimento, a efetuar pontualmente o pagamento de todas as suas
              cotas condominiais vincendas que não foram incluídas na negociação. O inadimplemento
              de qualquer das cotas acarretará a rescisão automática desta negociação.
            </li>

            <li>
              O inadimplemento de qualquer das parcelas incluídas nesta negociação também
              acarretará a sua rescisão automática, independente de notificação ou comunicação
              prévia do CREDOR.
            </li>

            <li>
              Esta negociação não pode ser interpretada como novação da obrigação originária.
              Havendo a sua rescisão todos os pagamentos porventura efetuados deverão ser imputados
              a partir da cota mais antiga para a mais recente, sendo retomada a cobrança do saldo
              residual acrescido de multa de 10% (dez por cento) e honorários advocatícios.
            </li>

            <li>
              Sem prejuízo de eventual assinatura eletrônica aposta neste instrumento, nos termos
              do art. 10 da Medida Provisória n.º 2.200-2/2001 e do art. 4.º da Lei n.º
              14.063/2020, o pagamento da primeira parcela da negociação importará em concordância
              do DEVEDOR quanto a todos os termos deste acordo, configurando ato jurídico perfeito
              e eficaz, com renúncia a qualquer questionamento sobre a origem, validade ou
              exigibilidade da dívida ora confessada.
            </li>

            <li>
              A presente confissão e reconhecimento do débito pelo DEVEDOR interrompe a prescrição
              relativamente ao montante ora consolidado. O prazo prescricional passará a fluir
              novamente, em sua integralidade, somente a partir do inadimplemento de qualquer
              obrigação prevista neste acordo, hipótese em que se tornará exigível o saldo devedor
              então existente, deduzidos os pagamentos eventualmente realizados.
            </li>

            <li>
              O DEVEDOR declara que o seu e-mail e telefone informados neste instrumento estão
              corretos e válidos, comprometendo-se a comunicar formalmente ao CREDOR qualquer
              alteração dos seus dados. Na ausência de tal comunicação serão reputadas válidas
              todas as comunicações enviadas para os endereços aqui registrados.
            </li>

            <li>
              O DEVEDOR declara, para todos os fins de direito, que é legítimo proprietário e
              possuidor do imóvel objeto do presente instrumento, razão pela qual possui plena
              legitimidade para celebrar o presente acordo, bem como para reconhecer, negociar e
              transacionar débitos, obrigações e encargos de qualquer natureza vinculados à
              respectiva unidade imobiliária, responsabilizando-se integralmente por seu
              adimplemento, ciente de que a falsidade ou inexatidão desta declaração poderá ensejar
              o imediato cancelamento do presente acordo.
            </li>

            <li>
              Esta negociação é celebrada em caráter irrevogável e irretratável, obrigando as
              partes e seus sucessores, a qualquer título, ao integral cumprimento de suas
              disposições.
            </li>
          </ol>
        </div>

        <footer className="contract-footer">
          <p>
            {documentData.signatureCity}, {documentData.signatureDate}.
          </p>

          <div className="contract-signatures">
            <div className="contract-signature-block">
              <div className="contract-signature-line" />
              <strong>{documentData.creditorName}</strong>
            </div>

            <div className="contract-signature-block">
              <div className="contract-signature-line" />
              <strong>{documentData.debtorName}</strong>
            </div>
          </div>
        </footer>
      </article>
    </section>
  );
}
