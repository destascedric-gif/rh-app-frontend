import { useNavigate } from 'react-router-dom';
import { NEUTRAL_SHIFT_COLOR } from './shiftColor';
import { startTouchTemplateDrag } from './touchTemplateDrag';

const formatTime = (t) => t?.slice(0, 5) ?? '';

// Pseudo-modèle "Repos" : toujours proposé, même sans horaire type créé,
// pour poser un jour non travaillé d'un simple glisser-déposer.
const REST_DAY = { kind: 'repos', name: 'Repos' };

// onTouchDrop(userId, date, modèle) : appelé quand on lâche un horaire sur
// une case (souris, doigt ou stylet) ; userId est vide sur un jour du mois.
// compact : version fine sur une ligne (vue Mois, où elle sert de légende).
// children : ajouté au bout de la rangée (bouton « Semaines types » en semaine).
export default function TemplatePalette({ templates, onTouchDrop, compact = false, children = null }) {
  const navigate = useNavigate();
  // Un seul système de glisser pour la souris, le doigt et le stylet
  // (touchTemplateDrag.js, 12 nov. 2026) : le glisser-déposer du navigateur
  // est coupé, il ne marchait pas partout.
  const dragProps = (payload) => ({
    draggable: false,
    onDragStart: (e) => e.preventDefault(),
    onPointerDown: (e) => startTouchTemplateDrag(e, payload, onTouchDrop),
  });

  const restChip = (
    <div className="template-chip template-chip--rest" {...dragProps(REST_DAY)}>
      <strong>Repos</strong>
      <span>Jour non travaillé</span>
    </div>
  );

  if (compact) {
    return (
      <div className="template-palette template-palette--compact">
        <span className="template-palette-label">Glissez sur un jour :</span>
        {templates.map((t) => (
          <div
            key={t.id}
            className="template-chip template-chip--colored template-chip--compact"
            style={{ '--shift-color': t.color || NEUTRAL_SHIFT_COLOR }}
            title={`${t.name} : ${formatTime(t.start_time)} → ${formatTime(t.end_time)}`}
            {...dragProps(t)}
          >
            <strong>{t.name}</strong>
            <span>{formatTime(t.start_time)}–{formatTime(t.end_time)}</span>
          </div>
        ))}
        <div className="template-chip template-chip--rest template-chip--compact" title="Repos : jour non travaillé" {...dragProps(REST_DAY)}>
          <strong>Repos</strong>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="template-palette template-palette--empty">
        <span className="template-palette-label">Glissez sur une case :</span>
        {restChip}
        <span>Aucun horaire type pour l'instant.</span>
        <button type="button" className="btn-ghost btn-sm" onClick={() => navigate('/parametres')}>
          En créer un
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className="template-palette">
      <span className="template-palette-label">Glissez un horaire sur une case :</span>
      {templates.map((t) => (
        <div key={t.id} className="template-chip template-chip--colored" style={{ '--shift-color': t.color || NEUTRAL_SHIFT_COLOR }} {...dragProps(t)}>
          <strong>{t.name}</strong>
          <span>{formatTime(t.start_time)} → {formatTime(t.end_time)}</span>
        </div>
      ))}
      {restChip}
      {children}
    </div>
  );
}
