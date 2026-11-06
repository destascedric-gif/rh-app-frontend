// Outils communs aux calendriers du mois (téléphone et ordinateur)

export const DETAIL_TYPE_LABELS = { conge: 'Congé', repos: 'Repos', absence: 'Absence', absent: 'Absent' };
export const DETAIL_DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const DETAIL_MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// Créneau de travail (couleur de son horaire type) ou hors travail
export const chipKind = (shift) => ((shift.type || 'travail') === 'travail' ? 'work' : 'off');

// Ordre d'affichage des créneaux d'un jour : soi-même d'abord (planning de
// l'équipe), puis les créneaux travaillés par heure de début, puis repos /
// congés.
export const sortDayShifts = (list, isMe = () => false) => [...list].sort((a, b) => {
  const offA = chipKind(a) === 'off' ? 1 : 0;
  const offB = chipKind(b) === 'off' ? 1 : 0;
  return (isMe(b) ? 1 : 0) - (isMe(a) ? 1 : 0)
    || offA - offB
    || (a.start_time ?? '').localeCompare(b.start_time ?? '');
});

// Jour choisi par défaut : aujourd'hui s'il est dans le mois affiché, sinon le 1er
export const defaultSelectedDay = (year, month, toISO) => {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === month
    ? toISO(today)
    : toISO(new Date(year, month, 1));
};
