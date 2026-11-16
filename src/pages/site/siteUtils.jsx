/* eslint-disable react-refresh/only-export-components -- petites icônes et calculs partagés par les pages du site */
import { PRICING } from '../../legal/legalInfo';

// ── Calcul du prix (mêmes règles que le serveur, billing.service.js) ──
// 3 salariés offerts, 3,90 € HT par salarié en plus, plafond 79 € HT par
// mois ; à l'année, 10 mois payés pour 12. Le gérant n'est pas compté.
export function sitePrice(employees) {
  const extra = Math.max(0, employees - PRICING.freeEmployees);
  const monthly = Math.min(extra * PRICING.pricePerEmployeeCents, PRICING.monthlyCapCents);
  return { extra, monthly, yearly: monthly * PRICING.annualMonthsPaid, capped: monthly === PRICING.monthlyCapCents };
}

// 1170 → « 11,70 € » ; 7900 → « 79 € »
export function euros(cents) {
  const v = cents / 100;
  const txt = Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',');
  return `${txt.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
}

// ── Petites icônes (trait fin, couleur du texte) ──
const Svg = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const Icon = {
  calendar: (p) => <Svg {...p}><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></Svg>,
  sun: (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>,
  clock: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>,
  croissant: (p) => <Svg {...p}><path d="M4 15c2-6 6-9 8-9s6 3 8 9" /><path d="M8 17.5c1.2-3.5 2.6-6 4-6s2.8 2.5 4 6" /><path d="M4 15l2.5 2.5M20 15l-2.5 2.5" /></Svg>,
  utensils: (p) => <Svg {...p}><path d="M7 2v8a2 2 0 0 0 2 2v10M11 2v8a2 2 0 0 1-2 2M7 2v6M17 22V2c-2 1-3 3.5-3 7v4h3" /></Svg>,
  scissors: (p) => <Svg {...p}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12" /></Svg>,
  bag: (p) => <Svg {...p}><path d="M5 7h14l-1 14H6L5 7z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" /></Svg>,
  sparkle: (p) => <Svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" /></Svg>,
  store: (p) => <Svg {...p}><path d="M4 10v10h16V10" /><path d="M2.5 6.5L4.5 3h15l2 3.5c0 1.9-1.6 3.5-3.5 3.5S14.5 8.4 14.5 6.5c0 1.9-1.6 3.5-3.5 3.5S7.5 8.4 7.5 6.5C7.5 8.4 6 10 4 10S.5 8.4 2.5 6.5z" /><path d="M10 20v-5h4v5" /></Svg>,
  mail: (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5L12 13l8.5-6.5" /></Svg>,
  pin: (p) => <Svg {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Svg>,
  instagram: (p) => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></Svg>,
  soundOff: (p) => <Svg {...p}><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" /></Svg>,
  soundOn: (p) => <Svg {...p}><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></Svg>,
};
