import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOwnerCompany, setOwnerCompanyAi } from '../../api/owner';
import { PageHead, CardHead, Chart, JournalCard, PlanPill, Icon } from './PilotageUi';
import { fmtDate, fmtEuro, fmtMonth, activityLabel, plural, isStale } from './pilotageUtils';

// Fiche d'une entreprise : uniquement des nombres (jamais les noms des
// salariés, leurs horaires ou leurs demandes).
// Version compacte (16 nov. 2026, proposition A choisie par Cédric) : une
// ligne de pastilles au lieu des grandes cases, l'interrupteur IA en haut,
// les 5 dernières actions avec « Tout voir ».
export default function PilEntreprise() {
  const { id } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOwnerCompany(id, token)
      .then((d) => { if (!cancelled) { setData(d); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [id, token]);

  // Interrupteur « IA avancée » (16 nov. 2026) : Cédric active l’option
  // lui-même après une demande du gérant (bouton de sa page Abonnement)
  const toggleAi = async () => {
    if (data.company.ai_planning_enabled
      && !window.confirm(`Couper l’option IA avancée pour ${data.company.name} ? Le bouton « Générer avec l’IA » disparaîtra de son planning.`)) return;
    setAiSaving(true);
    setAiError('');
    try {
      const r = await setOwnerCompanyAi(id, !data.company.ai_planning_enabled, token);
      setData((d) => ({ ...d, company: { ...d.company, ...r } }));
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiSaving(false);
    }
  };

  const back = { to: '/pilotage/entreprises', label: 'Toutes les entreprises' };
  if (error) return <><PageHead title="Entreprise" back={back} /><div className="pil-card pil-error">{error}</div></>;
  if (!data) return <><PageHead title="Entreprise" back={back} /><div className="pil-loading">Chargement…</div></>;

  const c = data.company;
  const p = data.pricing;
  // Comptés dans l'abonnement : salariés actifs et invitations en attente
  const billed = c.employees + c.pending_invites;
  const usage = [
    { label: 'Créneaux de planning créés', value: c.shifts_30d },
    { label: 'Demandes de congés', value: c.leaves_30d },
    { label: 'Pointages', value: c.timesheets_30d },
    { label: 'Bulletins de paie générés', value: c.payslips_30d },
    { label: 'Réunions créées', value: c.meetings_30d },
  ];
  const weekTotal = data.weeks.reduce((s, w) => s + w.count, 0);
  const stale = isStale(c.last_activity);
  const aiLabel = c.ai_planning_enabled
    ? `IA activée · ${c.ai_generations_month} / ${p.aiMonthlyGenerations} ce mois-ci`
    : c.ai_option_requested_at ? `IA désactivée · demandée le ${fmtDate(c.ai_option_requested_at)}` : 'IA désactivée';
  const price = c.billing_state === 'offert' ? 'abonnement offert pour toujours'
    : c.price_month > 0 ? `${fmtEuro(c.price_month)} HT / mois${c.billing_state === 'essai' ? ' après l’essai' : ''} (${billed} comptés)`
    : `${billed} / ${p.freeEmployees} salariés offerts`;
  const s = (n) => (n > 1 ? 's' : '');

  return (
    <>
      <header className="pil-page-head">
        <div>
          <Link to={back.to} className="pil-back"><Icon name="back" size={14} />{back.label}</Link>
          <h1>{c.name} <PlanPill state={c.billing_state} /></h1>
        </div>
        <div className="pil-head-right">
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(c.ai_planning_enabled)}
            className={`pil-switch${c.ai_planning_enabled ? ' on' : ''}`}
            disabled={aiSaving}
            onClick={toggleAi}
            title={c.ai_planning_enabled ? 'Couper l’option IA avancée' : 'Activer l’option IA avancée : le bouton « Générer avec l’IA » apparaît dans son planning'}
          >
            <span className="pil-switch-track"><span className="pil-switch-knob" /></span>
            {aiLabel}
          </button>
          {aiError && <p className="pil-ai-error">{aiError}</p>}
        </div>
      </header>

      <div className="pil-chips">
        <span><b>{c.employees}</b> salarié{s(c.employees)} actif{s(c.employees)}</span>
        <span><b>{c.pending_invites}</b> invitation{s(c.pending_invites)} en attente</span>
        {c.inactive_employees > 0 && <span><b>{c.inactive_employees}</b> ancien{s(c.inactive_employees)} salarié{s(c.inactive_employees)}</span>}
        <span>inscrite le <b>{fmtDate(c.created_at)}</b></span>
        <span><b>{c.planning_months}</b> mois de planning{c.planning_until ? ` (jusqu’à ${fmtMonth(c.planning_until)})` : ''}</span>
        <span className="pil-chip--gold">{price}</span>
        <span className={stale ? 'pil-chip--warn' : 'pil-chip--ok'}>
          {stale ? `à relancer${c.last_activity ? ` · dernière activité le ${fmtDate(c.last_activity)}` : ''}` : `actif ${activityLabel(c.last_activity)}`}
        </span>
      </div>

      <div className="pil-row">
        <section className="pil-card pil-card--fill">
          <CardHead title="Actions par semaine" sub={`12 semaines · ${weekTotal}`} />
          <Chart
            type="bar"
            series={data.weeks.map((w) => ({ bucket: w.bucket, value: w.count }))}
            xLabel={(b) => fmtDate(`${b}T12:00:00`)}
            tip={(pt) => `Semaine du ${fmtDate(`${pt.bucket}T12:00:00`)} · ${plural(pt.value, 'action')}`}
            ariaLabel="Actions par semaine"
            height={150}
            fill
          />
        </section>

        <section className="pil-card">
          <CardHead title={showTop ? 'Actions les plus fréquentes' : 'Sur 30 jours'}>
            {data.top_actions.length > 0 && (
              <button type="button" className="pil-more" onClick={() => setShowTop((v) => !v)}>
                {showTop ? '‹ Utilisation' : 'Actions fréquentes ›'}
              </button>
            )}
          </CardHead>
          <ul className="pil-usage">
            {showTop
              ? data.top_actions.map((a) => <li key={a.label}><span>{a.label}</span><b>{a.count}</b></li>)
              : usage.map((u) => <li key={u.label}><span>{u.label}</span><b className={u.value === 0 ? 'pil-zero' : ''}>{u.value}</b></li>)}
          </ul>
        </section>
      </div>

      <JournalCard token={token} companyId={c.id} title="Journal de l’entreprise" sub="dernières actions" initialLimit={5} pageSize={50} />
    </>
  );
}
