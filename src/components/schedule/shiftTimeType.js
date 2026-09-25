// Détermine si un créneau de travail est une "ouverture" ou une
// "fermeture", pour colorer l'affichage des heures dans le planning selon
// ce repère plutôt que par employé (l'employé reste identifiable via le
// point de couleur dans la ligne).
//
// Priorité au modèle de créneau exact (même heure de début et de fin
// qu'un modèle nommé "Ouverture"/"Fermeture") ; à défaut, on se base sur
// l'heure de fin — une fermeture couvre la fin de journée la plus tardive.
const toMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

const FALLBACK_THRESHOLD_MIN = 18 * 60; // 18h00

export const getShiftTimeType = (shift, templates = []) => {
  const start = shift.start_time?.slice(0, 5);
  const end   = shift.end_time?.slice(0, 5);

  const match = templates.find(
    (t) => t.start_time?.slice(0, 5) === start && t.end_time?.slice(0, 5) === end
  );
  if (match) {
    const name = match.name.toLowerCase();
    if (name.includes('ouver')) return 'ouverture';
    if (name.includes('ferm'))  return 'fermeture';
  }

  const endMin = toMinutes(end);
  return endMin != null && endMin >= FALLBACK_THRESHOLD_MIN ? 'fermeture' : 'ouverture';
};
