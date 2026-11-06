import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOwnerCompany } from '../../api/owner';
import { PageHead, CardHead, Kpi, Chart, JournalCard, PlanPill, ActivityStatus } from './PilotageUi';
import { fmtDate, fmtLongDate, fmtEuro, activityLabel, plural, PRO_PRICE } from './pilotageUtils';

// Fiche d'une entreprise : uniquement des nombres (jamais les noms des
// salariés, leurs horaires ou leurs demandes)
export default function PilEntreprise() {
  const { id } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getOwnerCompany(id, token)
      .then((d) => { if (!cancelled) { setData(d); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [id, token]);

  const back = { to: '/pilotage/entreprises', label: 'Toutes les entreprises' };
  if (error) return <><PageHead title="Entreprise" back={back} /><div className="pil-card pil-error">{error}</div></>;
  if (!data) return <><PageHead title="Entreprise" back={back} /><div className="pil-loading">Chargement…</div></>;

  const c = data.company;
  const limit = data.free_limit;
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
        title={<>{c.name} <PlanPill plan={c.plan} /></>}
        sub={`Inscrite le ${fmtLongDate(c.created_at)} · dernière activité ${activityLabel(c.last_activity)}`}
        back={back}
      />

      <div className="pil-kpis">
        <Kpi icon="users" label="Salariés actifs" value={c.employees}
          delta={c.plan === 'pro' ? `${fmtEuro(billed * PRO_PRICE)} HT / mois (estimé)` : `${billed} / ${limit} de la formule gratuite`} />
        <Kpi icon="mail" label="Invitations en attente" value={c.pending_invites} delta="comptées dans la limite" muted />
        <Kpi icon="crown" label="Gérants" value={c.managers} delta={c.inactive_employees > 0 ? `${plural(c.inactive_employees, 'ancien salarié')}` : 'aucun ancien salarié'} muted />
        <div className="pil-card pil-kpi">
          <div className="pil-kpi-label">Dernière activité</div>
          <div className="pil-kpi-value pil-kpi-value--sm"><ActivityStatus date={c.last_activity} /></div>
          <div className="pil-kpi-delta pil-kpi-delta--muted">{c.last_activity ? fmtDate(c.last_activity) : 'aucune trace'}</div>
        </div>
      </div>

      <div className="pil-row">
        <section className="pil-card">
          <CardHead title="Actions par semaine" sub={`12 dernières semaines · ${plural(weekTotal, 'action')} enregistrée${weekTotal > 1 ? 's' : ''} (journal démarré en novembre 2026)`} />
          <Chart
            type="bar"
            series={data.weeks.map((w) => ({ bucket: w.bucket, value: w.count }))}
            xLabel={(b) => fmtDate(`${b}T12:00:00`)}
            tip={(p) => `Semaine du ${fmtDate(`${p.bucket}T12:00:00`)} · ${plural(p.value, 'action')}`}
            ariaLabel="Actions par semaine"
            height={190}
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
