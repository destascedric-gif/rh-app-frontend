import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminSchedule } from '../../api/schedule';
import { applyWeekTemplate } from '../../api/weekTemplates';
import WeekTemplatePreview from './WeekTemplatePreview';
import {
  addDaysISO, slotsFromShifts, planApply, countText, shiftShort, whoWhen, isActive,
} from './weekTemplateUtils';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const weekText = (weekStart) => {
  const a = new Date(`${weekStart}T12:00:00`);
  const b = new Date(`${addDaysISO(weekStart, 6)}T12:00:00`);
  const sameMonth = a.getMonth() === b.getMonth();
  return `Semaine du lundi ${a.getDate()}${sameMonth ? '' : ` ${MONTHS[a.getMonth()]}`} au dimanche ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
};

// Liste « Thomas, mardi (Repos) ; Julie, jeudi (Congé) » (3 au plus)
const listText = (items, employees) => {
  const shown = items.slice(0, 3).map(({ slot, current }) => `${whoWhen(employees, slot.userId, slot.weekday)} (${shiftShort(current)})`);
  return shown.join(' ; ') + (items.length > 3 ? ` et ${items.length - 3} autre${items.length > 4 ? 's' : ''}` : '');
};

// Fenêtre « Appliquer une semaine type » (11 nov. 2026, maquette validée par
// Cédric) : choix de la source (semaine précédente ou une semaine type),
// aperçu, mode (cases vides par défaut / tout remplacer), résumé exact.
export default function ApplyWeekTemplateModal({
  weekStart, initialSource, weekTemplates, shiftTemplates, employees, shifts, onDone, onClose,
}) {
  const { token } = useAuth();
  // 'previous' ou l'id d'une semaine type
  const [source, setSource] = useState(initialSource);
  const [mode, setMode] = useState('empty');
  const [previousSlots, setPreviousSlots] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const active = employees.filter(isActive);
  const activeIds = new Set(active.map((e) => e.id));

  // Semaine précédente : chargée seulement si on la choisit
  useEffect(() => {
    if (source !== 'previous' || previousSlots) return;
    const prev = addDaysISO(weekStart, -7);
    getAdminSchedule(prev, addDaysISO(prev, 6), null, token)
      .then((data) => setPreviousSlots(slotsFromShifts(data, prev, new Set(employees.filter(isActive).map((e) => e.id)))))
      .catch((err) => setError(err.message));
  }, [source, previousSlots, weekStart, token, employees]);

  const template = weekTemplates.find((t) => t.id === source);
  const slots = source === 'previous' ? previousSlots : template?.slots;
  const plan = slots ? planApply(slots, shifts, weekStart, mode, activeIds) : null;
  const sourceName = source === 'previous' ? 'La semaine précédente' : template?.name;
  const nothing = plan && plan.counts.added + plan.counts.replaced === 0;

  const apply = async () => {
    setSaving(true);
    setError('');
    try {
      const body = source === 'previous'
        ? { weekStart, mode, copyPrevious: true }
        : { weekStart, mode, templateId: source };
      const result = await applyWeekTemplate(body, token);
      onDone(result, sourceName);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="modal wt-modal" role="dialog" aria-modal="true" aria-labelledby="wt-apply-title">
        <h3 id="wt-apply-title">{source === 'previous' ? 'Copier la semaine précédente' : 'Appliquer une semaine type'}</h3>
        <p className="wt-sub">{weekText(weekStart)}</p>

        <div className="wt-pills" role="tablist">
          <button type="button" role="tab" aria-selected={source === 'previous'} className={`wt-pill${source === 'previous' ? ' wt-pill--on' : ''}`} onClick={() => setSource('previous')}>
            Semaine précédente
          </button>
          {weekTemplates.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={source === t.id} className={`wt-pill${source === t.id ? ' wt-pill--on' : ''}`} onClick={() => setSource(t.id)}>
              {t.name}
            </button>
          ))}
        </div>

        {!slots ? (
          <p className="wt-prev-empty">{error ? '' : 'Chargement…'}</p>
        ) : slots.length === 0 ? (
          <p className="wt-prev-empty">{source === 'previous' ? 'La semaine précédente est vide : rien à copier.' : 'Cette semaine type est vide.'}</p>
        ) : (
          <WeekTemplatePreview slots={slots} employees={active} shiftTemplates={shiftTemplates} weekStart={weekStart} plan={plan} />
        )}

        <div className="wt-opts" role="radiogroup" aria-label="Que faire des cases déjà remplies ?">
          <label className={`wt-opt${mode === 'empty' ? ' wt-opt--on' : ''}`}>
            <input type="radio" name="wt-mode" checked={mode === 'empty'} onChange={() => setMode('empty')} />
            <span><b>Remplir seulement les cases vides</b>Recommandé : ce qui est déjà posé dans la semaine ne bouge pas.</span>
          </label>
          <label className={`wt-opt${mode === 'replace' ? ' wt-opt--on' : ''}`}>
            <input type="radio" name="wt-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
            <span><b>Tout remplacer</b>Les créneaux et repos déjà posés sont remplacés par ceux de {source === 'previous' ? 'la semaine précédente' : 'la semaine type'}.</span>
          </label>
        </div>

        {plan && slots.length > 0 && (
          <div className="wt-sum">
            {nothing ? (
              <p><b>Rien à ajouter</b> : les cases concernées sont déjà remplies.</p>
            ) : (
              <p><span className="wt-ok">✓</span><b>{countText(plan.counts.work, plan.counts.rest)}</b> {plan.counts.work + plan.counts.rest > 1 ? 'seront posés' : 'sera posé'}{plan.counts.replaced > 0 ? `, dont ${plan.counts.replaced} en remplacement` : ''}.</p>
            )}
            {plan.keptList.length > 0 && (
              <p>• {plan.keptList.length === 1 ? '1 case déjà remplie est gardée' : `${plan.keptList.length} cases déjà remplies sont gardées`} : {listText(plan.keptList, employees)}.</p>
            )}
            {plan.protectedList.length > 0 ? (
              <p>• Congés et absences gardés : {listText(plan.protectedList, employees)}.</p>
            ) : (
              <p>• Les congés et absences ne sont jamais modifiés.</p>
            )}
            {plan.counts.ignored > 0 && (
              <p>• {plan.counts.ignored} case{plan.counts.ignored > 1 ? 's' : ''} d'un salarié parti {plan.counts.ignored > 1 ? 'sont ignorées' : 'est ignorée'}.</p>
            )}
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Annuler</button>
          <button type="button" className="btn-primary" onClick={apply} disabled={saving || !plan || nothing}>
            {saving ? 'Enregistrement…' : source === 'previous' ? 'Copier dans la semaine' : 'Appliquer à la semaine'}
          </button>
        </div>
      </div>
    </div>
  );
}
