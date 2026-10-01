import ShiftCard from './ShiftCard';
import { toISO } from './WeekView';
import MeetingTag from './MeetingTag';
import { meetingsOn } from './meetingUtils';

// Semaine de l'employé sur téléphone : une carte par jour, avec le même
// niveau de détail que la grille sur ordinateur (horaires, pauses, heures
// nettes, note), lisible sans défilement horizontal.

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function PhoneWeekList({ days, shifts, meetings = [] }) {
  const todayStr = toISO(new Date());

  return (
    <ul className="pweek" aria-label="Planning de la semaine">
      {days.map((day, i) => {
        const dateStr = toISO(day);
        const shift = shifts.find((s) => s.date?.slice(0, 10) === dateStr);
        const dayMeetings = meetingsOn(meetings, dateStr);
        return (
          <li key={dateStr} className={`pweek-day${dateStr === todayStr ? ' pweek-day--today' : ''}`}>
            <div className="pweek-date">
              <span className="pweek-name">{DAY_NAMES[i]}</span>
              <span className="pweek-num">{day.getDate()}</span>
            </div>
            <div className="pweek-shift">
              {shift
                ? <ShiftCard shift={shift} isAdmin={false} />
                : dayMeetings.length === 0 && <span className="pweek-empty">Pas de créneau</span>}
              {dayMeetings.map((m) => <MeetingTag key={m.id} meeting={m} />)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
