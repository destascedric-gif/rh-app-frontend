import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats } from '../../api/owner';
import { PageHead, CardHead, Kpi, CompaniesTable } from './PilotageUi';
import { fmtEuro, plural, isPaying, pricingLine } from './pilotageUtils';

// Formules et revenus (tarifs du 13 nov. 2026) : qui est gratuit, qui
// paierait, et combien. Rien n'est encore encaissé (pas de paiement en
// ligne) : les montants sont ceux que les entreprises paieraient.
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

  const p = stats.pricing;
  const paying = stats.companies.filter(isPaying);
  const free = stats.companies.filter((c) => !isPaying(c));
  const inTrial = paying.filter((c) => c.billing_state === 'essai');
  const offered = free.filter((c) => c.billing_state === 'offert');
  const total = stats.companies.length;
  const sum = (list) => list.reduce((s, c) => s + c.price_month, 0);
  const estimate = sum(paying);
  const trialPart = sum(inTrial);

  return (
    <>
      <PageHead title="Formules et revenus" sub={pricingLine(p)} />

      <div className="pil-kpis">
        <Kpi icon="store" label="Gratuites" value={free.length}
          delta={offered.length ? `dont ${plural(offered.length, 'offerte')} pour toujours` : `${p.freeEmployees} salariés ou moins`} muted />
        <Kpi icon="crown" label="Payantes" value={paying.length}
          delta={inTrial.length ? `dont ${inTrial.length} encore en essai` : total ? `${Math.round((paying.length / total) * 100)} % des entreprises` : '—'} />
        <Kpi icon="euro" label="Revenu mensuel estimé" value={fmtEuro(estimate)}
          delta={trialPart > 0 ? `dont ${fmtEuro(trialPart)} d'entreprises encore en essai` : 'ce que paieraient les entreprises'} />
        <Kpi icon="euro" label="Revenus encaissés" value="—" delta="pas encore de paiement en ligne" muted />
      </div>

      <div className="pil-row">
        <section className="pil-card">
          <CardHead title="Répartition" sub={`${plural(total, 'entreprise')} au total`} />
          <div className="pil-bar pil-bar--big" aria-hidden="true">
            {free.length > 0 && <div className="pil-bar-free" style={{ flex: free.length }} />}
            {paying.length > 0 && <div className="pil-bar-pro" style={{ flex: paying.length }} />}
          </div>
          <div className="pil-legend">
            <span><i className="pil-sw pil-sw--free" />Gratuites <b>{free.length}</b></span>
            <span><i className="pil-sw pil-sw--pro" />Payantes <b>{paying.length}</b></span>
          </div>
        </section>

        <section className="pil-card">
          <CardHead title="Bientôt payantes" sub={`${p.freeEmployees} salariés : le prochain rend l'abonnement payant`} />
          {stats.near_limit.length === 0
            ? <p className="pil-empty">Aucune pour l'instant.</p>
            : (
              <ul className="pil-usage">
                {stats.near_limit.map((c) => (
                  <li key={c.id}><Link to={`/pilotage/entreprises/${c.id}`} className="pil-row-link">{c.name}</Link><b>{c.employees} salariés</b></li>
                ))}
              </ul>
            )}
        </section>
      </div>

      <section className="pil-card">
        <CardHead title="Entreprises payantes" sub={paying.length ? `${fmtEuro(estimate)} HT par mois au total` : 'Aucune pour l’instant'} />
        {paying.length > 0 && <CompaniesTable companies={paying} />}
      </section>

      <section className="pil-card">
        <CardHead title="Entreprises gratuites" sub={plural(free.length, 'entreprise')} />
        {free.length > 0
          ? <CompaniesTable companies={free} />
          : <p className="pil-empty">Aucune.</p>}
      </section>
    </>
  );
}
