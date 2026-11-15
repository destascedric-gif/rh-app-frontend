import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats, getOwnerHealth, getOwnerAi } from '../../api/owner';
import { Link } from 'react-router-dom';
import {
  PageHead, CardHead, Kpi, PeriodSeg, Chart, CompaniesTable, JournalCard, HealthRows, Icon,
} from './PilotageUi';
import { PERIODS, STALE_DAYS, isStale, isPaying, fmtEuro, plural, signupXLabel } from './pilotageUtils';

// Tableau de bord : un résumé de chaque rubrique ; chaque carte mène à
// sa page de détail. Uniquement des chiffres globaux, jamais le contenu
// des comptes clients.

export default function Pilotage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [health, setHealth] = useState(null);
  const [down, setDown] = useState(false);
  // Crédit IA estimé : alerte en haut du tableau de bord quand il est bas
  const [aiCredit, setAiCredit] = useState(null);

  useEffect(() => {
    getOwnerAi(30, token).then((d) => setAiCredit(d.credit)).catch(() => {});
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    getOwnerStats(days, token)
      .then((s) => { if (!cancelled) { setStats(s); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [days, token]);

  useEffect(() => {
    let cancelled = false;
    const load = () => getOwnerHealth(token)
      .then((d) => { if (!cancelled) { setHealth(d); setDown(false); } })
      .catch(() => { if (!cancelled) setDown(true); });
    load();
    const id = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  const period = PERIODS.find((p) => p.days === days);
  const t = stats?.totals;
  const total = stats ? stats.companies.length : 0;
  const paying = stats ? stats.companies.filter(isPaying) : [];
  const freeCount = total - paying.length;
  const estimate = paying.reduce((s, c) => s + c.price_month, 0);
  const toFollow = stats ? stats.companies.filter((c) => isStale(c.last_activity)).length : 0;
  const monthly = days === 365;

  return (
    <>
      <PageHead title="Tableau de bord" sub={`Bonjour ${user?.firstName || 'Cédric'}, voici l’essentiel d’Orgaly. Cliquez sur une carte pour le détail.`}>
        <PeriodSeg days={days} onChange={setDays} />
      </PageHead>

      {aiCredit && aiCredit.balance !== null && aiCredit.balance < aiCredit.alert_usd && (
        <div className="pil-card pil-alert">
          <span><Icon name="alert" />Crédit IA bas : environ {aiCredit.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $ restants. Pensez à recharger sur la Console Claude.</span>
          <Link to="/pilotage/ia" className="pil-more">Voir le détail<Icon name="arrow" size={13} /></Link>
        </div>
      )}

      {error && <div className="pil-card pil-error">{error}</div>}
      {!stats && !error && <div className="pil-loading">Chargement…</div>}

      {stats && (
        <>
          <div className="pil-kpis">
            <Kpi to="/pilotage/entreprises" icon="store" label="Entreprises inscrites" value={t.companies} delta={`+${t.new_companies} ${period.since}`} />
            <Kpi to="/pilotage/entreprises" icon="users" label="Salariés actifs" value={t.employees} delta={`+${t.new_employees} ${period.since}`} />
            <Kpi to="/pilotage/formules" icon="crown" label="Entreprises payantes" value={paying.length} delta={total ? `${Math.round((paying.length / total) * 100)} % des entreprises` : '—'} />
            <Kpi to="/pilotage/formules" icon="euro" label="Revenu mensuel estimé" value={fmtEuro(estimate)} delta="rien n'est encore encaissé" muted />
          </div>

          <div className="pil-row">
            <section className="pil-card">
              <CardHead
                title="Nouvelles inscriptions"
                sub={`Entreprises créées ${monthly ? 'par mois, 12 derniers mois' : `par jour, ${days} derniers jours`}`}
                to="/pilotage/entreprises"
                linkLabel="Les entreprises"
              />
              <Chart
                series={stats.series.map((s) => ({ bucket: s.bucket, value: s.count }))}
                xLabel={signupXLabel(monthly)}
                tip={(p) => `${signupXLabel(monthly)(p.bucket)} · ${plural(p.value, 'inscription')}`}
                ariaLabel="Courbe des inscriptions"
              />
            </section>

            <section className="pil-card">
              <CardHead title="Formules" sub={`${plural(total, 'entreprise')} au total`} to="/pilotage/formules" />
              <div className="pil-bar" aria-hidden="true">
                {freeCount > 0 && <div className="pil-bar-free" style={{ flex: freeCount }} />}
                {paying.length > 0 && <div className="pil-bar-pro" style={{ flex: paying.length }} />}
              </div>
              <div className="pil-legend">
                <span><i className="pil-sw pil-sw--free" />Gratuites <b>{freeCount}</b></span>
                <span><i className="pil-sw pil-sw--pro" />Payantes <b>{paying.length}</b></span>
              </div>
              <p className="pil-sub pil-sub--spaced">Bientôt payantes ({stats.pricing.freeEmployees} salariés, le prochain rend l'abonnement payant)</p>
              {stats.near_limit.length === 0
                ? <p className="pil-empty">Aucune pour l'instant.</p>
                : (
                  <ul className="pil-near">
                    {stats.near_limit.map((c) => (
                      <li key={c.id}>
                        <button type="button" className="pil-link-plain" onClick={() => navigate(`/pilotage/entreprises/${c.id}`)}>{c.name}</button>
                        {' · '}<b>{c.employees}</b> salariés
                      </li>
                    ))}
                  </ul>
                )}
            </section>
          </div>

          <section className="pil-card">
            <CardHead
              title="Activité des entreprises"
              sub={`Les plus actives en premier · ${toFollow > 0 ? `${plural(toFollow, 'entreprise')} à relancer (sans activité depuis ${STALE_DAYS} jours)` : 'aucune à relancer'}`}
              to="/pilotage/entreprises"
              linkLabel={`Toutes les entreprises (${stats.companies.length})`}
            />
            {stats.companies.length === 0
              ? <p className="pil-empty">Aucune entreprise inscrite pour l'instant.</p>
              : <CompaniesTable companies={stats.companies.slice(0, 5)} />}
          </section>

          <div className="pil-row">
            <JournalCard token={token} compact to="/pilotage/journal" sub="Les dernières actions, sans le contenu" />
            <section className="pil-card">
              <CardHead title="Santé technique" sub="Dernières 24 heures" to="/pilotage/sante" />
              <HealthRows h={health} down={down} onShowErrors={() => navigate('/pilotage/journal?statut=erreurs')} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
