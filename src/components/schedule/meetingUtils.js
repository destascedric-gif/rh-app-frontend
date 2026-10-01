// Outils d'affichage des réunions (voir MeetingTag)

// "14:00" → "14h", "13:30" → "13h30"
export const meetingTime = (t) => {
  const [h, m] = (t ?? '').slice(0, 5).split(':');
  return `${Number(h)}h${m === '00' ? '' : m}`;
};

export const meetingLabel = (m) => `${m.title} ${meetingTime(m.start_time)}–${meetingTime(m.end_time)}`;

// Réunions d'un jour, éventuellement limitées à un participant
export const meetingsOn = (meetings, dateStr, userId = null) => (meetings ?? [])
  .filter((m) => m.date?.slice(0, 10) === dateStr
    && (!userId || m.participants?.some((p) => p.id === userId)))
  .sort((a, b) => a.start_time.localeCompare(b.start_time));
