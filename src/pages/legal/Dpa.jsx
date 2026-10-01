import LegalLayout, { Field } from './LegalLayout';
import { EDITOR, SUBPROCESSORS } from '../../legal/legalInfo';

export default function Dpa() {
  return (
    <LegalLayout title="Accord de sous-traitance des données (DPA)">
      <p>
        Le présent accord, conclu en application de l'article 28 du RGPD, fait partie intégrante des
        CGU et des CGV. Il lie l'entreprise cliente (« le Responsable de traitement ») et{' '}
        {EDITOR.name}, éditeur d'Orgaly (« le Sous-traitant »), pour les données personnelles des
        salariés que le Client gère dans Orgaly. Il est accepté en même temps que les CGU.
      </p>

      <h2>1. Description du traitement</h2>
      <dl className="legal-dl">
        <dt>Objet</dt>
        <dd>Mise à disposition d'un logiciel en ligne de gestion du personnel.</dd>
        <dt>Durée</dt>
        <dd>Durée de l'utilisation d'Orgaly par le Client, puis la période de restitution et de suppression prévue à l'article 9.</dd>
        <dt>Nature des opérations</dt>
        <dd>Hébergement, enregistrement, consultation, calcul (soldes de congés, heures, montants de paie), génération de documents, envoi d'e-mails d'invitation, suppression.</dd>
        <dt>Personnes concernées</dt>
        <dd>Salariés et administrateurs du Client.</dd>
        <dt>Catégories de données</dt>
        <dd>
          Identité et coordonnées professionnelles ; poste, contrat, date d'embauche, temps de travail ;
          rémunération et bulletins de paie ; planning et pointages ; congés et absences, dont le type
          d'absence (un arrêt maladie constitue une donnée concernant la santé au sens de l'article 9
          du RGPD, sans qu'aucun motif médical ne doive être saisi) ; documents RH déposés par le Client.
        </dd>
      </dl>

      <h2>2. Instructions du Responsable de traitement</h2>
      <p>
        Le Sous-traitant traite les données uniquement pour fournir le service et selon les
        instructions documentées du Client, que constituent les CGU, les CGV, le présent accord et les
        réglages effectués dans Orgaly. Il informe immédiatement le Client s'il estime qu'une
        instruction est contraire à la réglementation. Il n'utilise pas les données pour son propre
        compte.
      </p>

      <h2>3. Confidentialité</h2>
      <p>
        Les personnes autorisées à accéder aux données s'engagent à en respecter la confidentialité.
        Cet accès est limité à ce qui est nécessaire au support et à la maintenance.
      </p>

      <h2>4. Sécurité</h2>
      <p>Le Sous-traitant met en œuvre les mesures prévues à l'article 32 du RGPD, notamment :</p>
      <ul>
        <li>chiffrement des échanges (HTTPS) ;</li>
        <li>mots de passe stockés sous forme hachée (bcrypt) ;</li>
        <li>cloisonnement systématique des données par entreprise cliente ;</li>
        <li>contrôle des accès selon le rôle (administrateur, employé) ;</li>
        <li>limitation des tentatives de connexion et validation des données reçues ;</li>
        <li>suivi des erreurs configuré pour ne pas collecter d'adresses IP ni de contenus personnels.</li>
      </ul>

      <h2>5. Sous-traitants ultérieurs</h2>
      <p>
        Le Client autorise le recours aux sous-traitants ultérieurs suivants, chacun lié par des
        obligations de protection des données équivalentes :
      </p>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead><tr><th>Prestataire</th><th>Rôle</th><th>Localisation des données</th></tr></thead>
          <tbody>
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td>{s.purpose}</td>
                <td><Field value={s.location} label="région d'hébergement" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Tout ajout ou remplacement est annoncé au Client par e-mail au moins 30 jours à l'avance. Le
        Client peut s'y opposer pour un motif légitime ; à défaut d'accord, il peut résilier sans frais.
        Les transferts hors de l'Union européenne sont encadrés par les clauses contractuelles types
        de la Commission européenne ou par le Data Privacy Framework UE–États-Unis.
      </p>

      <h2>6. Droits des personnes</h2>
      <p>
        Le Client répond aux demandes de ses salariés (accès, rectification, effacement, etc.), en
        s'appuyant sur les fonctions d'Orgaly. Le Sous-traitant lui transmet sans délai toute demande
        reçue directement et l'assiste pour les cas que l'interface ne permet pas de traiter.
      </p>

      <h2>7. Violation de données</h2>
      <p>
        Le Sous-traitant notifie au Client toute violation de données personnelles dans les meilleurs
        délais et au plus tard 48 heures après en avoir pris connaissance, avec les informations
        utiles à sa propre notification à la CNIL (nature de la violation, données et personnes
        concernées, conséquences probables, mesures prises).
      </p>

      <h2>8. Assistance et audit</h2>
      <p>
        Le Sous-traitant aide le Client à réaliser ses analyses d'impact et à respecter ses
        obligations de sécurité. Il met à sa disposition les informations nécessaires pour démontrer
        le respect du présent accord et permet un audit, à la charge du Client, au plus une fois par an
        et avec un préavis de 30 jours, par un auditeur tenu au secret.
      </p>

      <h2>9. Fin du traitement</h2>
      <p>
        À la fin de l'utilisation du service, le Client peut obtenir l'export de ses données (CSV ou
        JSON) sur demande à <Field value={EDITOR.email} label="e-mail de contact" />. Les données sont
        ensuite supprimées au plus tard 90 jours après la fermeture du compte, et effacées des
        sauvegardes au fil de leur renouvellement, sauf obligation légale de conservation.
      </p>

      <h2>10. Obligations du Client</h2>
      <p>
        Le Client garantit la licéité des données qu'il saisit, informe ses salariés du traitement
        (notamment par la mise à jour de sa propre notice d'information), ne saisit pas de motif
        médical ni de données dont il n'a pas besoin, et tient son registre des traitements.
      </p>
    </LegalLayout>
  );
}
