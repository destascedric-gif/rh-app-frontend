import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createPresenceRule, deletePresenceRule } from '../../api/presenceRules';
import Select from '../Select';
import EmployeeMultiSelect from '../EmployeeMultiSelect';

// « Opticien diplômé ou Opticienne diplômée » ; « A, B ou C »
const titlesText = (titles) => (titles.length < 2
  ? titles.join('')
  : `${titles.slice(0, -1).join(', ')} ou ${titles[titles.length - 1]}`);

// « Au moins 1 Opticien diplômé ou Opticienne diplômée à chaque heure d'ouverture »
const presenceRuleText = (r) => `Au moins ${r.min_count} ${titlesText(r.job_titles)} ${r.scope === 'toujours'
  ? 'à chaque heure d\'ouverture'
  : 'dans la journée'}`;

// Paramètres → Planning → Règles de présence (11 nov. 2026) : qui doit toujours
// être là, par poste (ex. un opticien diplômé dans un magasin d'optique). Une
// règle peut viser plusieurs postes (« Opticien diplômé » et « Opticienne
// diplômée ») : une personne de l'un d'eux suffit. Respectées par le planning
// généré par IA ; Orgaly vérifie chaque proposition.
export default function PresenceRulesManager({ rules, jobTitles, loading, onChange }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ minCount: '1', jobTitles: [], scope: 'toujours' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Postes cochés encore présents dans les fiches
  const chosen = form.jobTitles.filter((t) => jobTitles.includes(t));

  const add = async (e) => {
    e.preventDefault();
    if (chosen.length === 0) { setError('Choisissez au moins un poste.'); return; }
    setSaving(true);
    setError('');
    try {
      // Dans l'ordre de la liste, pour une phrase stable
      const ordered = jobTitles.filter((t) => chosen.includes(t));
      const saved = await createPresenceRule({ ...form, jobTitles: ordered, minCount: Number(form.minCount) }, token);
      onChange([...rules, saved]);
      setForm((f) => ({ ...f, jobTitles: [] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (rule) => {
    if (!confirm(`Supprimer la règle « ${presenceRuleText(rule)} » ?`)) return;
    setError('');
    try {
      await deletePresenceRule(rule.id, token);
      onChange(rules.filter((r) => r.id !== rule.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <p className="hint" style={{ marginTop: 0, marginBottom: 14 }}>
        Indiquez qui doit être présent quand la boutique est ouverte, par exemple
        « au moins 1 opticien diplômé à chaque heure d'ouverture ». Ces règles serviront au
        planning généré automatiquement : il les respectera toujours.
      </p>

      {loading ? (
        <p className="empty-state">Chargement…</p>
      ) : rules.length === 0 ? (
        <p className="empty-state">Aucune règle pour l'instant.</p>
      ) : (
        <ul className="presence-rules">
          {rules.map((r) => (
            <li key={r.id}>
              <span>{presenceRuleText(r)}</span>
              <button type="button" className="btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(r)}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading ? null : jobTitles.length === 0 ? (
        <p className="hint">
          Aucun poste n'est rempli dans les fiches de vos salariés. Indiquez le poste de chacun
          (Équipe → fiche du salarié → Modifier) pour pouvoir créer une règle.
        </p>
      ) : (
        <form onSubmit={add} className="inline-form presence-rule-form">
          <div className="presence-rule-line">
            <span>Au moins</span>
            <input
              type="number" min="1" max="9" required aria-label="Nombre de personnes"
              className="presence-rule-count"
              value={form.minCount}
              onChange={(e) => setForm((f) => ({ ...f, minCount: e.target.value }))}
            />
            <span>{Number(form.minCount) > 1 ? 'personnes' : 'personne'}</span>
            <Select
              aria-label="Quand"
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
            >
              <option value="toujours">à chaque heure d'ouverture</option>
              <option value="jour">au moins une fois dans la journée</option>
            </Select>
          </div>

          <div className="presence-rule-titles">
            <span>parmi ces postes :</span>
            <EmployeeMultiSelect
              employees={jobTitles.map((t) => ({ id: t, label: t }))}
              value={chosen}
              onChange={(titles) => setForm((f) => ({ ...f, jobTitles: titles }))}
              placeholder="Choisir un ou plusieurs postes…"
              allLabel="Tous les postes"
            />
            <span className="hint">
              Cochez plusieurs postes si un même métier est écrit de plusieurs façons dans les
              fiches (« Opticien diplômé », « Opticienne diplômée ») : une personne de l'un
              d'eux suffit.
            </span>
          </div>

          <div className="presence-rule-actions">
            {chosen.length > 0 && (
              <span className="presence-rule-preview">
                {presenceRuleText({ min_count: form.minCount || 1, job_titles: jobTitles.filter((t) => chosen.includes(t)), scope: form.scope })}
              </span>
            )}
            <button type="submit" className="btn-primary btn-sm" disabled={saving}>
              {saving ? 'Ajout…' : 'Ajouter la règle'}
            </button>
          </div>
        </form>
      )}
      {error && <p className="error-msg">{error}</p>}
    </>
  );
}
