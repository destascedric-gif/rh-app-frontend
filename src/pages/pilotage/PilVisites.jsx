import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerVisits } from '../../api/owner';
import { PageHead, CardHead, Kpi, PeriodSeg, Chart } from './PilotageUi';
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

  return (
    <>
      <PageHead title="Visites du site" sub="Pages publiques de myorgaly.fr (accueil, inscription, connexion, pages légales). Sans cookie et sans donnée personnelle : rien à faire accepter aux visiteurs.">
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

          <div className="pil-kpis">
            <Kpi
              icon="pulse" label="Pages vues" value={t.views}
              delta={growth === null ? period.since : `${growth >= 0 ? '+' : ''}${growth} % par rapport à la période d’avant`}
              muted={growth === null}
            />
            <Kpi icon="users" label="Visiteurs" value={t.visitors} delta={t.visitors ? `${(t.views / t.visitors).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} page${t.views / t.visitors >= 2 ? 's' : ''} vue${t.views / t.visitors >= 2 ? 's' : ''} par visiteur` : 'comptés une fois par jour'} muted={!t.visitors} />
            <Kpi icon="store" label="Entreprises inscrites" value={t.signups} delta={t.visitors ? `${pct(t.signups, t.visitors)} des visiteurs` : period.since} muted={!t.visitors} />
            <Kpi icon="mail" label="Venus de vos cartes" value={t.from_cards} delta="QR code des cartes de visite" muted={!t.from_cards} />
          </div>

          <section className="pil-card">
            <CardHead title="Visiteurs" sub={monthly ? 'Par mois, 12 derniers mois' : `Par jour, ${days} derniers jours`} />
            <Chart
              series={data.series.map((s) => ({ bucket: s.bucket, value: s.visitors, views: s.views }))}
              width={900}
              height={210}
              xLabel={signupXLabel(monthly)}
              tip={(p) => `${signupXLabel(monthly)(p.bucket)} · ${plural(p.value, 'visiteur')} · ${p.views} page${p.views > 1 ? 's' : ''} vue${p.views > 1 ? 's' : ''}`}
              ariaLabel="Courbe des visiteurs"
            />
          </section>

          <div className="pil-row pil-row--even">
            <section className="pil-card">
              <CardHead title="D’où viennent-ils ?" sub="Visiteurs, selon le lien qu’ils ont suivi" />
              {data.sources.length === 0
                ? <p className="pil-empty">Rien pour l’instant.</p>
                : <HBars rows={data.sources.map((s) => ({ label: SOURCE_LABELS[s.source] ?? s.source, count: s.count }))} />}
            </section>
            <section className="pil-card">
              <CardHead title="Pages les plus vues" sub="Nombre de vues" />
              {data.pages.length === 0
                ? <p className="pil-empty">Rien pour l’instant.</p>
                : <HBars rows={data.pages.map((p) => ({ label: PAGE_LABELS[p.path] ?? p.path, count: p.count }))} />}
            </section>
          </div>

          <div className="pil-row pil-row--even">
            <section className="pil-card">
              <CardHead title="Du visiteur au client" sub={days === 365 ? '12 derniers mois' : `${days} derniers jours`} />
              <div className="pil-funnel">
                {[
                  ['Visiteurs', t.visitors, null],
                  ['Ont ouvert « Créer mon espace »', t.opened_signup, pct(t.opened_signup, t.visitors)],
                  ['Entreprises créées', t.signups, pct(t.signups, t.visitors)],
                ].map(([label, value, share]) => (
                  <div key={label} className="pil-funnel-step">
                    <div>
                      <div className="pil-funnel-label">{label}</div>
                      <div className="pil-meter pil-meter--big">
                        <div className="pil-meter--ok" style={{ width: `${t.visitors ? Math.max(1.5, (value / t.visitors) * 100) : 0}%` }} />
                      </div>
                    </div>
                    <div className="pil-funnel-value">{value}{share && <span>{share}</span>}</div>
                  </div>
                ))}
              </div>
            </section>
            <section className="pil-card">
              <CardHead title="Téléphone ou ordinateur" sub="Appareil des visiteurs" />
              {phones + computers === 0 ? (
                <p className="pil-empty">Rien pour l’instant.</p>
              ) : (
                <>
                  <div className="pil-bar pil-bar--big" aria-hidden="true">
                    {phones > 0 && <div className="pil-bar-pro" style={{ flex: phones }} />}
                    {computers > 0 && <div className="pil-bar-free" style={{ flex: computers }} />}
                  </div>
                  <div className="pil-legend">
                    <span><i className="pil-sw pil-sw--pro" />Téléphone <b>{pct(phones, phones + computers)}</b></span>
                    <span><i className="pil-sw pil-sw--free" />Ordinateur <b>{pct(computers, phones + computers)}</b></span>
                  </div>
                </>
              )}
              <p className="pil-note">
                Pour savoir d’où viennent vos visiteurs, diffusez des liens marqués : <b>myorgaly.fr/?src=carte</b> (QR
                des cartes de visite), <b>myorgaly.fr/?src=insta</b> (bio Instagram). Données gardées {data.retention_months} mois.
              </p>
            </section>
          </div>
        </>
      )}
    </>
  );
}
