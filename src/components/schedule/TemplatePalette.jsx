import { useNavigate } from 'react-router-dom';

const formatTime = (t) => t?.slice(0, 5) ?? '';

export default function TemplatePalette({ templates }) {
  const navigate = useNavigate();

  if (templates.length === 0) {
    return (
      <div className="template-palette template-palette--empty">
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
        <div
          key={t.id}
          className="template-chip"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('application/json', JSON.stringify(t));
          }}
        >
          <strong>{t.name}</strong>
          <span>{formatTime(t.start_time)} → {formatTime(t.end_time)}</span>
        </div>
      ))}
    </div>
  );
}
