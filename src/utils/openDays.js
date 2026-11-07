// Jours d'ouverture de l'entreprise : 7 caractères du lundi au dimanche,
// '1' = ouvert, '0' = fermé (réglage Paramètres → Planning).
export const DEFAULT_OPEN_DAYS = '1111100';
export const OPEN_DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const mondayIndex = (date) => (date.getDay() + 6) % 7;

export const isClosedDay = (date, openDays) =>
  (openDays || DEFAULT_OPEN_DAYS)[mondayIndex(date)] === '0';
