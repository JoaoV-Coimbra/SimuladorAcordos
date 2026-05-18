// Exibe as marcas no topo do simulador sem depender de arquivos estaticos externos.
export function BrandLogos() {
  return (
    <div className="brand-logos" aria-label="Marcas parceiras">
      <G5PartnersLogo />
      <SoficoLogo />
    </div>
  );
}

function G5PartnersLogo() {
  // SVG inline evita depender de uma imagem externa para uma marca simples no topo.
  return (
    <svg
      viewBox="0 0 260 70"
      className="brand-logo brand-logo--g5"
      role="img"
      aria-label="G5 Partners"
    >
      <rect width="260" height="70" rx="14" fill="#ffffff" />
      <text
        x="16"
        y="51"
        fill="#b10f4c"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="56"
        fontStyle="italic"
      >
        G5
      </text>
      <text
        x="92"
        y="49"
        fill="#22378a"
        fontFamily="'Trebuchet MS', Arial, sans-serif"
        fontSize="34"
        fontWeight="500"
      >
        Partners
      </text>
    </svg>
  );
}

function SoficoLogo() {
  // Mantem a segunda marca no mesmo sistema visual do logo G5.
  return (
    <svg
      viewBox="0 0 260 70"
      className="brand-logo brand-logo--sofico"
      role="img"
      aria-label="Sofico"
    >
      <rect width="260" height="70" rx="14" fill="#ffffff" />
      <text
        x="6"
        y="50"
        fill="#221d5c"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize="56"
        fontWeight="900"
      >
        SoFico
      </text>
      <circle cx="156" cy="16" r="7" fill="#ff5b1f" />
    </svg>
  );
}
