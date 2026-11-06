import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerHealth } from '../../api/owner';
import { PageHead, CardHead, Chart, HealthRows, JournalCard } from './PilotageUi';
import { plural } from './pilotageUtils';

// Santé technique : état du serveur, rapidité heure par heure, erreurs
const hourLabel = (iso) => `${new Date(iso).getHours()} h`;

export default function PilSante() {
  const { token } = useAuth();
  const [h, setH] = useState(null);
  const [down, setDown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => getOwnerHealth(token)
      .then((d) => { if (!cancelled) { setH(d); setDown(false); } })
      .catch(() => { if (!cancelled) setDown(true); });
    load();
    const id = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  const series = h?.series ?? [];

  return (
    <>
      <PageHead title="Santé technique" sub="Est-ce qu’Orgaly fonctionne bien ? Dernières 24 heures, mis à jour chaque minute." />

      <div className="pil-row">
        <section className="pil-card">
          <CardHead title="État actuel" />
          <HealthRows h={h} down={down} onShowErrors={() => document.getElementById('pil-journal')?.scrollIntoView({ behavior: 'smooth' })} />
        </section>
        <section className="pil-card pil-help">
          <h2>Comment lire cette page</h2>
          <ul>
            <li><b>Temps de réponse</b> : le temps que met le serveur à répondre. En dessous de 500 ms, c’est rapide ; au-dessus de 1,5 s, les clients le sentent.</li>
            <li><b>Erreurs du serveur</b> : des actions qui ont échoué à cause d’Orgaly (pas de l’utilisateur). Le détail technique est dans Sentry.</li>
            <li><b>E-mails</b> : Brevo, dans son offre gratuite, en envoie 300 par jour au maximum.</li>
            <li>Les compteurs de rapidité repartent de zéro quand le serveur redémarre (à chaque mise en ligne).</li>
          </ul>
        </section>
      </div>

      {h && !down && (
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

      <JournalCard token={token} status="error" onStatus={() => {}} title="Dernières erreurs du serveur" sub="Uniquement les actions en erreur" pageSize={50} hideFilters />
    </>
  );
}
