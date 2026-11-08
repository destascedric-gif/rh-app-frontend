// Couleur principale d'Orgaly (boutons, liens, accents). Une seule valeur
// partout depuis le 8 nov. 2026 : même bleu que le site public et la carte
// de visite. Doit rester égale à --primary dans global.css.
export const DEFAULT_PRIMARY_COLOR = '#3457D5';

// Ancienne couleur par défaut, encore enregistrée en base pour les
// entreprises qui ne l'ont jamais changée (valeur par défaut de la colonne
// company.primary_color) : on la traite comme « couleur d'origine ».
const LEGACY_DEFAULT_PRIMARY_COLOR = '#1C4ED8';

export const normalizePrimaryColor = (color) =>
  !color || color.toUpperCase() === LEGACY_DEFAULT_PRIMARY_COLOR ? DEFAULT_PRIMARY_COLOR : color;
