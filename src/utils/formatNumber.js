// Nombre à la française, une décimale au plus : 24 → « 24 », 7.5 → « 7,5 »,
// 37.75 → « 37,8 ». Remplace les .toFixed(1) qui affichaient « 24.0 h ».
export const frDecimal = (n) =>
  Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
