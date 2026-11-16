import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerAi, addOwnerAiCredit, deleteOwnerAiCredit } from '../../api/owner';
import { PageHead, CardHead, Strip, PeriodSeg, Chart, InfoTip } from './PilotageUi';
import { PERIODS, fmtDate, fmtLongDate, fmtWhen, plural, signupXLabel, daysAgo } from './pilotageUtils';

// Intelligence artificielle (11 nov. 2026, maquette validée) : ce que
// coûtent les plannings générés par l'IA, et le crédit Anthropic restant.
// Le crédit est ESTIMÉ (Anthropic ne donne pas le solde) : dernier solde
// relevé sur la Console + recharges notées depuis − coûts enregistrés
// depuis. « Corriger le solde » le remet sur le chiffre exact.

export const fmtUsd = (n) => `${Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
const fmtDuration = (ms) => {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`;
};
const monthLabel = (m) => (m ? new Date(`${m}-15T12:00:00`).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '—');
const RELEVE_STALE_DAYS = 7;

// Crédit Anthropic en une petite carte (16 nov. 2026, proposition A) :
// montant, jauge, deux boutons ; le calcul et les saisies derrière le « i »
function CreditCard({ credit, avgCost, token, onChange }) {
  const [form, setForm] = useState(null); // 'recharge' | 'releve'
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const open = (kind) => { setForm(kind); setAmount(''); setError(''); };
  const submit = async (e) => {
    e.preventDefault();
    const value = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) { setError('Montant invalide.'); return; }
    setSaving(true);
    setError('');
    try {
      onChange(await addOwnerAiCredit({ kind: form, amount: value }, token));
      setForm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (ev) => {
    if (!confirm(`Effacer cette saisie (${ev.kind === 'recharge' ? 'recharge' : 'solde relevé'} de ${fmtUsd(ev.amount)}) ?`)) return;
    try { onChange(await deleteOwnerAiCredit(ev.id, token)); } catch (err) { setError(err.message); }
  };

  const known = credit.balance !== null;
  const total = known ? credit.base + credit.recharges_since : 0;
  const share = known && total > 0 ? Math.max(0, Math.min(100, (credit.balance / total) * 100)) : 0;
  const low = known && credit.balance < credit.alert_usd;
  const releveAge = credit.anchor ? daysAgo(credit.anchor.at) : null;
  const releveStale = releveAge === null || releveAge > RELEVE_STALE_DAYS;

  return (
    <section className="pil-card">
      <div className="pil-card-head">
        <h2>
          Crédit Anthropic
          <InfoTip label="Comment le crédit est calculé" width={430}>
            {known && (
              <ul className="pil-usage pil-usage--small">
                {credit.anchor && <li><span>Solde relevé le {fmtLongDate(credit.anchor.at)}</span><b>{fmtUsd(credit.anchor.amount)}</b></li>}
                {credit.recharges_since > 0 && <li><span>Recharges notées depuis</span><b>+ {fmtUsd(credit.recharges_since)}</b></li>}
                <li><span>Dépensé depuis (estimé)</span><b>− {fmtUsd(credit.spent_since)}</b></li>
                <li><span>Alerte sur le tableau de bord sous</span><b>{fmtUsd(credit.alert_usd)}</b></li>
              </ul>
            )}
            <p style={{ marginTop: 8 }}>
              Prépayé, sans recharge automatique. Anthropic ne permet pas de lire le solde : Orgaly le calcule à partir de
              vos saisies et du coût de chaque génération (jetons comptés par Anthropic × prix publics). Les dépenses
              faites en dehors d’Orgaly (essais sur la Console) ne sont pas vues : un relevé de temps en temps remet tout d’aplomb.
            </p>
            {credit.events.length > 0 && (
              <>
                <p><b>Saisies</b></p>
                <ul className="pil-usage pil-usage--small">
                  {credit.events.map((ev) => (
                    <li key={ev.id}>
                      <span>{fmtDate(ev.occurred_at)} · {ev.kind === 'recharge' ? 'recharge' : 'solde relevé'}</span>
                      <span className="pil-usage-right">
                        <b>{fmtUsd(ev.amount)}</b>
                        <button type="button" className="pil-x" onClick={() => remove(ev)} aria-label="Effacer cette saisie">×</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </InfoTip>
        </h2>
        <span className={`pil-card-sub${releveStale ? ' pil-st--warn' : ''}`}>
          {releveAge === null ? 'aucun solde relevé' : releveAge === 0 ? 'relevé aujourd’hui' : `relevé il y a ${plural(releveAge, 'jour')}`}
        </span>
      </div>

      {!known ? (
        <p className="pil-sub">
          Pas encore renseigné : regardez votre solde sur la Console Claude, puis « Corriger le solde ».
        </p>
      ) : (
        <>
          <div className="pil-credit-row">
            <div className={`pil-credit${low ? ' pil-credit--low' : ''}`}>{fmtUsd(credit.balance)}</div>
            <span className="pil-card-sub">≈ {plural(Math.max(0, Math.floor(credit.balance / (avgCost || 0.5))), 'planning')} d’un mois</span>
          </div>
          <div className="pil-meter pil-meter--big" aria-hidden="true">
            <div className={`pil-meter--${low ? 'bad' : 'ok'}`} style={{ width: `${share}%` }} />
          </div>
        </>
      )}

      {form ? (
        <form className="pil-inline-form" onSubmit={submit}>
          <label>
            {form === 'recharge' ? 'Montant rechargé sur la Console' : 'Solde affiché sur la Console Claude'}
            <span className="pil-input-usd">
              <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10,00" autoFocus />
              <span>$</span>
            </span>
          </label>
          <div className="pil-inline-actions">
            <button type="button" className="pil-link" onClick={() => setForm(null)} disabled={saving}>Annuler</button>
            <button type="submit" className="pil-btn" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      ) : (
        <div className="pil-btns">
          <button type="button" className="pil-more" onClick={() => open('recharge')}>+ Noter une recharge</button>
          <button type="button" className="pil-more" onClick={() => open('releve')}>Corriger le solde</button>
        </div>
      )}
      {error && <p className="pil-error pil-sub">{error}</p>}
    </section>
  );
}

const RESULT = {
  applied: { cls: 'ok', label: 'appliqué' },
  proposed: { cls: 'warn', label: 'pas appliqué' },
  failed: { cls: 'bad', label: 'échec' },
};

export default function PilIA() {
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showChart, setShowChart] = useState(false);

  const load = useCallback(() => getOwnerAi(days, token)
    .then((d) => { setData(d); setError(''); })
    .catch((err) => setError(err.message)), [days, token]);
  useEffect(() => { load(); }, [load]);

  const period = PERIODS.find((p) => p.days === days);
  const monthly = days === 365;
  const t = data?.totals;
  const credit = data?.credit;
  const byCompany = data?.by_company ?? [];

  return (
    <>
      <PageHead
        title="Intelligence artificielle"
        info={<p>Ce que coûtent les plannings générés par l’IA (Claude, d’Anthropic). Anthropic facture en dollars. Seules les entreprises qui ont l’option IA peuvent générer un planning. Le suivi a démarré le 11 novembre 2026.</p>}
      >
        <PeriodSeg days={days} onChange={setDays} />
      </PageHead>

      {error && <div className="pil-card pil-error">{error}</div>}
      {!data && !error && <div className="pil-loading">Chargement…</div>}

      {data && (
        <>
          <Strip items={[
            { icon: 'euro', label: 'Dépensé ce mois-ci', value: fmtUsd(data.month.cost), delta: plural(data.month.generations, 'génération') },
            { icon: 'list', label: `Plannings générés (${period.label})`, value: t.generations, delta: `dont ${t.applied} appliqué${t.applied > 1 ? 's' : ''}` },
            { icon: 'clock', label: 'Coût moyen', value: t.proposed ? fmtUsd(t.avg_cost) : '—', delta: t.proposed ? fmtDuration(t.avg_ms) : 'aucune génération', muted: !t.proposed },
            {
              icon: 'spark',
              label: 'Par entreprise',
              grow: 1.4,
              children: (
                <div className="pil-strip-text" title={byCompany.map((c) => `${c.company} : ${c.generations} · ${fmtUsd(c.cost)}`).join('\n')}>
                  {byCompany.length === 0 ? 'aucune dépense' : byCompany.map((c, i) => (
                    <span key={c.id ?? i}>{i > 0 && ' · '}{c.company} <b>{fmtUsd(c.cost)}</b></span>
                  ))}
                </div>
              ),
            },
          ]} />

          <div className="pil-row" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.65fr)' }}>
            <CreditCard credit={credit} avgCost={t.avg_cost} token={token} onChange={(c) => setData((d) => ({ ...d, credit: c }))} />

            <section className="pil-card">
              <CardHead title={showChart ? 'Dépenses' : 'Dernières générations'} sub={showChart ? (monthly ? 'par mois' : 'par jour') : 'sans le contenu des plannings'}>
                <button type="button" className="pil-more" onClick={() => setShowChart((v) => !v)}>
                  {showChart ? '‹ Dernières générations' : `Dépenses par ${monthly ? 'mois' : 'jour'} ›`}
                </button>
              </CardHead>
              {showChart ? (
                <Chart
                  type="bar"
                  series={data.series}
                  xLabel={signupXLabel(monthly)}
                  tip={(p) => `${signupXLabel(monthly)(p.bucket)} · ${fmtUsd(p.value)}`}
                  ariaLabel="Dépenses de l’IA"
                  height={170}
                />
              ) : data.recent.length === 0 ? (
                <p className="pil-empty">Aucune génération enregistrée pour l’instant (le suivi a démarré le 11 novembre 2026).</p>
              ) : (
                <table className="pil-table">
                  <thead>
                    <tr><th>Quand</th><th>Entreprise</th><th>Mois</th><th>Durée</th><th className="pil-num">Coût</th><th>Résultat</th></tr>
                  </thead>
                  <tbody>
                    {data.recent.map((g) => {
                      const r = RESULT[g.status === 'echec' ? 'failed' : g.applied ? 'applied' : 'proposed'];
                      return (
                        <tr key={g.id}>
                          <td>{fmtWhen(g.created_at)}</td>
                          <td>{g.company ?? 'Entreprise supprimée'}</td>
                          <td>{monthLabel(g.month)}{g.refinement ? ' · retouche' : ''}</td>
                          <td>{fmtDuration(g.duration_ms)}</td>
                          <td className="pil-num">{fmtUsd(g.cost)}</td>
                          <td title={g.error || undefined}><span className={`pil-dot pil-dot--${r.cls}`} />{r.label}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
