// Outils d'affichage des réunions (voir MeetingTag)

// "14:00" → "14h", "13:30" → "13h30"
export const meetingTime = (t) => {
  const [h, m] = (t ?? '').slice(0, 5).split(':');
  return `${Number(h)}h${m === '00' ? '' : m}`;
};

export const meetingLabel = (m) => `${m.title} ${meetingTime(m.start_time)}–${meetingTime(m.end_time)}`;

const toMin = (t) => {
  const [h, m] = String(t).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};
const merge = (intervals) => {
  const out = [];
  for (const [s, e] of [...intervals].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
};
const subtract = (base, cut) => base.flatMap(([s, e]) => cut.reduce(
  (pieces, [cs, ce]) => pieces.flatMap(([ps, pe]) => (ce <= ps || cs >= pe
    ? [[ps, pe]]
    : [[ps, cs], [ce, pe]].filter(([a, b]) => b > a))),
  [[s, e]],
));

// Minutes de réunion d'un employé hors de son temps travaillé ce jour-là
// (créneau de travail moins ses pauses) : ce qui s'ajoute à ses heures
// quand l'entreprise compte les réunions comme travail. Même calcul que
// le serveur (backend-propre/src/services/meetingHours.service.js).
export const meetingExtraMinutes = (meetings, shift, userId, dateStr) => {
  const mine = meetingsOn(meetings, dateStr, userId).map((m) => [toMin(m.start_time), toMin(m.end_time)]);
  if (mine.length === 0) return 0;
  const worked = shift && (shift.type || 'travail') === 'travail'
    ? subtract([[toMin(shift.start_time), toMin(shift.end_time)]], (shift.breaks ?? []).map((b) => [toMin(b.start_time), toMin(b.end_time)]))
    : [];
  return subtract(merge(mine), worked).reduce((sum, [s, e]) => sum + (e - s), 0);
};

// Réunions d'un jour, éventuellement limitées à un participant
export const meetingsOn = (meetings, dateStr, userId = null) => (meetings ?? [])
  .filter((m) => m.date?.slice(0, 10) === dateStr
    && (!userId || m.participants?.some((p) => p.id === userId)))
  .sort((a, b) => a.start_time.localeCompare(b.start_time));
