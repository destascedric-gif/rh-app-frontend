import { useNavigate } from 'react-router-dom';
import { NEUTRAL_SHIFT_COLOR } from './shiftColor';

const formatTime = (t) => t?.slice(0, 5) ?? '';

// Pseudo-modèle "Repos" : toujours proposé, même sans horaire type créé,
// pour poser un jour non travaillé d'un simple glisser-déposer.
const REST_DAY = { kind: 'repos', name: 'Repos' };

const startDrag = (e, payload) => {
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('application/json', JSON.stringify(payload));
};

export default function TemplatePalette({ templates }) {
  const navigate = useNavigate();

  const restChip = (
    <div className="template-chip template-chip--rest" draggable onDragStart={(e) => startDrag(e, REST_DAY)}>
      <strong>Repos</strong>
      <span>Jour non travaillé</span>
    </div>
  );

  if (templates.length === 0) {
    return (
      <div className="template-palette template-palette--empty">
        <span className="template-palette-label">Glissez sur une case :</span>
        {restChip}
        <span>Aucun horaire type pour l'instant.</span>
        <button type="button" className="btn-ghost btn-sm" onClick={() => navigate('/parametres')}>
          En créer un
        </button>
      </div>
    );
  }

  return (
    <div className="template-palette">
      <span className="template-palette-label">Glissez un horaire sur une case :</span>
      {templates.map((t) => (
        <div key={t.id} className="template-chip template-chip--colored" style={{ '--shift-color': t.color || NEUTRAL_SHIFT_COLOR }} draggable onDragStart={(e) => startDrag(e, t)}>
          <strong>{t.name}</strong>
          <span>{formatTime(t.start_time)} → {formatTime(t.end_time)}</span>
        </div>
      ))}
      {restChip}
    </div>
  );
}
