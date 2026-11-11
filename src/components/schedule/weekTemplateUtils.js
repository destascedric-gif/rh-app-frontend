// Semaines types : calculs communs aux fenêtres du planning et à la page
// Paramètres. Mêmes règles que le serveur (weekTemplates.controller.js),
// pour que l'aperçu annonce exactement ce qui sera fait :
// - congés et absences jamais enregistrés ni écrasés ;
// - salarié parti (désactivé) ignoré ;
// - « empty » : seulement les cases vides ; « replace » : remplace les
//   créneaux et repos déjà posés.

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const WEEKDAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const PROTECTED = ['conge', 'absence'];
const TYPE_LABELS = { conge: 'Congé', absence: 'Absence', repos: 'Repos', absent: 'Absent' };

// 'AAAA-MM-JJ' (local) ± n jours
export const addDaysISO = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// "09:30:00" → "9h30", "19:00" → "19h"
export const shortTime = (t) => {
  const [h, m] = (t ?? '').slice(0, 5).split(':');
  return `${Number(h)}h${m === '00' ? '' : m}`;
};

export const isActive = (e) => e.is_active !== false;

// Contenu d'une semaine déjà chargée (créneaux de l'écran), même forme que
// les semaines types enregistrées par le serveur
export const slotsFromShifts = (shifts, weekStart, activeIds) => {
  const end = addDaysISO(weekStart, 6);
  return shifts
    .filter((s) => {
      const date = s.date?.slice(0, 10);
      const type = s.type || 'travail';
      return date >= weekStart && date <= end && activeIds.has(s.user_id) && (type === 'travail' || type === 'repos');
    })
    .map((s) => {
      const date = s.date.slice(0, 10);
      let weekday = 0;
      while (addDaysISO(weekStart, weekday) !== date) weekday += 1;
      const type = s.type || 'travail';
      return {
        userId: s.user_id,
        weekday,
        type,
        startTime: s.start_time?.slice(0, 5),
        endTime: s.end_time?.slice(0, 5),
        breaks: type === 'travail' ? (s.breaks ?? []) : [],
      };
    });
};

// Résumé d'une semaine type : nombre de salariés, de créneaux, de repos
export const summarize = (slots = []) => ({
  people: new Set(slots.map((s) => s.userId)).size,
  work: slots.filter((s) => s.type === 'travail').length,
  rest: slots.filter((s) => s.type === 'repos').length,
});

// "26 créneaux et 9 repos", "1 créneau", "3 repos"
export const countText = (work, rest) => {
  const parts = [];
  if (work) parts.push(`${work} créneau${work > 1 ? 'x' : ''}`);
  if (rest) parts.push(`${rest} repos`);
  return parts.join(' et ') || 'rien';
};

// Ce que donnerait l'application d'une semaine type sur la semaine weekStart.
// cells : clé `${userId}|${weekday}` → { slot, status, existing } ;
// status : 'added' | 'replaced' | 'kept' | 'protected' | 'ignored'
export const planApply = (slots, shifts, weekStart, mode, activeIds) => {
  const existing = new Map(shifts.map((s) => [`${s.user_id}|${s.date?.slice(0, 10)}`, s]));
  const cells = new Map();
  const counts = { added: 0, replaced: 0, kept: 0, protected: 0, ignored: 0, work: 0, rest: 0 };
  const keptList = [];
  const protectedList = [];
  for (const slot of slots) {
    if (!activeIds.has(slot.userId)) { counts.ignored += 1; continue; }
    const current = existing.get(`${slot.userId}|${addDaysISO(weekStart, slot.weekday)}`);
    const type = current ? (current.type || 'travail') : null;
    let status;
    if (current && PROTECTED.includes(type)) status = 'protected';
    else if (current && mode === 'empty') status = 'kept';
    else status = current ? 'replaced' : 'added';
    counts[status] += 1;
    if (status === 'added' || status === 'replaced') counts[slot.type === 'repos' ? 'rest' : 'work'] += 1;
    if (status === 'kept') keptList.push({ slot, current });
    if (status === 'protected') protectedList.push({ slot, current });
    cells.set(`${slot.userId}|${slot.weekday}`, { slot, status, existing: current });
  }
  return { cells, counts, keptList, protectedList };
};

// Libellé court d'un créneau existant : « 10h–19h », « Repos », « Congé »
export const shiftShort = (s) => ((s.type || 'travail') === 'travail'
  ? `${shortTime(s.start_time)}–${shortTime(s.end_time)}`
  : TYPE_LABELS[s.type] ?? s.type);

// « Thomas, mardi »
export const whoWhen = (employees, userId, weekday) => {
  const e = employees.find((x) => x.id === userId);
  return `${e ? e.first_name : 'Un salarié'}, ${WEEKDAY_NAMES[weekday]}`;
};

// Couleur d'un créneau de travail : celle de l'horaire type aux mêmes heures
// (même règle que le serveur), sinon null (créneau saisi à la main)
export const colorOfSlot = (slot, shiftTemplates = []) => {
  if (slot.type !== 'travail') return null;
  const t = shiftTemplates.find((x) => x.start_time?.slice(0, 5) === slot.startTime && x.end_time?.slice(0, 5) === slot.endTime);
  return t?.color ?? null;
};

// Petit histogramme d'une semaine type : nombre de personnes au travail par jour
export const dayLoads = (slots = []) => {
  const loads = Array(7).fill(0);
  slots.forEach((s) => { if (s.type === 'travail') loads[s.weekday] += 1; });
  return loads;
};
