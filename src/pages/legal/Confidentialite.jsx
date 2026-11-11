import { Link } from 'react-router-dom';
import LegalLayout, { Field } from './LegalLayout';
import { EDITOR } from '../../legal/legalInfo';

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <p>
        Cette politique explique comment {EDITOR.name} (« l'Éditeur »), éditeur d'Orgaly, traite les
        données personnelles, conformément au règlement (UE) 2016/679 (« RGPD ») et à la loi
        Informatique et Libertés.
      </p>

      <h2>1. Deux rôles distincts</h2>
      <ul>
        <li>
          <strong>Données RH des salariés</strong> (fiches, congés, planning, pointage, paie) : elles
          sont traitées pour le compte de l'entreprise cliente, qui en est responsable. L'Éditeur agit
          comme sous-traitant selon l'<Link to="/dpa">accord de sous-traitance</Link>. Pour exercer vos
          droits sur ces données, adressez-vous à votre employeur ; si vous nous contactez, nous lui
          transmettrons votre demande.
        </li>
        <li>
          <strong>Données des clients et de leurs comptes</strong> (administrateurs, facturation,
          sécurité du service) : l'Éditeur en est responsable de traitement. C'est l'objet de la suite
          de cette page.
        </li>
      </ul>

      <h2>2. Données traitées, finalités et bases légales</h2>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr><th>Finalité</th><th>Données</th><th>Base légale</th><th>Durée de conservation</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Création et gestion du compte</td>
              <td>Nom, prénom, e-mail, téléphone, mot de passe (stocké sous forme chiffrée irréversible), nom et coordonnées de l'entreprise</td>
              <td>Exécution du contrat</td>
              <td>Durée de l'inscription, puis 90 jours</td>
            </tr>
            <tr>
              <td>Facturation de l'abonnement</td>
              <td>Raison sociale, adresse de facturation, n° de TVA, historique des factures. Les données de carte sont traitées par Stripe et jamais par l'Éditeur.</td>
              <td>Exécution du contrat ; obligation légale</td>
              <td>10 ans pour les factures (art. L. 123-22 du Code de commerce)</td>
            </tr>
            <tr>
              <td>Preuve de l'acceptation des CGU et CGV</td>
              <td>Date et version acceptées</td>
              <td>Intérêt légitime (preuve du contrat)</td>
              <td>Durée de l'inscription, puis 5 ans</td>
            </tr>
            <tr>
              <td>Sécurité et correction des erreurs</td>
              <td>Journaux techniques, rapports d'erreur (configurés pour exclure adresses IP et contenus personnels)</td>
              <td>Intérêt légitime (sécurité du service)</td>
              <td>90 jours au plus</td>
            </tr>
            <tr>
              <td>Suivi du bon fonctionnement et de l'utilisation du service (journal des actions)</td>
              <td>Type d'action effectuée (par exemple « créneau créé » ou « connexion »), date et heure, résultat (réussi, refusé, erreur), entreprise, rôle et identifiant interne de l'auteur. Jamais le contenu : ni horaires, ni motifs, ni destinataires des e-mails.</td>
              <td>Intérêt légitime (sécurité et amélioration du service)</td>
              <td>90 jours, puis suppression automatique</td>
            </tr>
            <tr>
              <td>E-mails de service</td>
              <td>Adresse e-mail, contenu du message (invitation, information sur le compte)</td>
              <td>Exécution du contrat</td>
              <td>Durée de l'inscription</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Aucune donnée n'est vendue, ni utilisée à des fins publicitaires ou de profilage.</p>

      <h2>3. Destinataires</h2>
      <p>
        Les données ne sont accessibles qu'à l'Éditeur et aux prestataires techniques strictement
        nécessaires : hébergement (Railway, Vercel), envoi d'e-mails (Brevo), suivi des erreurs (Sentry),
        génération du planning par IA (Anthropic, pour les entreprises qui utilisent cette fonction)
        et paiement (Stripe Payments Europe Ltd, Irlande). La liste à jour figure dans l'
        <Link to="/dpa">accord de sous-traitance</Link>.
      </p>

      <h3>Planning généré par intelligence artificielle</h3>
      <p>
        Lorsqu'un gérant utilise la fonction « Générer avec l'IA » du planning, Orgaly envoie à
        Anthropic Ireland, Limited (modèle d'IA Claude) les éléments nécessaires pour proposer un
        planning : prénoms et postes des salariés, durée de leur contrat, horaires et jours de repos
        habituels, congés déjà posés, jours d'ouverture et demandes écrites du gérant. Aucun nom de
        famille, salaire, adresse e-mail, numéro de téléphone ni date de naissance n'est envoyé.
      </p>
      <p>
        Anthropic agit comme sous-traitant : selon ses conditions commerciales, ces données ne servent
        jamais à entraîner ses modèles et sont supprimées sous 30 jours (sauf obligation légale ou
        usage contraire à ses règles). L'IA ne fait qu'une proposition : rien n'est enregistré dans le
        planning tant que le gérant ne l'a pas vérifiée et validée. Aucune décision n'est donc prise
        de manière entièrement automatisée.
      </p>

      <h2>4. Transferts hors de l'Union européenne</h2>
      <p>
        Certains prestataires sont des sociétés américaines ou stockent des données aux États-Unis
        (notamment Anthropic pour le planning généré par IA). Les transferts éventuels sont encadrés par
        les clauses contractuelles types de la Commission européenne et, lorsque le prestataire y est
        certifié, par le cadre de protection des données UE–États-Unis (Data Privacy Framework).
      </p>

      <h2>5. Cookies et stockage local</h2>
      <p>
        Orgaly n'utilise aucun cookie publicitaire ni outil de mesure d'audience. Seul le jeton de
        connexion est enregistré dans le stockage local du navigateur, ce qui est strictement
        nécessaire au fonctionnement du service et ne requiert pas de consentement.
      </p>

      <h2>6. Sécurité</h2>
      <p>
        Les échanges sont chiffrés (HTTPS), les mots de passe hachés, les données de chaque entreprise
        isolées, les accès limités selon le rôle (administrateur ou employé) et les tentatives de
        connexion répétées bloquées.
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité
        et d'opposition, ainsi que du droit de définir des directives sur le sort de vos données après
        votre décès. Pour les exercer, écrivez à <Field value={EDITOR.email} label="e-mail de contact" />.
        Une réponse vous est apportée dans un délai d'un mois.
      </p>
      <p>
        Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr, 3 place de
        Fontenoy, TSA 80715, 75334 Paris Cedex 07).
      </p>
    </LegalLayout>
  );
}
