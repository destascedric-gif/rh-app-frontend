import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats } from '../../api/owner';
import { PageHead, CardHead, Kpi, CompaniesTable } from './PilotageUi';
import { fmtEuro, plural, PRO_PRICE } from './pilotageUtils';

// Formules et revenus : répartition Gratuit / Pro, entreprises proches
// de la limite gratuite, revenu estimé (en attendant Stripe)
export default function PilFormules() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getOwnerStats(30, token)
      .then((s) => { if (!cancelled) { setStats(s); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [token]);

  if (error) return <><PageHead title="Formules et revenus" /><div className="pil-card pil-error">{error}</div></>;
  if (!stats) return <><PageHead title="Formules et revenus" /><div className="pil-loading">Chargement…</div></>;

  const { free, pro } = stats.plans;
  const total = free + pro;
  const proCompanies = stats.companies.filter((c) => c.plan === 'pro');
  const freeCompanies = stats.companies.filter((c) => c.plan !== 'pro');
  const proEmployees = proCompanies.reduce((s, c) => s + c.employees, 0);
  const estimate = proEmployees * PRO_PRICE;
  const limit = stats.free_limit;

  return (
    <>
      <PageHead title="Formules et revenus" sub={`Gratuit jusqu’à ${limit} salariés · Pro ${fmtEuro(PRO_PRICE)} HT par salarié actif et par mois`} />

      <div className="pil-kpis">
        <Kpi icon="store" label="Formule gratuite" value={free} delta={total ? `${Math.round((free / total) * 100)} % des entreprises` : '—'} muted />
        <Kpi icon="crown" label="Formule Pro" value={pro} delta={total ? `${Math.round((pro / total) * 100)} % des entreprises` : '—'} />
        <Kpi icon="euro" label="Revenu mensuel estimé" value={fmtEuro(estimate)} delta={`${plural(proEmployees, 'salarié')} en Pro × ${fmtEuro(PRO_PRICE)}`} />
        <Kpi icon="euro" label="Revenus encaissés" value="—" delta="dès que Stripe sera branché" muted />
      </div>

      <div className="pil-row">
        <section className="pil-card">
          <CardHead title="Répartition" sub={`${plural(total, 'entreprise')} au total`} />
          <div className="pil-bar pil-bar--big" aria-hidden="true">
            {free > 0 && <div className="pil-bar-free" style={{ flex: free }} />}
            {pro > 0 && <div className="pil-bar-pro" style={{ flex: pro }} />}
          </div>
          <div className="pil-legend">
            <span><i className="pil-sw pil-sw--free" />Gratuit <b>{free}</b></span>
            <span><i className="pil-sw pil-sw--pro" />Pro <b>{pro}</b></span>
          </div>
        </section>

        <section className="pil-card">
          <CardHead title="Proches de la limite gratuite" sub={`${limit - 1} salariés ou plus : bientôt concernées par la formule Pro`} />
          {stats.near_limit.length === 0
            ? <p className="pil-empty">Aucune pour l'instant.</p>
            : (
              <ul className="pil-usage">
                {stats.near_limit.map((c) => (
                  <li key={c.id}><Link to={`/pilotage/entreprises/${c.id}`} className="pil-row-link">{c.name}</Link><b>{c.employees} / {limit}</b></li>
                ))}
              </ul>
            )}
        </section>
      </div>

      <section className="pil-card">
        <CardHead title="Entreprises en Pro" sub={pro ? `${plural(proEmployees, 'salarié')} facturé${proEmployees > 1 ? 's' : ''}` : 'Aucune pour l’instant'} />
        {proCompanies.length > 0 && <CompaniesTable companies={proCompanies} />}
      </section>

      <section className="pil-card">
        <CardHead title="Entreprises en formule gratuite" sub={plural(freeCompanies.length, 'entreprise')} />
        {freeCompanies.length > 0
          ? <CompaniesTable companies={freeCompanies} />
          : <p className="pil-empty">Aucune.</p>}
      </section>
    </>
  );
}
