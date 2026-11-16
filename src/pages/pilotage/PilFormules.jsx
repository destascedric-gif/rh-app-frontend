import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats } from '../../api/owner';
import { PageHead, Strip, CompaniesTable } from './PilotageUi';
import { fmtEuro, plural, isPaying, pricingLine } from './pilotageUtils';

// Formules et revenus (tarifs du 13 nov. 2026) : qui est gratuit, qui
// paierait, et combien. Rien n'est encore encaissé (pas de paiement en
// ligne) : les montants sont ceux que les entreprises paieraient.
// Version compacte (16 nov. 2026, proposition A choisie par Cédric) :
// bandeau de chiffres, puis un seul tableau à onglets.
export default function PilFormules() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('paying');

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
  const nearIds = new Set(stats.near_limit.map((c) => c.id));
  const near = stats.companies.filter((c) => nearIds.has(c.id));
  const total = stats.companies.length;
  const sum = (list) => list.reduce((s, c) => s + c.price_month, 0);
  const estimate = sum(paying);
  const trialPart = sum(inTrial);

  const TABS = [
    { key: 'paying', label: 'Payantes', list: paying, empty: 'Aucune entreprise payante pour l’instant.' },
    { key: 'free', label: 'Gratuites', list: free, empty: 'Aucune.' },
    { key: 'near', label: 'Bientôt payantes', list: near, empty: `Aucune entreprise à ${p.freeEmployees} salariés pour l’instant.` },
    { key: 'all', label: 'Toutes', list: stats.companies, empty: 'Aucune entreprise inscrite.' },
  ];
  const current = TABS.find((t) => t.key === tab);

  return (
    <>
      <PageHead
        title="Formules et revenus"
        infoWidth={460}
        info={(
          <>
            <p><b>Tarifs</b> : {pricingLine(p)}.</p>
            <p>Les montants sont ceux que les entreprises paieraient : rien n’est encore encaissé (pas de paiement en ligne). « Bientôt payantes » : {p.freeEmployees} salariés, le prochain rend l’abonnement payant.</p>
          </>
        )}
      />

      <Strip items={[
        { icon: 'euro', label: 'Revenu mensuel estimé', value: fmtEuro(estimate), delta: trialPart > 0 ? (trialPart === estimate ? 'tout en essai' : `dont ${fmtEuro(trialPart)} en essai`) : 'HT par mois' },
        { icon: 'crown', label: 'Payantes', value: paying.length, delta: inTrial.length ? `${inTrial.length} en essai` : total ? `${Math.round((paying.length / total) * 100)} %` : '' },
        { icon: 'store', label: 'Gratuites', value: free.length, delta: offered.length ? `dont ${plural(offered.length, 'offerte')}` : `${p.freeEmployees} salariés ou moins`, muted: true },
        {
          label: 'Répartition',
          grow: 1.4,
          children: (
            <div className="pil-bar" aria-label={`${free.length} gratuites, ${paying.length} payantes`}>
              {free.length > 0 && <div className="pil-bar-free" style={{ flex: free.length }} />}
              {paying.length > 0 && <div className="pil-bar-pro" style={{ flex: paying.length }} />}
            </div>
          ),
        },
        { icon: 'euro', label: 'Encaissé', value: '—', delta: 'pas de paiement en ligne', muted: true },
      ]} />

      <section className="pil-card">
        <div className="pil-card-tabs">
          <div className="pil-seg pil-seg--small" role="tablist" aria-label="Entreprises">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={t.key === tab} className={t.key === tab ? 'on' : ''} onClick={() => setTab(t.key)}>
                {t.label}<span className="pil-seg-n">{t.list.length}</span>
              </button>
            ))}
          </div>
        </div>
        {current.list.length > 0
          ? <CompaniesTable companies={current.list} />
          : <p className="pil-empty">{current.empty}</p>}
      </section>
    </>
  );
}
