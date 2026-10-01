import { meetingLabel, meetingTime } from './meetingUtils';

// Étiquette d'une réunion, affichée sous le créneau des participants.
// Le gérant peut cliquer dessus pour la modifier.

export const MeetingIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <circle cx="17" cy="9" r="2.3" />
    <path d="M16 14.2c2.5.3 4.3 2.1 4.5 4.8" />
  </svg>
);

export default function MeetingTag({ meeting, onClick }) {
  const names = meeting.participants?.map((p) => p.first_name).join(', ');
  const tooltip = `${meetingLabel(meeting)}${names ? ` · ${names}` : ''}${meeting.note ? ` · ${meeting.note}` : ''}`;
  const content = (
    <>
      <MeetingIcon />
      <span className="meeting-tag-title">{meeting.title}</span>
      <span className="meeting-tag-time">{meetingTime(meeting.start_time)}–{meetingTime(meeting.end_time)}</span>
    </>
  );
  return onClick ? (
    <button
      type="button"
      className="meeting-tag meeting-tag--button"
      onClick={(e) => { e.stopPropagation(); onClick(meeting); }}
      title={tooltip}
    >
      {content}
    </button>
  ) : (
    <span className="meeting-tag" title={tooltip}>{content}</span>
  );
}
