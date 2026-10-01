import { Link } from 'react-router-dom';
import LegalLayout, { Field } from './LegalLayout';
import { EDITOR, HOSTS, SITE_URL } from '../../legal/legalInfo';

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales">
      <p>
        Conformément à l'article 1-1 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
        l'économie numérique (LCEN), voici l'identité des intervenants du service Orgaly,
        accessible à l'adresse {SITE_URL}.
      </p>

      <h2>Éditeur</h2>
      <dl className="legal-dl">
        <dt>Nom</dt>                  <dd>{EDITOR.name}</dd>
        <dt>Statut</dt>               <dd>{EDITOR.status}</dd>
        <dt>SIREN</dt>                <dd><Field value={EDITOR.siren} label="numéro SIREN" /></dd>
        <dt>Adresse</dt>              <dd><Field value={EDITOR.address} label="adresse" /></dd>
        <dt>Contact</dt>              <dd><Field value={EDITOR.email} label="e-mail de contact" /></dd>
        <dt>TVA</dt>                  <dd>{EDITOR.vatMention}</dd>
        <dt>Directeur de la publication</dt> <dd>{EDITOR.publisher}</dd>
      </dl>

      <h2>Hébergement</h2>
      {HOSTS.map((h) => (
        <p key={h.name}>
          <strong>{h.name}</strong> — {h.role}<br />
          {h.address} — <a href={h.site} target="_blank" rel="noreferrer">{h.site.replace('https://', '')}</a>
        </p>
      ))}

      <h2>Propriété intellectuelle</h2>
      <p>
        Le logiciel Orgaly, son code, son interface, ses textes et son logo sont la propriété de
        l'éditeur. Toute reproduction ou réutilisation, totale ou partielle, sans autorisation écrite
        préalable est interdite. Les données saisies par les clients restent leur propriété.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{' '}
        <Link to="/confidentialite">politique de confidentialité</Link> et, pour les données des
        salariés gérées par nos clients, dans l'<Link to="/dpa">accord de sous-traitance</Link>.
      </p>
    </LegalLayout>
  );
}
