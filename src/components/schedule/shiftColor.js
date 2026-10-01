// Couleur d'un créneau de travail : celle de l'horaire type correspondant,
// fournie par le serveur (shift.color, voir enrichShifts) ; un créneau saisi
// à la main, qui ne correspond à aucun horaire type, reste neutre.
export const NEUTRAL_SHIFT_COLOR = '#5C6070';

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
export const shiftColorVar = (shift) => ({ '--shift-color': getShiftColor(shift) });
