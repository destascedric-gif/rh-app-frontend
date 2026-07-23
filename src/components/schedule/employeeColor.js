// Palette dédiée à l'identification visuelle des employés dans le planning —
// volontairement en dehors des teintes déjà utilisées pour le sens (bleu
// primary = travail, ambre = congé, rouge = absence, vert = succès), pour
// ne jamais laisser croire qu'une couleur d'employé signifie autre chose.
const EMPLOYEE_COLORS = ['#7C3AED', '#C026D3', '#DB2777', '#0891B2', '#0D9488', '#4D7C0F'];

// Choix déterministe : le même employé garde toujours la même couleur d'une
// vue à l'autre (semaine / mois) sans avoir besoin de la stocker en base.
export const getEmployeeColor = (userId) => {
  if (!userId) return EMPLOYEE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) % 997;
  return EMPLOYEE_COLORS[hash % EMPLOYEE_COLORS.length];
};

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Version très légère de la couleur d'un employé, utilisée comme fond des
// créneaux (le trait/bordure gardant la teinte pleine pour l'identité).
export const getEmployeeColorLight = (userId, alpha = 0.14) =>
  hexToRgba(getEmployeeColor(userId), alpha);
