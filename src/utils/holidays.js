// Jours fériés français (métropole), calculés pour n'importe quelle année.
// Clés au format "AAAA-MM-JJ" en heure locale, comme toISO() du planning.

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Dimanche de Pâques (algorithme de Meeus/Jones/Butcher)
const easter = (y) => {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
};

const cache = new Map();

const holidaysOf = (y) => {
  if (cache.has(y)) return cache.get(y);
  const e = easter(y);
  const after = (days) => iso(new Date(y, e.getMonth(), e.getDate() + days));
  const map = new Map([
    [`${y}-01-01`, "Jour de l'an"],
    [after(1), 'Lundi de Pâques'],
    [`${y}-05-01`, 'Fête du Travail'],
    [`${y}-05-08`, 'Victoire 1945'],
    [after(39), 'Ascension'],
    [after(50), 'Lundi de Pentecôte'],
    [`${y}-07-14`, 'Fête nationale'],
    [`${y}-08-15`, 'Assomption'],
    [`${y}-11-01`, 'Toussaint'],
    [`${y}-11-11`, 'Armistice'],
    [`${y}-12-25`, 'Noël'],
  ]);
  cache.set(y, map);
  return map;
};

// Nom du jour férié pour une date "AAAA-MM-JJ", sinon null
export const holidayName = (dateStr) =>
  dateStr ? holidaysOf(Number(dateStr.slice(0, 4))).get(dateStr) ?? null : null;
