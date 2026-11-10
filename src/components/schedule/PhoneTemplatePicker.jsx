import { useNavigate } from 'react-router-dom';
import { NEUTRAL_SHIFT_COLOR } from './shiftColor';
import { REST_DAY } from './TemplatePalette';

const formatTime = (t) => t?.slice(0, 5) ?? '';

// Horaires types sur téléphone (gérant). Le glisser-déposer de l'ordinateur
// ne marche pas au doigt, et le calendrier du mois n'a pas de ligne par
// employé : on touche un horaire type (il reste choisi, comme un pinceau),
// puis un jour, puis les employés concernés dans le détail du jour.
export const sameTemplate = (a, b) => Boolean(a && b)
  && (a.kind === 'repos' ? b.kind === 'repos' : a.id === b.id);

export const templateTimes = (t) => (t.kind === 'repos'
  ? 'Jour non travaillé'
  : `${formatTime(t.start_time)} → ${formatTime(t.end_time)}`);

export default function PhoneTemplatePicker({ templates, armed, onArm }) {
  const navigate = useNavigate();
  const items = [...templates, REST_DAY];

  return (
    <div className="ptpl">
      <div className="ptpl-label">
        {armed
          ? <>Touchez un jour, puis les employés concernés. <button type="button" className="ptpl-done" onClick={() => onArm(null)}>Terminé</button></>
          : 'Placer un horaire type : touchez-en un.'}
      </div>
      <div className="ptpl-chips">
        {items.map((t) => {
          const on = sameTemplate(armed, t);
          const rest = t.kind === 'repos';
          return (
            <button
              key={rest ? 'repos' : t.id}
              type="button"
              className={`template-chip ${rest ? 'template-chip--rest' : 'template-chip--colored'}${on ? ' template-chip--armed' : ''}`}
              style={rest ? undefined : { '--shift-color': t.color || NEUTRAL_SHIFT_COLOR }}
              aria-pressed={on}
              onClick={() => onArm(on ? null : t)}
            >
              <strong>{t.name}</strong>
              <span>{templateTimes(t)}</span>
            </button>
          );
        })}
        {templates.length === 0 && (
          <button type="button" className="btn-ghost btn-sm ptpl-create" onClick={() => navigate('/parametres')}>
            Créer un horaire type
          </button>
        )}
      </div>
    </div>
  );
}
