import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats, getOwnerHealth, getOwnerAi, getOwnerVisits } from '../../api/owner';
import {
  PageHead, CardHead, PeriodSeg, Strip, Spark, JournalCard, HealthMini, ActivityStatus, Icon,
} from './PilotageUi';
import { PERIODS, isStale, isPaying, fmtEuro, fmtDate, plural } from './pilotageUtils';

// Tableau de bord (16 nov. 2026, proposition A choisie par Cédric) : les
// chiffres clés sur une ligne, puis six petites tuiles, une par rubrique,
// chacune avec un bouton « Détails » vers sa page. Uniquement des chiffres
// globaux, jamais le contenu des comptes clients.

const SOURCE_LABELS = { instagram: 'Instagram', google: 'Google', bing: 'Bing', facebook: 'Facebook', carte: 'cartes de visite', direct: 'accès direct', lien: 'lien marqué', autre: 'autres sites' };

export default function Pilotage() {
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [health, setHealth] = useState(null);
  const [down, setDown] = useState(false);
  // Crédit IA estimé : alerte en haut du tableau de bord quand il est bas
  const [aiCredit, setAiCredit] = useState(null);
  // Visites du site sur les 7 derniers jours (toujours la semaine, quelle
  // que soit la période choisie en haut)
  const [visits, setVisits] = useState(null);

  useEffect(() => {
    getOwnerVisits(7, token).then(setVisits).catch(() => {});
  }, [token]);

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
  const since = period.since.replace('jours', 'j');
  const t = stats?.totals;
  const companies = stats?.companies ?? [];
  const total = companies.length;
  const paying = companies.filter(isPaying);
  const freeCount = total - paying.length;
  const estimate = paying.reduce((s, c) => s + c.price_month, 0);
  const toFollow = companies.filter((c) => isStale(c.last_activity)).length;
  const latest = [...companies].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const topSource = visits?.sources?.[0];
  const phones = visits?.devices?.find((d) => d.device === 'telephone')?.count ?? 0;
  const computers = visits?.devices?.find((d) => d.device === 'ordinateur')?.count ?? 0;
  const phoneShare = phones + computers ? Math.round((phones / (phones + computers)) * 100) : null;

  return (
    <>
      <PageHead
        title="Tableau de bord"
        info={<p>L’essentiel d’Orgaly en un coup d’œil : chaque tuile mène à sa page avec « Détails ». Uniquement des chiffres, jamais le contenu des comptes clients. La période (en haut à droite) vaut pour les inscriptions ; les visites sont toujours celles des 7 derniers jours.</p>}
      >
        <PeriodSeg days={days} onChange={setDays} />
      </PageHead>

      {aiCredit && aiCredit.balance !== null && aiCredit.balance < aiCredit.alert_usd && (
        <div className="pil-card pil-alert">
          <span><Icon name="alert" />Crédit IA bas : environ {aiCredit.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $ restants. Pensez à recharger sur la Console Claude.</span>
          <Link to="/pilotage/ia" className="pil-more">Détails ›</Link>
        </div>
      )}

      {error && <div className="pil-card pil-error">{error}</div>}
      {!stats && !error && <div className="pil-loading">Chargement…</div>}

      {stats && (
        <>
          <Strip items={[
            { icon: 'store', label: 'Entreprises', value: t.companies, delta: `+${t.new_companies} ${since}`, to: '/pilotage/entreprises' },
            { icon: 'users', label: 'Salariés actifs', value: t.employees, delta: `+${t.new_employees} ${since}`, to: '/pilotage/entreprises' },
            { icon: 'crown', label: 'Payantes', value: paying.length, delta: total ? `${Math.round((paying.length / total) * 100)} %` : '—', to: '/pilotage/formules' },
            { icon: 'euro', label: 'Revenu mensuel estimé', value: fmtEuro(estimate), delta: 'rien d’encaissé', muted: true, to: '/pilotage/formules' },
            { icon: 'eye', label: 'Visiteurs (7 j)', value: visits ? visits.totals.visitors : '—', delta: visits ? `${visits.totals.views} pages` : '', to: '/pilotage/visites' },
          ]} />

          <div className="pil-tiles">
            <section className="pil-card">
              <CardHead title="Inscriptions" sub={period.label} to="/pilotage/entreprises" />
              <div className="pil-tile-big">
                <b>+{t.new_companies}</b>
                <Spark values={stats.series.map((s) => s.count)} />
              </div>
              <p className="pil-note">{latest ? `Dernière : ${latest.name}, le ${fmtDate(latest.created_at)}` : 'Aucune entreprise pour l’instant'}</p>
            </section>

            <section className="pil-card">
              <CardHead title="Formules" to="/pilotage/formules" />
              <div className="pil-bar" aria-hidden="true">
                {freeCount > 0 && <div className="pil-bar-free" style={{ flex: freeCount }} />}
                {paying.length > 0 && <div className="pil-bar-pro" style={{ flex: paying.length }} />}
              </div>
              <div className="pil-legend">
                <span><i className="pil-sw pil-sw--free" />Gratuites <b>{freeCount}</b></span>
                <span><i className="pil-sw pil-sw--pro" />Payantes <b>{paying.length}</b></span>
              </div>
              <p className="pil-note">
                {stats.near_limit.length === 0
                  ? 'Aucune entreprise bientôt payante'
                  : `Bientôt payante${stats.near_limit.length > 1 ? 's' : ''} : ${stats.near_limit.map((c) => `${c.name} (${c.employees} salariés)`).join(', ')}`}
              </p>
            </section>

            <section className="pil-card">
              <CardHead title="Visites" sub="7 jours" to="/pilotage/visites" />
              {visits ? (
                <>
                  <div className="pil-tile-big">
                    <b>{visits.totals.visitors}</b>
                    <Spark type="bar" values={visits.series.map((s) => s.visitors)} />
                  </div>
                  <p className="pil-note">
                    {topSource ? `Surtout ${SOURCE_LABELS[topSource.source] ?? topSource.source} (${topSource.count})` : 'Aucune visite cette semaine'}
                    {phoneShare !== null && ` · ${phoneShare} % sur téléphone`}
                  </p>
                </>
              ) : <p className="pil-empty">Chargement…</p>}
            </section>

            <section className="pil-card">
              <CardHead title="Entreprises les plus actives" to="/pilotage/entreprises" linkLabel={`Toutes (${total})`} />
              {total === 0 ? <p className="pil-empty">Aucune entreprise inscrite pour l’instant.</p> : (
                <ul className="pil-mini">
                  {companies.slice(0, 3).map((c) => (
                    <li key={c.id}>
                      <Link to={`/pilotage/entreprises/${c.id}`} className="pil-row-link">{c.name}</Link>
                      {c.ai_planning_enabled
                        ? <span className="pil-ai-tag pil-ai-tag--on">IA</span>
                        : c.ai_option_requested_at && <span className="pil-ai-tag">IA demandée</span>}
                      <ActivityStatus date={c.last_activity} />
                    </li>
                  ))}
                  {toFollow > 0 && (
                    <li><Link to="/pilotage/entreprises" className="pil-st pil-st--warn"><Icon name="alert" />{plural(toFollow, 'entreprise')} à relancer</Link></li>
                  )}
                </ul>
              )}
            </section>

            <JournalCard token={token} compact initialLimit={4} title="Dernières actions" to="/pilotage/journal" linkLabel="Journal" />

            <section className="pil-card">
              <CardHead title="Santé technique" to="/pilotage/sante" />
              <HealthMini h={health} down={down} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
