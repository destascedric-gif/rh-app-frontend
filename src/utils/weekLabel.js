// Libellé court de la semaine affichée dans le planning, lisible sur
// téléphone : « 2 – 8 nov. 2026 », « 27 oct. – 2 nov. 2026 »,
// « 29 déc. 2025 – 4 janv. 2026 ».
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const weekLabel = (start, end) => {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const from = sameMonth
    ? `${start.getDate()}`
    : `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]}${sameYear ? '' : ` ${start.getFullYear()}`}`;
  return `${from} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
};
