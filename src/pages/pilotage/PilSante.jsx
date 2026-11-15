import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerHealth, getOwnerHealthHistory } from '../../api/owner';
import { PageHead, CardHead, Chart, Kpi, HealthRows, JournalCard } from './PilotageUi';
import { plural, fmtLongDate } from './pilotageUtils';

// Santé technique : état du serveur, historique (24 h heure par heure, puis
// 7 / 30 / 90 jours jour par jour), erreurs
const hourLabel = (iso) => `${new Date(iso).getHours()} h`;
const dayLabel = (b) => new Date(`${b}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const longDay = (b) => new Date(`${b}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const pct = (v) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;

const RANGES = [
  { key: 1, label: '24 heures' },
  { key: 7, label: '7 jours' },
  { key: 30, label: '30 jours' },
  { key: 90, label: '90 jours' },
];

export default function PilSante() {
  const { token } = useAuth();
  const [h, setH] = useState(null);
  const [down, setDown] = useState(false);
  const [range, setRange] = useState(1);
  // Historique chargé : { range, data } (data = { error: true } en cas d'échec)
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => getOwnerHealth(token)
      .then((d) => { if (!cancelled) { setH(d); setDown(false); } })
      .catch(() => { if (!cancelled) setDown(true); });
    load();
    const id = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  useEffect(() => {
    if (range === 1) return undefined;
    let cancelled = false;
    getOwnerHealthHistory(range, token)
      .then((d) => { if (!cancelled) setLoaded({ range, data: d }); })
      .catch(() => { if (!cancelled) setLoaded({ range, data: { error: true } }); });
    return () => { cancelled = true; };
  }, [range, token]);

  const hist = loaded?.range === range ? loaded.data : null;
  const series = h?.series ?? [];
  const t = hist?.totals;
  const days = hist?.series ?? [];
  const noMeasure = (v) => v === null || v === undefined;

  return (
    <>
      <PageHead title="Santé technique" sub="Est-ce qu’Orgaly fonctionne bien ? État mis à jour chaque minute, historique jusqu’à 90 jours.">
        <div className="pil-seg" role="group" aria-label="Période">
          {RANGES.map((r) => (
            <button key={r.key} type="button" className={r.key === range ? 'on' : ''} aria-pressed={r.key === range} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </PageHead>

      <div className="pil-row">
        <section className="pil-card">
          <CardHead title="État actuel" sub="Dernières 24 heures" />
          <HealthRows h={h} down={down} onShowErrors={() => document.getElementById('pil-journal')?.scrollIntoView({ behavior: 'smooth' })} />
        </section>
        <section className="pil-card pil-help">
          <h2>Comment lire cette page</h2>
          <ul>
            <li><b>Disponibilité</b> : la part du temps où le serveur répondait (il se contrôle toutes les 5 minutes). 100 % = aucune coupure.</li>
            <li><b>Temps de réponse</b> : le temps que met le serveur à répondre. En dessous de 500 ms, c’est rapide ; au-dessus de 1,5 s, les clients le sentent.</li>
            <li><b>Erreurs du serveur</b> : des actions qui ont échoué à cause d’Orgaly (pas de l’utilisateur). Le détail technique est dans Sentry.</li>
            <li><b>Redémarrages</b> : surtout vos mises en ligne (chaque <i>push</i>) ; beaucoup sans mise en ligne = le serveur plante.</li>
            <li><b>E-mails</b> : Brevo, dans son offre gratuite, en envoie 300 par jour au maximum.</li>
          </ul>
        </section>
      </div>

      {range === 1 && h && !down && (
        <div className="pil-row pil-row--even">
          <section className="pil-card">
            <CardHead title="Requêtes par heure" sub="Nombre de demandes reçues par le serveur" />
            <Chart
              type="bar"
              series={series.map((s) => ({ bucket: s.hour, value: s.count }))}
              xLabel={hourLabel}
              tip={(p) => `${hourLabel(p.bucket)} · ${plural(p.value, 'requête')}`}
              ariaLabel="Requêtes par heure"
              height={180}
            />
          </section>
          <section className="pil-card">
            <CardHead title="Temps de réponse par heure" sub="Moyenne, en millisecondes" />
            <Chart
              type="bar"
              series={series.map((s) => ({ bucket: s.hour, value: s.avg_ms ?? 0 }))}
              xLabel={hourLabel}
              tip={(p) => `${hourLabel(p.bucket)} · ${p.value ? `${p.value} ms` : 'aucune requête'}`}
              ariaLabel="Temps de réponse par heure"
              height={180}
            />
          </section>
        </div>
      )}

      {range !== 1 && !hist && <div className="pil-loading">Chargement…</div>}
      {range !== 1 && hist?.error && <div className="pil-card pil-error">Historique indisponible pour le moment.</div>}

      {range !== 1 && t && (
        <>
          <div className="pil-kpis">
            <Kpi icon="check" label="Disponibilité" value={t.availability === null ? '—' : pct(t.availability)}
              delta={t.availability === null ? 'pas encore assez de mesures' : 'moyenne des jours mesurés'} muted />
            <Kpi icon="clock" label="Temps de réponse moyen" value={t.avg_ms === null ? '—' : `${t.avg_ms} ms`}
              delta={t.requests ? `${plural(t.requests, 'requête')} · ${t.slow} lente${t.slow > 1 ? 's' : ''} (1,5 s et plus)` : 'aucune mesure'} muted />
            <Kpi icon="alert" label="Erreurs du serveur" value={t.errors}
              delta={t.errors === 0 ? 'aucune sur la période' : `sur ${range} jours`} muted />
            <Kpi icon="mail" label="E-mails envoyés" value={t.emails}
              delta={`${t.restarts} redémarrage${t.restarts > 1 ? 's' : ''} du serveur${t.email_errors > 0 ? ` · ${t.email_errors} e-mail${t.email_errors > 1 ? 's' : ''} en échec` : ''}`} muted />
          </div>

          <p className="pil-note">
            {hist.since
              ? `Rapidité, disponibilité et redémarrages mesurés depuis le ${fmtLongDate(hist.since)} ; erreurs et e-mails depuis le début du journal (gardé 90 jours).`
              : 'Rapidité, disponibilité et redémarrages : les mesures commencent à la prochaine mise en ligne du serveur. Erreurs et e-mails : depuis le début du journal (gardé 90 jours).'}
          </p>

          <div className="pil-row pil-row--even">
            <section className="pil-card">
              <CardHead title="Disponibilité par jour" sub="Part du temps où le serveur répondait" />
              <Chart
                type="bar"
                series={days.map((d) => ({ bucket: d.bucket, value: d.availability ?? 0, raw: d.availability }))}
                xLabel={dayLabel}
                tip={(p) => `${longDay(p.bucket)} · ${noMeasure(p.raw) ? 'pas encore mesuré' : pct(p.raw)}`}
                ariaLabel="Disponibilité par jour"
                height={180}
              />
            </section>
            <section className="pil-card">
              <CardHead title="Temps de réponse par jour" sub="Moyenne, en millisecondes" />
              <Chart
                type="bar"
                series={days.map((d) => ({ bucket: d.bucket, value: d.avg_ms ?? 0, raw: d.avg_ms }))}
                xLabel={dayLabel}
                tip={(p) => `${longDay(p.bucket)} · ${noMeasure(p.raw) ? 'pas encore mesuré' : `${p.raw} ms`}`}
                ariaLabel="Temps de réponse par jour"
                height={180}
              />
            </section>
            <section className="pil-card">
              <CardHead title="Requêtes par jour" sub="Nombre de demandes reçues par le serveur" />
              <Chart
                type="bar"
                series={days.map((d) => ({ bucket: d.bucket, value: d.requests ?? 0, raw: d.requests, restarts: d.restarts }))}
                xLabel={dayLabel}
                tip={(p) => `${longDay(p.bucket)} · ${noMeasure(p.raw) ? 'pas encore mesuré' : `${plural(p.raw, 'requête')}${p.restarts ? ` · ${p.restarts} redémarrage${p.restarts > 1 ? 's' : ''}` : ''}`}`}
                ariaLabel="Requêtes par jour"
                height={180}
              />
            </section>
            <section className="pil-card">
              <CardHead title="Erreurs du serveur par jour" sub="Actions qui ont échoué à cause d’Orgaly" />
              <Chart
                type="bar"
                series={days.map((d) => ({ bucket: d.bucket, value: d.errors, emails: d.emails }))}
                xLabel={dayLabel}
                tip={(p) => `${longDay(p.bucket)} · ${plural(p.value, 'erreur')} · ${p.emails} e-mail${p.emails > 1 ? 's' : ''} envoyé${p.emails > 1 ? 's' : ''}`}
                ariaLabel="Erreurs du serveur par jour"
                height={180}
              />
            </section>
          </div>
        </>
      )}

      <JournalCard token={token} status="error" onStatus={() => {}} title="Dernières erreurs du serveur" sub="Uniquement les actions en erreur" pageSize={50} hideFilters />
    </>
  );
}
