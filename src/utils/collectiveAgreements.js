// Conventions collectives les plus courantes chez les petits commerces
// visés par Orgaly. idcc = identifiant officiel à 4 chiffres, imprimé sur
// le bulletin de paie avec l'intitulé. Toute autre convention peut être
// saisie à la main (« Autre convention »).
export const COMMON_AGREEMENTS = [
  { idcc: '1996', name: 'Pharmacie d\'officine' },
  { idcc: '1979', name: 'Hôtels, cafés, restaurants (HCR)' },
  { idcc: '1501', name: 'Restauration rapide' },
  { idcc: '0843', name: 'Boulangerie-pâtisserie (entreprises artisanales)' },
  { idcc: '0992', name: 'Boucherie, boucherie-charcuterie' },
  { idcc: '1505', name: 'Commerce de détail alimentaire spécialisé (fruits et légumes, épicerie)' },
  { idcc: '2216', name: 'Commerce de détail et de gros à prédominance alimentaire' },
  { idcc: '1517', name: 'Commerces de détail non alimentaires' },
  { idcc: '1483', name: 'Commerce de détail de l\'habillement et des articles textiles' },
  { idcc: '1431', name: 'Optique-lunetterie de détail' },
  { idcc: '2596', name: 'Coiffure et professions connexes' },
  { idcc: '1978', name: 'Fleuristes, vente et services des animaux familiers' },
  { idcc: '1090', name: 'Services de l\'automobile' },
];

// IDCC réservé (déclarations sociales) : aucune convention collective
export const NO_AGREEMENT_IDCC = '9999';

// Valeur du menu déroulant correspondant aux réglages enregistrés
export const agreementChoice = (idcc) => {
  if (!idcc) return '';
  if (idcc === NO_AGREEMENT_IDCC || COMMON_AGREEMENTS.some((a) => a.idcc === idcc)) return idcc;
  return 'other';
};

// Texte court pour l'aperçu des Paramètres
export const agreementSummary = (idcc, name) => {
  if (!idcc) return 'Convention collective non renseignée';
  if (idcc === NO_AGREEMENT_IDCC) return 'Aucune convention collective';
  return name ? `${name} (IDCC ${idcc})` : `Convention IDCC ${idcc}`;
};
