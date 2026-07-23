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
