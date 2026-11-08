// Logo d'Orgaly : trois points reliés en triangle (même dessin que
// public/favicon.svg et public/og-image.png). La couleur suit `color`
// (currentColor par défaut, donc la couleur du texte du conteneur).
// Règle (8 nov. 2026) : le logo se présente toujours en triangle BLANC sur
// un carré BLEU arrondi (menu, page d'accueil, favicon, icônes, réseaux).
// Seule exception : la page de pilotage noir et or, réservée à Cédric.
export default function BrandMark({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="9 8.5 30 30" aria-hidden="true">
      <line x1="24" y1="16" x2="15" y2="30" stroke={color} strokeWidth="2.5" />
      <line x1="24" y1="16" x2="33" y2="30" stroke={color} strokeWidth="2.5" />
      <line x1="15" y1="30" x2="33" y2="30" stroke={color} strokeWidth="2.5" />
      <circle cx="24" cy="16" r="4.4" fill={color} />
      <circle cx="15" cy="30" r="4.4" fill={color} />
      <circle cx="33" cy="30" r="4.4" fill={color} />
    </svg>
  );
}
