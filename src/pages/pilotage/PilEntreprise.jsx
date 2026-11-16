import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOwnerCompany, setOwnerCompanyAi } from '../../api/owner';
import { PageHead, CardHead, Kpi, Chart, JournalCard, PlanPill, ActivityStatus } from './PilotageUi';
import { fmtDate, fmtLongDate, fmtEuro, fmtMonth, activityLabel, plural } from './pilotageUtils';

// Fiche d'une entreprise : uniquement des nombres (jamais les noms des
// salariés, leurs horaires ou leurs demandes)
export default function PilEntreprise() {
  const { id } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState('');

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

  return (
    <>
      <PageHead
        title={<>{c.name} <PlanPill state={c.billing_state} /></>}
        sub={`Inscrite le ${fmtLongDate(c.created_at)} · ${c.planning_months} mois de planning${c.planning_until ? ` (jusqu’à ${fmtMonth(c.planning_until)})` : ''} · dernière activité ${activityLabel(c.last_activity)}`}
        back={back}
      />

      <div className="pil-kpis">
        <Kpi icon="users" label="Salariés actifs" value={c.employees}
          delta={c.billing_state === 'offert' ? 'abonnement offert pour toujours'
            : c.price_month > 0 ? `${fmtEuro(c.price_month)} HT / mois${c.billing_state === 'essai' ? ' après l’essai' : ''} (${billed} comptés)`
            : `${billed} / ${p.freeEmployees} salariés offerts`} />
        <Kpi icon="mail" label="Invitations en attente" value={c.pending_invites} delta="comptées dans le prix" muted />
        <Kpi icon="crown" label="Gérants" value={c.managers} delta={c.inactive_employees > 0 ? `${plural(c.inactive_employees, 'ancien salarié')}` : 'aucun ancien salarié'} muted />
        <div className="pil-card pil-kpi">
          <div className="pil-kpi-label">Dernière activité</div>
          <div className="pil-kpi-value pil-kpi-value--sm"><ActivityStatus date={c.last_activity} /></div>
          <div className="pil-kpi-delta pil-kpi-delta--muted">{c.last_activity ? fmtDate(c.last_activity) : 'aucune trace'}</div>
        </div>
      </div>

      <section className="pil-card pil-ai-card">
        <div>
          <h2 className="pil-ai-title">Option IA avancée</h2>
          <p className="pil-sub pil-ai-state">
            {c.ai_planning_enabled
              ? `Activée · ${c.ai_generations_month} / ${p.aiMonthlyGenerations} plannings générés ce mois-ci`
              : c.ai_option_requested_at
                ? `Demandée par le gérant le ${fmtLongDate(c.ai_option_requested_at)} · pas encore activée`
                : 'Pas demandée · le gérant peut la demander depuis sa page Abonnement'}
          </p>
          {aiError && <p className="pil-ai-error">{aiError}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(c.ai_planning_enabled)}
          className={`pil-switch${c.ai_planning_enabled ? ' on' : ''}`}
          disabled={aiSaving}
          onClick={toggleAi}
        >
          <span className="pil-switch-track"><span className="pil-switch-knob" /></span>
          {c.ai_planning_enabled ? 'IA activée' : 'IA désactivée'}
        </button>
      </section>

      <div className="pil-row">
        <section className="pil-card pil-card--fill">
          <CardHead title="Actions par semaine" sub={`12 dernières semaines · ${plural(weekTotal, 'action')} enregistrée${weekTotal > 1 ? 's' : ''} (journal démarré en novembre 2026)`} />
          <Chart
            type="bar"
            series={data.weeks.map((w) => ({ bucket: w.bucket, value: w.count }))}
            xLabel={(b) => fmtDate(`${b}T12:00:00`)}
            tip={(p) => `Semaine du ${fmtDate(`${p.bucket}T12:00:00`)} · ${plural(p.value, 'action')}`}
            ariaLabel="Actions par semaine"
            height={190}
            fill
          />
        </section>

        <section className="pil-card">
          <CardHead title="Utilisation sur 30 jours" sub="Ce que l’entreprise fait avec Orgaly" />
          <ul className="pil-usage">
            {usage.map((u) => (
              <li key={u.label}><span>{u.label}</span><b className={u.value === 0 ? 'pil-zero' : ''}>{u.value}</b></li>
            ))}
          </ul>
          {data.top_actions.length > 0 && (
            <>
              <p className="pil-sub pil-sub--spaced">Actions les plus fréquentes</p>
              <ul className="pil-usage pil-usage--small">
                {data.top_actions.map((a) => (
                  <li key={a.label}><span>{a.label}</span><b>{a.count}</b></li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <JournalCard token={token} companyId={c.id} title="Journal de l’entreprise" pageSize={50} />
    </>
  );
}
