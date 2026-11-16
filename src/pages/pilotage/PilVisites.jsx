import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerVisits } from '../../api/owner';
import { PageHead, CardHead, Strip, PeriodSeg, Chart } from './PilotageUi';
import { PERIODS, plural, signupXLabel } from './pilotageUtils';

// Visites du site (11 nov. 2026, maquette validée) : compteur maison des
// pages publiques, sans cookie ni donnée personnelle. Un « visiteur » est
// compté une fois par jour (on ne suit personne d'un jour à l'autre).

const SOURCE_LABELS = {
  instagram: 'Instagram',
  google: 'Google',
  bing: 'Bing',
  facebook: 'Facebook',
  carte: 'Cartes de visite (QR)',
  direct: 'Accès direct',
  lien: 'Autre lien marqué',
  autre: 'Autres sites',
};
const PAGE_LABELS = {
  '/': 'Accueil',
  '/tarifs': 'Tarifs',
  '/contact': 'Contact',
  '/login': 'Connexion',
  '/setup/admin': 'Créer mon espace',
  '/setup/company': 'Création de l’entreprise',
  '/mot-de-passe-oublie': 'Mot de passe oublié',
  '/mentions-legales': 'Mentions légales',
  '/cgu': 'CGU',
  '/cgv': 'CGV',
  '/confidentialite': 'Confidentialité',
  '/dpa': 'Sous-traitance (DPA)',
};
const pct = (part, whole) => (whole ? `${(Math.round((part / whole) * 1000) / 10).toLocaleString('fr-FR')} %` : '—');

function HBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="pil-hbars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="pil-hbars-label">{r.label}</span>
          <span className="pil-hbars-bar"><span style={{ width: `${(r.count / max) * 100}%` }} /></span>
          <b>{r.count}</b>
        </li>
      ))}
    </ul>
  );
}

export default function PilVisites() {
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [allPages, setAllPages] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOwnerVisits(days, token)
      .then((d) => { if (!cancelled) { setData(d); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [days, token]);

  const period = PERIODS.find((p) => p.days === days);
  const monthly = days === 365;
  const t = data?.totals;
  const growth = t && t.previous_views ? Math.round(((t.views - t.previous_views) / t.previous_views) * 100) : null;
  const phones = data?.devices.find((d) => d.device === 'telephone')?.count ?? 0;
  const computers = data?.devices.find((d) => d.device === 'ordinateur')?.count ?? 0;
  const pages = data ? data.pages.map((p) => ({ label: PAGE_LABELS[p.path] ?? p.path, count: p.count })) : [];

  // Version compacte (16 nov. 2026, proposition A choisie par Cédric) :
  // parcours « visiteur → inscription » dans le bandeau, graphique moins
  // haut, sources / pages / appareils côte à côte
  return (
    <>
      <PageHead
        title="Visites du site"
        infoWidth={460}
        info={(
          <>
            <p>Pages publiques de myorgaly.fr (accueil, tarifs, contact, inscription, connexion, pages légales). Sans cookie et sans donnée personnelle : rien à faire accepter aux visiteurs. Un visiteur est compté une fois par jour ; vos propres visites ne sont pas comptées.</p>
            <p>Pour savoir d’où viennent vos visiteurs, diffusez des liens marqués : <b>myorgaly.fr/carte</b> (QR des cartes de visite), <b>myorgaly.fr/insta</b> (bio Instagram), <b>myorgaly.fr/pub</b>. Données gardées {data?.retention_months ?? 13} mois.</p>
          </>
        )}
      >
        <PeriodSeg days={days} onChange={setDays} />
      </PageHead>

      {error && <div className="pil-card pil-error">{error}</div>}
      {!data && !error && <div className="pil-loading">Chargement…</div>}

      {data && (
        <>
          {t.views === 0 && (
            <div className="pil-card pil-note-card">
              Aucune visite enregistrée sur la période : le compteur démarre à la mise en ligne. Vos propres
              visites ne sont pas comptées sur les appareils où vous ouvrez le pilotage.
            </div>
          )}

          <Strip items={[
            { icon: 'pulse', label: 'Pages vues', value: t.views, delta: growth === null ? period.since : `${growth >= 0 ? '+' : ''}${growth} %`, muted: growth === null },
            { icon: 'users', label: 'Visiteurs', value: t.visitors, delta: t.visitors ? `${(t.views / t.visitors).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} pages chacun` : 'comptés une fois par jour', muted: !t.visitors },
            {
              label: 'Du visiteur au client',
              grow: 1.8,
              children: (
                <div className="pil-flow" title={`${t.visitors} visiteurs, ${t.opened_signup} ont ouvert « Créer mon espace », ${t.signups} entreprises créées`}>
                  {t.visitors} <i>→</i> {t.opened_signup} <small>ont ouvert l’inscription</small> <i>→</i> {t.signups} <small className="pil-gold-text">inscrite{t.signups > 1 ? 's' : ''}{t.visitors ? ` (${pct(t.signups, t.visitors)})` : ''}</small>
                </div>
              ),
            },
            { icon: 'mail', label: 'Venus des cartes', value: t.from_cards, delta: 'QR code', muted: !t.from_cards },
          ]} />

          <section className="pil-card">
            <CardHead title="Visiteurs" sub={monthly ? 'par mois, 12 derniers mois' : `par jour, ${days} derniers jours`} />
            <Chart
              series={data.series.map((s) => ({ bucket: s.bucket, value: s.visitors, views: s.views }))}
              width={1150}
              height={140}
              xLabel={signupXLabel(monthly)}
              tip={(p) => `${signupXLabel(monthly)(p.bucket)} · ${plural(p.value, 'visiteur')} · ${p.views} page${p.views > 1 ? 's' : ''} vue${p.views > 1 ? 's' : ''}`}
              ariaLabel="Courbe des visiteurs"
            />
          </section>

          <div className="pil-row--3">
            <section className="pil-card">
              <CardHead title="D’où viennent-ils ?" />
              {data.sources.length === 0
                ? <p className="pil-empty">Rien pour l’instant.</p>
                : <HBars rows={data.sources.map((s) => ({ label: SOURCE_LABELS[s.source] ?? s.source, count: s.count }))} />}
            </section>
            <section className="pil-card">
              <CardHead title="Pages les plus vues">
                {pages.length > 5 && (
                  <button type="button" className="pil-more" onClick={() => setAllPages((v) => !v)}>{allPages ? 'Moins ‹' : `Tout (${pages.length}) ›`}</button>
                )}
              </CardHead>
              {pages.length === 0
                ? <p className="pil-empty">Rien pour l’instant.</p>
                : <HBars rows={allPages ? pages : pages.slice(0, 5)} />}
            </section>
            <section className="pil-card">
              <CardHead title="Appareils" />
              {phones + computers === 0 ? (
                <p className="pil-empty">Rien pour l’instant.</p>
              ) : (
                <>
                  <div className="pil-bar" aria-hidden="true" style={{ margin: '8px 0 10px', height: 10 }}>
                    {phones > 0 && <div className="pil-bar-pro" style={{ flex: phones }} />}
                    {computers > 0 && <div className="pil-bar-free" style={{ flex: computers }} />}
                  </div>
                  <div className="pil-legend">
                    <span><i className="pil-sw pil-sw--pro" />Téléphone <b>{pct(phones, phones + computers)}</b></span>
                    <span><i className="pil-sw pil-sw--free" />Ordinateur <b>{pct(computers, phones + computers)}</b></span>
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
