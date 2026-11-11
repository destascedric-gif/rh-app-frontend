import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPlanningPeople } from '../../api/employees';
import { updateWeekTemplate, deleteWeekTemplate } from '../../api/weekTemplates';
import WeekTemplatePreview, { WeekLoadIcon } from './WeekTemplatePreview';
import { summarize, countText, isActive } from './weekTemplateUtils';

const dateText = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

// Paramètres → Semaines types (11 nov. 2026) : liste, aperçu, renommer,
// supprimer. On crée ou modifie une semaine type depuis le Planning
// (« Semaines types » → « Enregistrer cette semaine »).
export default function WeekTemplatesManager({ weekTemplates, shiftTemplates, onChange }) {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [renaming, setRenaming] = useState(null); // { id, name }
  const [error, setError] = useState('');

  useEffect(() => { getPlanningPeople(token).then(setEmployees).catch((err) => setError(err.message)); }, [token]);

  const rename = async (e) => {
    e.preventDefault();
    if (!renaming.name.trim()) { setError('Le nom est obligatoire.'); return; }
    setError('');
    try {
      const saved = await updateWeekTemplate(renaming.id, { name: renaming.name.trim() }, token);
      onChange(weekTemplates.map((t) => (t.id === saved.id ? saved : t)));
      setRenaming(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (t) => {
    if (!confirm(`Supprimer la semaine type « ${t.name} » ? Les plannings déjà remplis avec elle ne changent pas.`)) return;
    setError('');
    try {
      await deleteWeekTemplate(t.id, token);
      onChange(weekTemplates.filter((x) => x.id !== t.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="tab-toolbar">
        <p className="hint" style={{ margin: 0 }}>
          Des semaines complètes à recopier en un clic dans le planning (bouton « Semaines types » de la vue Semaine).
          Pour en créer une ou la modifier : préparez la semaine dans le Planning, puis « Semaines types » → « Enregistrer cette semaine ».
        </p>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {weekTemplates.length === 0 ? (
        <p className="wt-prev-empty">Aucune semaine type pour l'instant.</p>
      ) : (
        <ul className="wt-list">
          {weekTemplates.map((t) => {
            const sum = summarize(t.slots);
            return (
              <li key={t.id} className="wt-list-item">
                <div className="wt-list-row">
                  <WeekLoadIcon slots={t.slots} />
                  {renaming?.id === t.id ? (
                    <form className="wt-rename" onSubmit={rename}>
                      <input
                        type="text"
                        value={renaming.name}
                        maxLength={100}
                        onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                        autoFocus
                        aria-label="Nouveau nom"
                      />
                      <button type="submit" className="btn-primary btn-sm">OK</button>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => setRenaming(null)}>Annuler</button>
                    </form>
                  ) : (
                    <span className="wt-list-name">
                      <strong>{t.name}</strong>
                      <span>{sum.people} salarié{sum.people > 1 ? 's' : ''} · {countText(sum.work, sum.rest)} · enregistrée le {dateText(t.updated_at || t.created_at)}</span>
                    </span>
                  )}
                  {renaming?.id !== t.id && (
                    <span className="wt-list-actions">
                      <button type="button" className="btn-ghost btn-sm" onClick={() => setOpenId(openId === t.id ? null : t.id)} aria-expanded={openId === t.id}>
                        {openId === t.id ? 'Masquer' : 'Voir'}
                      </button>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => setRenaming({ id: t.id, name: t.name })}>Renommer</button>
                      <button type="button" className="btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(t)}>Supprimer</button>
                    </span>
                  )}
                </div>
                {openId === t.id && (
                  <WeekTemplatePreview slots={t.slots} employees={employees.filter(isActive)} shiftTemplates={shiftTemplates} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
