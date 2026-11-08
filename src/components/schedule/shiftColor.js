// Couleur d'un créneau de travail : celle de l'horaire type correspondant,
// fournie par le serveur (shift.color, voir enrichShifts) ; un créneau saisi
// à la main, qui ne correspond à aucun horaire type, est blanc avec un
// contour foncé (8 nov. 2026 ; avant : gris, trop proche des congés rayés).
export const NEUTRAL_SHIFT_COLOR = '#2B3245'; // = --shift-free-ink (global.css)

// Couleurs proposées pour les horaires types (mêmes valeurs que le serveur,
// services/shiftColors.js, qui en attribue une libre à chaque création)
export const SHIFT_PALETTE = [
  { value: '#3457D5', label: 'Bleu' },
  { value: '#B9791E', label: 'Ambre' },
  { value: '#1F7A5A', label: 'Vert' },
  { value: '#8A3FB0', label: 'Violet' },
  { value: '#C2416B', label: 'Framboise' },
  { value: '#0E7490', label: 'Bleu canard' },
  { value: '#C2581A', label: 'Orange' },
  { value: '#4D5B7C', label: 'Ardoise' },
];

export const getShiftColor = (shift) => shift?.color || NEUTRAL_SHIFT_COLOR;

// Style à poser sur l'élément : le CSS dérive fond clair, bordure et texte
// de cette seule variable (voir « Couleur des créneaux » dans global.css).
// Sans horaire type : fond blanc, texte et contour foncés (--shift-ring est
// lu par .shift-colored et .pcal-chip--work).
const FREE_SHIFT_STYLE = {
  '--shift-color': 'var(--shift-free-ink)',
  '--shift-color-bg': '#fff',
  '--shift-color-text': 'var(--shift-free-ink)',
  '--shift-ring': 'var(--shift-free-ink)',
  '--shift-solid-bg': '#fff',
  '--shift-solid-text': 'var(--shift-free-ink)',
};
export const shiftColorVar = (shift) => (shift?.color ? { '--shift-color': shift.color } : FREE_SHIFT_STYLE);
