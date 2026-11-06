// Outils partagés par les pages de pilotage (sans composant React)

export const PERIODS = [
  { days: 7, label: '7 jours', since: 'sur 7 jours' },
  { days: 30, label: '30 jours', since: 'sur 30 jours' },
  { days: 365, label: '12 mois', since: 'sur 12 mois' },
];

// Au-delà de ce nombre de jours sans activité, l'entreprise est à relancer
export const STALE_DAYS = 14;

// Prix de la formule Pro, par salarié actif et par mois (HT)
export const PRO_PRICE = 3.9;

export const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
export const fmtLongDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtEuro = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
export const daysAgo = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
export const isStale = (d) => !d || daysAgo(d) > STALE_DAYS;

export const activityLabel = (d) => {
  if (!d) return 'jamais';
  const n = daysAgo(d);
  return n <= 0 ? "aujourd'hui" : n === 1 ? 'hier' : `il y a ${n} j`;
};

export const fmtWhen = (d) => {
  const date = new Date(d);
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const today = new Date().toDateString() === date.toDateString();
  return today ? `auj. ${time}` : `${fmtDate(d)} ${time}`;
};

export const fmtUptime = (s) => {
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `${Math.round(s / 3600)} h`;
  return `${Math.round(s / 86400)} j`;
};

// Libellés de l'axe des inscriptions : jours, ou mois sur 12 mois
export const signupXLabel = (monthly) => (b) => (monthly
  ? new Date(`${b}T12:00:00`).toLocaleDateString('fr-FR', { month: 'short' })
  : fmtDate(`${b}T12:00:00`));

export const plural =(n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
