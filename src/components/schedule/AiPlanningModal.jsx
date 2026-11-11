import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminSchedule } from '../../api/schedule';
import {
  getAiPlanningFacts, confirmContract, generateAiPlanning, applyAiPlanning,
} from '../../api/aiPlanning';
import { NEUTRAL_SHIFT_COLOR } from './shiftColor';
import { WEEKDAY_LABELS, addDaysISO, shortTime, colorOfSlot } from './weekTemplateUtils';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const monthText = ({ year, month }) => `${MONTHS[month - 1]} ${year}`;
const shiftMonth = ({ year, month }, n) => {
  const d = new Date(year, month - 1 + n, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const hoursText = (h) => `${String(Math.round(h * 10) / 10).replace('.', ',')} h`;

// Aperçu d'une semaine de la proposition : une ligne par salarié, une colonne
// par jour ; les cases déjà posées (gardées) sont marquées « gardé ».
function ProposalWeek({ weekStart, people, slotAt, existingAt, shiftTemplates, inMonth }) {
  return (
    <div className="wt-prev ai-week">
      <table>
        <thead>
          <tr>
            <th aria-label="Salarié" />
            {WEEKDAY_LABELS.map((d, i) => {
              const date = addDaysISO(weekStart, i);
              return <th key={d} className={inMonth(date) ? '' : 'ai-out'}>{d} {Number(date.slice(8))}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {people.map((e) => (
            <tr key={e.id}>
              <td className="wt-prev-name">{e.first_name}</td>
              {WEEKDAY_LABELS.map((_, i) => {
                const date = addDaysISO(weekStart, i);
                const slot = slotAt(e.id, date);
                const old = existingAt(e.id, date);
                if (!slot && old) {
                  const label = old.type === 'conge' ? 'Congé' : old.type === 'absence' ? 'Absence' : old.type === 'repos'
                    ? 'Repos' : `${shortTime(old.start_time)}–${shortTime(old.end_time)}`;
                  return <td key={i} className="wt-cell wt-cell--kept" title="Déjà posé : gardé">{label}<em>gardé</em></td>;
                }
                if (!slot) return <td key={i} className="wt-cell wt-cell--empty">—</td>;
                if (slot.type === 'repos') return <td key={i} className="wt-cell wt-cell--rest">Repos</td>;
                const color = colorOfSlot(slot, shiftTemplates);
                return (
                  <td
                    key={i}
                    className={`wt-cell ${color ? 'wt-cell--work' : 'wt-cell--manual'}`}
                    style={{ '--shift-color': color || NEUTRAL_SHIFT_COLOR }}
                    title={slot.breaks?.length ? `Pause ${slot.breaks.map((b) => `${shortTime(b.start_time)}–${shortTime(b.end_time)}`).join(', ')}` : undefined}
                  >
                    {shortTime(slot.startTime)}–{shortTime(slot.endTime)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Fenêtre « Générer avec l'IA » (11 nov. 2026, règles validées par Cédric :
// Notes/Planning par IA - règles.md). 1. Préparer : mois, points à vérifier,
// demandes ; 2. l'IA prépare ; 3. Proposition : aperçu, remarques, retouches,
// puis « Appliquer au planning ». Rien n'est écrit avant ce dernier clic.
export default function AiPlanningModal({ initialMonth, employees, shiftTemplates, onClose, onDone }) {
  const { token } = useAuth();
  const [period, setPeriod] = useState(initialMonth);
  const [facts, setFacts] = useState(null);
  const [mode, setMode] = useState('empty');
  const [requests, setRequests] = useState('');
  const [step, setStep] = useState('prepare'); // 'prepare' | 'loading' | 'proposal'
  const [proposal, setProposal] = useState(null);
  const [existing, setExisting] = useState([]);
  const [refinement, setRefinement] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadFacts = useCallback(() => {
    setFacts(null);
    getAiPlanningFacts(period.year, period.month, token).then(setFacts).catch((err) => setError(err.message));
  }, [period, token]);
  useEffect(() => { loadFacts(); }, [loadFacts]);

  const confirm = async (userId) => {
    setError('');
    try {
      await confirmContract(userId, token);
      loadFacts();
    } catch (err) {
      setError(err.message);
    }
  };

  const generate = async (withRefinement) => {
    setError('');
    setStep('loading');
    try {
      const body = { year: period.year, month: period.month, mode, requests };
      if (withRefinement) Object.assign(body, { previous: { slots: proposal.slots }, refinement });
      const [result, shifts] = await Promise.all([
        generateAiPlanning(body, token),
        facts ? getAdminSchedule(facts.range.start, facts.range.end, null, token) : [],
      ]);
      setProposal(result);
      setExisting(shifts);
      setRefinement('');
      setStep('proposal');
    } catch (err) {
      setError(err.message);
      setStep(proposal ? 'proposal' : 'prepare');
    }
  };

  const apply = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await applyAiPlanning({ year: period.year, month: period.month, mode, slots: proposal.slots }, token);
      onDone(result, monthText(period), period);
    } catch (err) {
      setError(err.problems?.length ? `${err.message} ${err.problems[0].message}` : err.message);
      setBusy(false);
    }
  };

  // ── Aperçu ──
  const slotMap = new Map((proposal?.slots || []).map((s) => [`${s.userId}|${s.date}`, s]));
  const existingMap = new Map(existing.map((s) => [`${s.user_id}|${String(s.date).slice(0, 10)}`, s]));
  const peopleIds = new Set([...(proposal?.slots || []).map((s) => s.userId), ...(facts?.people || []).map((p) => p.userId)]);
  const people = employees.filter((e) => peopleIds.has(e.id));
  const weeks = [];
  if (facts) for (let w = facts.range.start; w <= facts.range.end; w = addDaysISO(w, 7)) weeks.push(w);
  const inMonth = (date) => facts && date >= facts.month.first && date <= facts.month.last;
  const work = (proposal?.slots || []).filter((s) => s.type === 'travail').length;
  const rest = (proposal?.slots || []).length - work;
  const byLevel = (level) => (proposal?.problems || []).filter((p) => p.level === level);
  const blocking = byLevel('bloquant');

  const closeIfIdle = () => { if (step !== 'loading' && !busy) onClose(); };

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeIfIdle(); }}>
      <div className="modal wt-modal ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-title">
        <h3 id="ai-title"><span className="ai-spark" aria-hidden="true">✦</span> Générer le planning avec l'IA</h3>

        {step === 'prepare' && (
          <>
            <div className="ai-month">
              <button type="button" className="btn-ghost btn-sm" onClick={() => setPeriod((p) => shiftMonth(p, -1))} aria-label="Mois précédent">←</button>
              <strong>{monthText(period)}</strong>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setPeriod((p) => shiftMonth(p, 1))} aria-label="Mois suivant">→</button>
            </div>
            {facts && (
              <p className="wt-sub">
                Semaines entières du lundi {Number(facts.range.start.slice(8))} {MONTHS[Number(facts.range.start.slice(5, 7)) - 1]}
                {' '}au dimanche {Number(facts.range.end.slice(8))} {MONTHS[Number(facts.range.end.slice(5, 7)) - 1]}.
                {' '}L'IA s'inspire des habitudes de votre équipe ; rien n'est enregistré avant votre accord.
              </p>
            )}

            {!facts ? (
              <p className="wt-prev-empty">{error ? '' : 'Chargement…'}</p>
            ) : (
              <>
                {facts.warnings.length > 0 && (
                  <div className="ai-box ai-box--warn">
                    <b>À vérifier avant de générer</b>
                    {facts.warnings.map((w) => (
                      <div key={w.message} className="ai-warning">
                        <span>{w.message}</span>
                        {w.code === 'contrat_historique' && w.userId && (
                          <span className="ai-warning-actions">
                            <button type="button" className="btn-ghost btn-sm" onClick={() => confirm(w.userId)}>Oui, la fiche est juste</button>
                            <Link className="btn-ghost btn-sm" to={`/employees/${w.userId}/edit`}>Corriger la fiche</Link>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {facts.people.some((p) => p.gapHours) && (
                  <details className="ai-gaps">
                    <summary>Compteur d'heures des dernières semaines</summary>
                    <ul>
                      {facts.people.filter((p) => p.gapHours != null).map((p) => (
                        <li key={p.userId}>
                          {p.firstName} : {p.gapHours === 0 ? 'à l\'équilibre' : `${p.gapHours > 0 ? '+' : '−'}${hoursText(Math.abs(p.gapHours))} par rapport au contrat (${hoursText(p.contractHours)}/semaine)`}
                        </li>
                      ))}
                    </ul>
                    <p className="hint">Pour information : l'IA garde le rythme habituel. Demandez-lui un rattrapage si besoin.</p>
                  </details>
                )}

                <div className="wt-field">
                  <label className="wt-field-label" htmlFor="ai-requests">Vos demandes (facultatif)</label>
                  <textarea
                    id="ai-requests"
                    rows={4}
                    maxLength={2000}
                    placeholder={'Exemples :\nSarah en repos le 5 décembre.\nAu moins 3 personnes le samedi 19 décembre.\nFaire rattraper ses 3 heures à Mélanie.'}
                    value={requests}
                    onChange={(e) => setRequests(e.target.value)}
                  />
                </div>

                <div className="wt-opts ai-opts" role="radiogroup" aria-label="Que faire des cases déjà remplies ?">
                  <label className={`wt-opt${mode === 'empty' ? ' wt-opt--on' : ''}`}>
                    <input type="radio" name="ai-mode" checked={mode === 'empty'} onChange={() => setMode('empty')} />
                    <span><b>Remplir seulement les cases vides</b>Recommandé : ce qui est déjà posé ne bouge pas.</span>
                  </label>
                  <label className={`wt-opt${mode === 'replace' ? ' wt-opt--on' : ''}`}>
                    <input type="radio" name="ai-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
                    <span><b>Tout refaire</b>Les créneaux et repos déjà posés peuvent changer. Les congés et absences, jamais.</span>
                  </label>
                </div>
              </>
            )}

            {error && <p className="error-msg">{error}</p>}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
              <button type="button" className="btn-primary" onClick={() => generate(false)} disabled={!facts}>
                Générer le planning
              </button>
            </div>
          </>
        )}

        {step === 'loading' && (
          <div className="ai-loading" role="status">
            <span className="ai-spinner" aria-hidden="true" />
            <p><b>L'IA prépare le planning de {monthText(period)}…</b></p>
            <p className="hint">Cela peut prendre deux à trois minutes. Orgaly vérifie ensuite chaque règle avant de vous le montrer.</p>
          </div>
        )}

        {step === 'proposal' && proposal && (
          <>
            <p className="wt-sub">
              Proposition pour {monthText(period)} : {plural(work, 'créneau', 'créneaux')} et {plural(rest, 'repos', 'repos')}
              {proposal.attempts > 1 ? ` (corrigée ${proposal.attempts - 1} fois par Orgaly)` : ''}. Rien n'est encore enregistré.
            </p>

            {proposal.notes.length > 0 && (
              <div className="ai-box">
                <b>Remarques de l'IA</b>
                <ul>{proposal.notes.map((n) => <li key={n}>{n}</li>)}</ul>
              </div>
            )}
            {blocking.length > 0 && (
              <div className="ai-box ai-box--error">
                <b>Règles non respectées : à corriger avant d'appliquer</b>
                <ul>{blocking.map((p) => <li key={p.message}>{p.message}</li>)}</ul>
              </div>
            )}
            {byLevel('avertissement').length > 0 && (
              <div className="ai-box ai-box--warn">
                <b>À vérifier</b>
                <ul>{byLevel('avertissement').map((p) => <li key={p.message}>{p.message}</li>)}</ul>
              </div>
            )}
            {byLevel('info').length > 0 && (
              <details className="ai-gaps">
                <summary>{plural(byLevel('info').length, 'jour diffère', 'jours diffèrent')} de l'habitude</summary>
                <ul>{byLevel('info').map((p) => <li key={p.message}>{p.message}</li>)}</ul>
              </details>
            )}

            <div className="ai-weeks">
              {weeks.map((w) => (
                <ProposalWeek
                  key={w}
                  weekStart={w}
                  people={people}
                  slotAt={(id, d) => slotMap.get(`${id}|${d}`)}
                  existingAt={(id, d) => existingMap.get(`${id}|${d}`)}
                  shiftTemplates={shiftTemplates}
                  inMonth={inMonth}
                />
              ))}
            </div>

            <div className="wt-field ai-refine">
              <label className="wt-field-label" htmlFor="ai-refine">Une retouche ? Demandez-la à l'IA</label>
              <div className="ai-refine-row">
                <input
                  id="ai-refine"
                  type="text"
                  maxLength={1000}
                  placeholder="Ex. : mets plutôt Mélanie le mardi 8 et Sarah le jeudi 10."
                  value={refinement}
                  onChange={(e) => setRefinement(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && refinement.trim()) { e.preventDefault(); generate(true); } }}
                />
                <button type="button" className="btn-secondary" onClick={() => generate(true)} disabled={!refinement.trim()}>
                  Redemander
                </button>
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>Annuler</button>
              <button type="button" className="btn-ghost" onClick={() => { setStep('prepare'); setError(''); }} disabled={busy}>
                Modifier les demandes
              </button>
              <button type="button" className="btn-primary" onClick={apply} disabled={busy || blocking.length > 0 || proposal.slots.length === 0}>
                {busy ? 'Enregistrement…' : 'Appliquer au planning'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
