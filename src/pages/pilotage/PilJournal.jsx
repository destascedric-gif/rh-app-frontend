import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats } from '../../api/owner';
import { PageHead, JournalCard } from './PilotageUi';

// Journal complet : filtres par résultat et par entreprise.
// ?statut=erreurs ou ?statut=refusees ouvre directement le bon filtre.
// Version compacte (16 nov. 2026, proposition B choisie par Cédric) :
// regroupé par jour, réussites en gris doux, aide derrière le « i ».
const FROM_URL = { erreurs: 'error', refusees: 'refused' };
const TO_URL = { error: 'erreurs', refused: 'refusees' };

export default function PilJournal() {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = FROM_URL[params.get('statut')] ?? 'all';
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getOwnerStats(30, token)
      .then((s) => { if (!cancelled) setCompanies([...s.companies].sort((a, b) => a.name.localeCompare(b.name, 'fr'))); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  const setStatus = (s) => setParams(TO_URL[s] ? { statut: TO_URL[s] } : {}, { replace: true });

  return (
    <>
      <PageHead
        title="Journal des actions"
        infoWidth={480}
        info={(
          <>
            <p>Qui a fait quoi et quand, avec le résultat — jamais le contenu (ni horaires, ni motifs, ni destinataires). Effacé automatiquement au bout de 90 jours. Mis à jour chaque minute.</p>
            <ul>
              <li><span className="pil-dot pil-dot--ok" /> <b>réussi</b> : l’action s’est bien passée (en gris doux).</li>
              <li><span className="pil-dot pil-dot--warn" /> <b>refusé</b> : Orgaly a dit non, et c’est normal (mot de passe faux, droit manquant, formulaire incomplet…).</li>
              <li><span className="pil-dot pil-dot--bad" /> <b>erreur</b> : un problème du serveur, à regarder (le détail technique est dans Sentry).</li>
              <li>« Visiteur non connecté » : une tentative sans compte reconnu, par exemple une adresse e-mail inconnue à la connexion.</li>
            </ul>
          </>
        )}
      />
      <JournalCard token={token} companies={companies} status={status} onStatus={setStatus} title="Toutes les actions" sub="les plus récentes en premier" grouped />
    </>
  );
}
