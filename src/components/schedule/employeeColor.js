// Palette dédiée à l'identification visuelle des employés dans le planning.
// Couleurs franches et bien saturées (façon Google Agenda) pour que chaque
// employé se distingue clairement d'un coup d'œil, même sur un planning
// chargé — le type de créneau se lit de toute façon via le texte en
// italique, la couleur n'a donc plus qu'un seul rôle : l'identité.
const EMPLOYEE_COLORS = ['#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED', '#DB2777'];

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
export const getEmployeeColorLight = (userId, alpha = 0.16) =>
  hexToRgba(getEmployeeColor(userId), alpha);
