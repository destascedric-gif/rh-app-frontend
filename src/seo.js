// Référencement (Google, Bing, aperçus de liens) des pages publiques.
// Ces pages sont pré-rendues en HTML à la construction du site
// (scripts/prerender.mjs) : les moteurs de recherche lisent leur texte dès
// le premier passage, sans attendre que le JavaScript s'exécute.
import { EDITOR } from './legal/legalInfo';

// Adresse officielle du site (myorgaly.fr redirige vers www)
export const SITE_URL = 'https://www.myorgaly.fr';

export const DEFAULT_TITLE = 'Orgaly — Planning, congés et pointage pour petites équipes';
export const DEFAULT_DESCRIPTION =
  "Orgaly simplifie la gestion d'équipe des petits commerces : planning, congés, pointage et "
  + 'calcul des heures au même endroit. Gratuit jusqu\'à 3 salariés, 3 mois d\'essai offerts, sans carte bancaire.';

// Pages légales affichées dans Google seulement une fois l'identité de
// l'éditeur complète (sinon elles montreraient « [à compléter] »).
export const LEGAL_INFO_COMPLETE = Boolean(EDITOR.siren && EDITOR.address);

export const PUBLIC_PAGES = [
  { path: '/', title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, index: true, priority: '1.0' },
  { path: '/tarifs', title: 'Tarifs — Orgaly', description: "Tarifs d'Orgaly : gratuit jusqu'à 3 salariés, puis 3,90 € HT par salarié en plus et par mois, plafonné à 79 € HT. 3 mois d'essai, sans carte bancaire.", index: true, priority: '0.8' },
  { path: '/contact', title: 'Contact — Orgaly', description: "Une question, une démonstration ou l'option IA ? Écrivez à l'équipe d'Orgaly, nous répondons par e-mail.", index: true, priority: '0.5' },
  { path: '/mentions-legales', title: 'Mentions légales — Orgaly', description: "Mentions légales du site Orgaly : éditeur, hébergeurs et contact.", legal: true },
  { path: '/cgu', title: "Conditions générales d'utilisation — Orgaly", description: "Conditions générales d'utilisation du logiciel de gestion d'équipe Orgaly.", legal: true },
  { path: '/cgv', title: 'Conditions générales de vente — Orgaly', description: "Conditions générales de vente des abonnements Orgaly : offre gratuite et offre Pro.", legal: true },
  { path: '/confidentialite', title: 'Politique de confidentialité — Orgaly', description: "Comment Orgaly protège les données personnelles de ses utilisateurs (RGPD).", legal: true },
  { path: '/dpa', title: 'Accord de sous-traitance des données — Orgaly', description: "Accord de sous-traitance des données personnelles (article 28 du RGPD) entre Orgaly et ses clients.", legal: true },
].map((p) => ({ ...p, index: p.index ?? (p.legal ? LEGAL_INFO_COMPLETE : false) }));
