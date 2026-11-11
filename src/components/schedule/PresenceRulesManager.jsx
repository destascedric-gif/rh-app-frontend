import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createPresenceRule, deletePresenceRule } from '../../api/presenceRules';
import Select from '../Select';

// « Au moins 1 Opticien à chaque heure d'ouverture »
export const presenceRuleText = (r) => `Au moins ${r.min_count} ${r.job_title} ${r.scope === 'toujours'
  ? 'à chaque heure d\'ouverture'
  : 'dans la journée'}`;

// Paramètres → Règles de présence (11 nov. 2026) : qui doit toujours être là,
// par poste (ex. un opticien diplômé dans un magasin d'optique). Respectées par
// le planning généré par IA ; Orgaly vérifie chaque proposition.
export default function PresenceRulesManager({ rules, jobTitles, loading, onChange }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ minCount: '1', jobTitle: '', scope: 'toujours' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Poste choisi, ou le premier de la liste (qui peut arriver après l'ouverture)
  const jobTitle = jobTitles.includes(form.jobTitle) ? form.jobTitle : (jobTitles[0] || '');

  const add = async (e) => {
    e.preventDefault();
    if (!jobTitle) { setError('Choisissez un poste.'); return; }
    setSaving(true);
    setError('');
    try {
      const saved = await createPresenceRule({ ...form, jobTitle, minCount: Number(form.minCount) }, token);
      onChange([...rules, saved]);
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
          <span className="presence-rule-word">Au moins</span>
          <input
            type="number" min="1" max="9" required aria-label="Nombre de personnes"
            className="presence-rule-count"
            value={form.minCount}
            onChange={(e) => setForm((f) => ({ ...f, minCount: e.target.value }))}
          />
          <Select
            aria-label="Poste"
            value={jobTitle}
            onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
          >
            {jobTitles.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select
            aria-label="Quand"
            value={form.scope}
            onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
          >
            <option value="toujours">à chaque heure d'ouverture</option>
            <option value="jour">au moins une fois dans la journée</option>
          </Select>
          <button type="submit" className="btn-primary btn-sm" disabled={saving}>
            {saving ? 'Ajout…' : 'Ajouter'}
          </button>
        </form>
      )}
      {error && <p className="error-msg">{error}</p>}
    </>
  );
}
