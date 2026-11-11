import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createWeekTemplate, updateWeekTemplate } from '../../api/weekTemplates';
import Select from '../Select';
import { addDaysISO, slotsFromShifts, summarize, countText, isActive } from './weekTemplateUtils';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// Fenêtre « Enregistrer comme semaine type » (11 nov. 2026) : la semaine
// affichée devient une nouvelle semaine type, ou remplace une existante.
export default function SaveWeekTemplateModal({ weekStart, weekTemplates, employees, shifts, onSaved, onClose }) {
  const { token } = useAuth();
  const [choice, setChoice] = useState('new');
  const [name, setName] = useState(weekTemplates.length === 0 ? 'Semaine A' : '');
  const [replaceId, setReplaceId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activeIds = new Set(employees.filter(isActive).map((e) => e.id));
  const sum = summarize(slotsFromShifts(shifts, weekStart, activeIds));
  const empty = sum.work + sum.rest === 0;
  const a = new Date(`${weekStart}T12:00:00`);
  const b = new Date(`${addDaysISO(weekStart, 6)}T12:00:00`);
  const period = `Semaine du ${a.getDate()}${a.getMonth() === b.getMonth() ? '' : ` ${MONTHS[a.getMonth()]}`} au ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (choice === 'new' && !name.trim()) { setError('Donnez un nom à la semaine type.'); return; }
    if (choice === 'replace' && !replaceId) { setError('Choisissez la semaine type à remplacer.'); return; }
    setSaving(true);
    try {
      const saved = choice === 'new'
        ? await createWeekTemplate({ name: name.trim(), weekStart }, token)
        : await updateWeekTemplate(replaceId, { weekStart }, token);
      onSaved(saved, choice === 'replace');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <form className="modal wt-modal wt-modal--narrow" role="dialog" aria-modal="true" aria-labelledby="wt-save-title" onSubmit={submit}>
        <h3 id="wt-save-title">Enregistrer comme semaine type</h3>
        <p className="wt-sub">{period} · {sum.people} salarié{sum.people > 1 ? 's' : ''}</p>

        <label className={`wt-opt wt-opt--block${choice === 'new' ? ' wt-opt--on' : ''}`}>
          <input type="radio" name="wt-save" checked={choice === 'new'} onChange={() => setChoice('new')} />
          <span>
            <b>Créer une nouvelle semaine type</b>
            {choice === 'new' && (
              <span className="field wt-field">
                <span className="wt-field-label">Nom</span>
                <input
                  type="text"
                  value={name}
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Semaine A, Vacances scolaires…"
                  autoFocus
                />
              </span>
            )}
          </span>
        </label>

        {weekTemplates.length > 0 && (
          <label className={`wt-opt wt-opt--block${choice === 'replace' ? ' wt-opt--on' : ''}`}>
            <input type="radio" name="wt-save" checked={choice === 'replace'} onChange={() => setChoice('replace')} />
            <span>
              <b>Remplacer une semaine type existante</b>
              {choice === 'replace' && (
                <span className="field wt-field">
                  <Select value={replaceId} onChange={(e) => setReplaceId(e.target.value)}>
                    <option value="">Choisir…</option>
                    {weekTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </span>
              )}
            </span>
          </label>
        )}

        <div className="wt-sum">
          {empty ? (
            <p><b>Cette semaine est vide</b> : posez d'abord des créneaux ou des repos.</p>
          ) : (
            <p>Seront enregistrés : <b>{countText(sum.work, sum.rest)}</b>, du lundi au dimanche.</p>
          )}
          <p>Les congés et absences ne sont pas enregistrés : ces cases resteront vides dans la semaine type.</p>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={saving || empty}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
