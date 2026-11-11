import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerAi, addOwnerAiCredit, deleteOwnerAiCredit } from '../../api/owner';
import { PageHead, CardHead, Kpi, PeriodSeg, Chart, Icon } from './PilotageUi';
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

  return (
    <section className="pil-card">
      <CardHead title="Crédit Anthropic" sub="Prépayé, sans recharge automatique">
        <button type="button" className="pil-btn-ghost" onClick={() => open('recharge')}>+ Noter une recharge</button>
      </CardHead>

      {!known ? (
        <p className="pil-sub">
          Pas encore renseigné. Ouvrez la Console Claude, regardez votre solde, puis cliquez sur
          « Corriger le solde » pour le noter : Orgaly comptera ensuite les dépenses à partir de ce chiffre.
        </p>
      ) : (
        <>
          <div className={`pil-credit${low ? ' pil-credit--low' : ''}`}>
            {fmtUsd(credit.balance)} <small>estimés</small>
          </div>
          <div className="pil-meter pil-meter--big" aria-hidden="true">
            <div className={`pil-meter--${low ? 'bad' : 'ok'}`} style={{ width: `${share}%` }} />
          </div>
          <ul className="pil-usage pil-usage--small">
            {credit.anchor && <li><span>Solde relevé le {fmtLongDate(credit.anchor.at)}</span><b>{fmtUsd(credit.anchor.amount)}</b></li>}
            {credit.recharges_since > 0 && <li><span>Recharges notées depuis</span><b>+ {fmtUsd(credit.recharges_since)}</b></li>}
            <li><span>Dépensé depuis (estimé)</span><b>− {fmtUsd(credit.spent_since)}</b></li>
            <li><span>Environ</span><b>{plural(Math.max(0, Math.floor(credit.balance / (avgCost || 0.5))), 'planning')} d’un mois</b></li>
            <li><span>Alerte sur le tableau de bord sous</span><b>{fmtUsd(credit.alert_usd)}</b></li>
          </ul>
          <p className={`pil-note${releveAge === null || releveAge > RELEVE_STALE_DAYS ? ' pil-note--warn' : ''}`}>
            {releveAge === null
              ? 'Aucun solde relevé pour l’instant : notez celui de la Console pour un chiffre exact.'
              : releveAge === 0
                ? 'Solde relevé aujourd’hui.'
                : `Dernier relevé il y a ${plural(releveAge, 'jour')}${releveAge > RELEVE_STALE_DAYS ? ' : pensez à le mettre à jour.' : '.'}`}
          </p>
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
        <button type="button" className="pil-link" onClick={() => open('releve')}>Corriger le solde (le noter depuis la Console)</button>
      )}
      {error && <p className="pil-error pil-sub">{error}</p>}

      {credit.events.length > 0 && (
        <>
          <p className="pil-sub pil-sub--spaced">Saisies</p>
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
      <p className="pil-note">
        Anthropic ne permet pas de lire le solde : Orgaly le calcule à partir de vos saisies et du coût de
        chaque génération (jetons comptés par Anthropic × prix publics). Les dépenses faites en dehors
        d’Orgaly (essais sur la Console) ne sont pas vues : un relevé de temps en temps remet tout d’aplomb.
      </p>
    </section>
  );
}

const RESULT = {
  applied: { cls: 'ok', icon: 'check', label: 'appliqué' },
  proposed: { cls: 'warn', icon: 'block', label: 'pas appliqué' },
  failed: { cls: 'bad', icon: 'alert', label: 'échec' },
};

export default function PilIA() {
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => getOwnerAi(days, token)
    .then((d) => { setData(d); setError(''); })
    .catch((err) => setError(err.message)), [days, token]);
  useEffect(() => { load(); }, [load]);

  const period = PERIODS.find((p) => p.days === days);
  const monthly = days === 365;
  const t = data?.totals;
  const credit = data?.credit;
  const low = credit && credit.balance !== null && credit.balance < credit.alert_usd;

  return (
    <>
      <PageHead title="Intelligence artificielle" sub="Ce que coûtent les plannings générés par l’IA (Claude, d’Anthropic). Anthropic facture en dollars.">
        <PeriodSeg days={days} onChange={setDays} />
      </PageHead>

      {error && <div className="pil-card pil-error">{error}</div>}
      {!data && !error && <div className="pil-loading">Chargement…</div>}

      {data && (
        <>
          <div className="pil-kpis">
            <Kpi icon="euro" label="Dépensé ce mois-ci" value={fmtUsd(data.month.cost)} delta={plural(data.month.generations, 'génération')} />
            <Kpi
              icon={low ? 'alert' : 'check'}
              label="Crédit restant estimé"
              value={credit.balance === null ? '—' : fmtUsd(credit.balance)}
              delta={credit.balance === null ? 'à noter depuis la Console' : low ? 'bas : pensez à recharger' : `environ ${plural(Math.floor(credit.balance / (t.avg_cost || 0.5)), 'planning')} d’un mois`}
              muted={credit.balance === null}
            />
            <Kpi icon="list" label="Plannings générés" value={t.generations} delta={`${period.since} · dont ${t.applied} appliqué${t.applied > 1 ? 's' : ''}`} />
            <Kpi icon="clock" label="Coût moyen" value={t.proposed ? fmtUsd(t.avg_cost) : '—'} delta={t.proposed ? `par génération · ${fmtDuration(t.avg_ms)}` : 'aucune génération sur la période'} muted={!t.proposed} />
          </div>

          <div className="pil-row">
            <section className="pil-card">
              <CardHead title="Dépenses" sub={`Coût estimé des générations ${monthly ? 'par mois, 12 derniers mois' : `par jour, ${days} derniers jours`}`} />
              <Chart
                type="bar"
                series={data.series}
                xLabel={signupXLabel(monthly)}
                tip={(p) => `${signupXLabel(monthly)(p.bucket)} · ${fmtUsd(p.value)}`}
                ariaLabel="Dépenses de l’IA"
              />
            </section>
            <CreditCard credit={credit} avgCost={t.avg_cost} token={token} onChange={(c) => setData((d) => ({ ...d, credit: c }))} />
          </div>

          <div className="pil-row">
            <section className="pil-card">
              <CardHead title="Dernières générations" sub="Sans le contenu des plannings" />
              {data.recent.length === 0 ? (
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
                          <td><span className={`pil-st pil-st--${r.cls}`} title={g.error || undefined}><Icon name={r.icon} />{r.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
            <section className="pil-card">
              <CardHead title="Par entreprise" sub={`${days === 365 ? '12 derniers mois' : `${days} derniers jours`}`} />
              {data.by_company.length === 0 ? (
                <p className="pil-empty">Aucune dépense sur la période.</p>
              ) : (
                <table className="pil-table">
                  <thead><tr><th>Entreprise</th><th className="pil-num">Générations</th><th className="pil-num">Dépensé</th></tr></thead>
                  <tbody>
                    {data.by_company.map((c) => (
                      <tr key={c.id ?? 'x'}><td>{c.company}</td><td className="pil-num">{c.generations}</td><td className="pil-num">{fmtUsd(c.cost)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="pil-note">Seules les entreprises qui ont l’accès à l’IA peuvent générer un planning.</p>
            </section>
          </div>
        </>
      )}
    </>
  );
}
