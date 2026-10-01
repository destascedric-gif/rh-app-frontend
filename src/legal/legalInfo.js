// Identité de l'éditeur et paramètres repris dans toutes les pages légales.
// Un champ à null s'affiche en surbrillance "[à compléter]" : ne pas mettre
// en ligne tant qu'il en reste (mentions légales obligatoires, LCEN art. 1-1).

export const EDITOR = {
  // "EI" obligatoire à côté du nom d'un entrepreneur individuel (loi du 14/02/2022)
  name:        'Cédric Destas EI',
  status:      'Entrepreneur individuel (micro-entreprise)',
  siren:       null, // ex. '123 456 789' — attribué à l'immatriculation (INPI)
  address:     null, // adresse professionnelle ou de domiciliation
  email:       'contact@myorgaly.fr', // redirection OVH vers la boîte de l'éditeur
  publisher:   'Cédric Destas', // directeur de la publication
  // Mention obligatoire sur les factures tant que la franchise en base s'applique
  vatMention:  'TVA non applicable, art. 293 B du CGI',
};

export const SITE_URL = 'https://myorgaly.fr';

// Hébergeurs (adresses relevées sur leurs propres mentions légales : à revérifier
// au moment de la mise en ligne).
export const HOSTS = [
  {
    name:    'Vercel Inc.',
    role:    "Hébergement de l'interface web",
    address: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
    site:    'https://vercel.com',
  },
  {
    name:    'Railway Corporation',
    role:    "Hébergement de l'API et de la base de données",
    address: '548 Market St PMB 68956, San Francisco, CA 94104, États-Unis',
    site:    'https://railway.com',
  },
];

// Sous-traitants ultérieurs (art. 28 RGPD) ayant accès aux données RH des
// clients. Stripe n'y figure pas : il ne voit que les données de facturation
// de l'entreprise cliente, pour lesquelles Orgaly est responsable de traitement.
export const SUBPROCESSORS = [
  {
    name:     'Railway Corporation',
    purpose:  'Hébergement de l\'API et de la base de données',
    location: null, // région du projet Railway à vérifier (dashboard → Settings → Region)
  },
  {
    name:     'Vercel Inc.',
    purpose:  'Hébergement de l\'interface web (aucune donnée RH n\'y est stockée)',
    location: 'États-Unis / réseau mondial',
  },
  {
    name:     'Sendinblue SAS (Brevo)',
    purpose:  'Envoi des e-mails transactionnels (invitations des employés)',
    location: 'France (Union européenne)',
  },
  {
    name:     'Functional Software Inc. (Sentry)',
    purpose:  'Suivi des erreurs techniques, sans envoi volontaire de données RH',
    location: 'Allemagne (Union européenne)',
  },
];

// Pages légales publiques (routes déclarées dans App.jsx)
export const LEGAL_PAGES = [
  { path: '/mentions-legales', label: 'Mentions légales' },
  { path: '/cgu',              label: 'CGU' },
  { path: '/cgv',              label: 'CGV' },
  { path: '/confidentialite',  label: 'Confidentialité' },
  { path: '/dpa',              label: 'Sous-traitance (DPA)' },
];

// Offre commerciale (doit rester alignée sur le backend, billing.service.js)
export const PRICING = {
  freeEmployeeLimit: 5,
  pricePerEmployee:  '3,90 €',
};

// Versions en vigueur (identiques au backend, src/config/legal.js)
export const CGU_VERSION = '2026-10-01';
export const CGV_VERSION = '2026-10-01';
export const LEGAL_UPDATED_AT = '1er octobre 2026';
