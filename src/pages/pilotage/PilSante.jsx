import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerHealth, getOwnerHealthHistory } from '../../api/owner';
import { PageHead, CardHead, Chart, Strip, JournalCard } from './PilotageUi';
import { plural, fmtLongDate, healthItems } from './pilotageUtils';

// Santé technique : état du serveur, historique (24 h heure par heure, puis
// 7 / 30 / 90 jours jour par jour), erreurs.
// Version compacte (16 nov. 2026, proposition A choisie par Cédric) : quatre
// voyants sur une ligne, aide derrière le « i », graphiques moins hauts.
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
const CHART_H = 130;

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
  const scrollToErrors = () => document.getElementById('pil-journal')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <PageHead
        title="Santé technique"
        infoWidth={480}
        info={(
          <>
            <p>Est-ce qu’Orgaly fonctionne bien ? État mis à jour chaque minute, historique jusqu’à 90 jours. Vert = tout va bien, orange = à surveiller, rouge = à regarder.</p>
            <ul>
              <li><b>Disponibilité</b> : la part du temps où le serveur répondait (il se contrôle toutes les 5 minutes). 100 % = aucune coupure.</li>
              <li><b>Temps de réponse</b> : le temps que met le serveur à répondre. En dessous de 500 ms, c’est rapide ; au-dessus de 1,5 s, les clients le sentent.</li>
              <li><b>Erreurs du serveur</b> : des actions qui ont échoué à cause d’Orgaly (pas de l’utilisateur). Le détail technique est dans Sentry.</li>
              <li><b>Redémarrages</b> : surtout vos mises en ligne (chaque <i>push</i>) ; beaucoup sans mise en ligne = le serveur plante.</li>
              <li><b>E-mails</b> : Brevo, dans son offre gratuite, en envoie 300 par jour au maximum.</li>
            </ul>
          </>
        )}
      >
        <div className="pil-seg" role="group" aria-label="Période">
          {RANGES.map((r) => (
            <button key={r.key} type="button" className={r.key === range ? 'on' : ''} aria-pressed={r.key === range} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </PageHead>

      {!h && !down && <div className="pil-loading">Chargement…</div>}
      {(h || down) && (
        <Strip items={healthItems(h, down).map((it) => ({
          label: it.label,
          tone: it.tone,
          value: it.value,
          delta: it.detail,
          muted: true,
          onClick: it.key === 'errors' && h?.errors_24h > 0 ? scrollToErrors : undefined,
        }))} />
      )}

      {range === 1 && h && !down && (
        <div className="pil-row pil-row--even">
          <section className="pil-card">
            <CardHead title="Requêtes par heure" sub="demandes reçues par le serveur" />
            <Chart
              type="bar"
              series={series.map((s) => ({ bucket: s.hour, value: s.count }))}
              xLabel={hourLabel}
              tip={(p) => `${hourLabel(p.bucket)} · ${plural(p.value, 'requête')}`}
              ariaLabel="Requêtes par heure"
              height={CHART_H}
            />
          </section>
          <section className="pil-card">
            <CardHead title="Temps de réponse par heure" sub="moyenne, en millisecondes" />
            <Chart
              type="bar"
              series={series.map((s) => ({ bucket: s.hour, value: s.avg_ms ?? 0 }))}
              xLabel={hourLabel}
              tip={(p) => `${hourLabel(p.bucket)} · ${p.value ? `${p.value} ms` : 'aucune requête'}`}
              ariaLabel="Temps de réponse par heure"
              height={CHART_H}
            />
          </section>
        </div>
      )}

      {range !== 1 && !hist && <div className="pil-loading">Chargement…</div>}
      {range !== 1 && hist?.error && <div className="pil-card pil-error">Historique indisponible pour le moment.</div>}

      {range !== 1 && t && (
        <>
          <Strip items={[
            { icon: 'check', label: `Disponibilité (${range} jours)`, value: t.availability === null ? '—' : pct(t.availability), delta: t.availability === null ? 'pas encore assez de mesures' : 'moyenne des jours mesurés', muted: true },
            { icon: 'clock', label: 'Temps de réponse moyen', value: t.avg_ms === null ? '—' : `${t.avg_ms} ms`, delta: t.requests ? `${plural(t.requests, 'requête')} · ${t.slow} lente${t.slow > 1 ? 's' : ''}` : 'aucune mesure', muted: true },
            { icon: 'alert', label: 'Erreurs du serveur', value: t.errors, delta: t.errors === 0 ? 'aucune sur la période' : `sur ${range} jours`, muted: true },
            { icon: 'mail', label: 'E-mails envoyés', value: t.emails, delta: `${t.restarts} redémarrage${t.restarts > 1 ? 's' : ''}${t.email_errors > 0 ? ` · ${t.email_errors} en échec` : ''}`, muted: true },
          ]} />

          <div className="pil-row pil-row--even">
            <section className="pil-card">
              <CardHead title="Disponibilité par jour" sub="part du temps où le serveur répondait" />
              <Chart
                type="bar"
                series={days.map((d) => ({ bucket: d.bucket, value: d.availability ?? 0, raw: d.availability }))}
                xLabel={dayLabel}
                tip={(p) => `${longDay(p.bucket)} · ${noMeasure(p.raw) ? 'pas encore mesuré' : pct(p.raw)}`}
                ariaLabel="Disponibilité par jour"
                height={CHART_H}
              />
            </section>
            <section className="pil-card">
              <CardHead title="Temps de réponse par jour" sub="moyenne, en millisecondes" />
              <Chart
                type="bar"
                series={days.map((d) => ({ bucket: d.bucket, value: d.avg_ms ?? 0, raw: d.avg_ms }))}
                xLabel={dayLabel}
                tip={(p) => `${longDay(p.bucket)} · ${noMeasure(p.raw) ? 'pas encore mesuré' : `${p.raw} ms`}`}
                ariaLabel="Temps de réponse par jour"
                height={CHART_H}
              />
            </section>
            <section className="pil-card">
              <CardHead title="Requêtes par jour" sub="demandes reçues par le serveur" />
              <Chart
                type="bar"
                series={days.map((d) => ({ bucket: d.bucket, value: d.requests ?? 0, raw: d.requests, restarts: d.restarts }))}
                xLabel={dayLabel}
                tip={(p) => `${longDay(p.bucket)} · ${noMeasure(p.raw) ? 'pas encore mesuré' : `${plural(p.raw, 'requête')}${p.restarts ? ` · ${p.restarts} redémarrage${p.restarts > 1 ? 's' : ''}` : ''}`}`}
                ariaLabel="Requêtes par jour"
                height={CHART_H}
              />
            </section>
            <section className="pil-card">
              <CardHead title="Erreurs du serveur par jour" sub="actions qui ont échoué à cause d’Orgaly" />
              <Chart
                type="bar"
                series={days.map((d) => ({ bucket: d.bucket, value: d.errors, emails: d.emails }))}
                xLabel={dayLabel}
                tip={(p) => `${longDay(p.bucket)} · ${plural(p.value, 'erreur')} · ${p.emails} e-mail${p.emails > 1 ? 's' : ''} envoyé${p.emails > 1 ? 's' : ''}`}
                ariaLabel="Erreurs du serveur par jour"
                height={CHART_H}
              />
            </section>
          </div>
          <p className="pil-note" style={{ marginTop: 0, marginBottom: 12 }}>
            {hist.since
              ? `Rapidité, disponibilité et redémarrages mesurés depuis le ${fmtLongDate(hist.since)} ; erreurs et e-mails depuis le début du journal (gardé 90 jours).`
              : 'Rapidité, disponibilité et redémarrages : les mesures commencent à la prochaine mise en ligne du serveur. Erreurs et e-mails : depuis le début du journal (gardé 90 jours).'}
          </p>
        </>
      )}

      <JournalCard token={token} status="error" onStatus={() => {}} title="Dernières erreurs du serveur" sub="uniquement les actions en erreur" pageSize={50} hideFilters />
    </>
  );
}
