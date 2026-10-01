import { Link } from 'react-router-dom';
import LegalLayout, { Field } from './LegalLayout';
import { EDITOR } from '../../legal/legalInfo';

export default function Cgu() {
  return (
    <LegalLayout title="Conditions générales d'utilisation">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales d'utilisation (« CGU ») encadrent l'accès et l'utilisation
        d'Orgaly, logiciel en ligne de gestion des ressources humaines (fiches employés, congés,
        planning, pointage, aide à l'établissement des bulletins de paie), édité par {EDITOR.name}
        (« l'Éditeur »).
      </p>
      <p>
        Elles s'appliquent à toute personne utilisant le service (« l'Utilisateur ») : l'administrateur
        qui inscrit son entreprise comme ses salariés invités. La souscription d'un abonnement payant
        est en outre régie par les <Link to="/cgv">conditions générales de vente</Link>.
      </p>

      <h2>2. Définitions</h2>
      <ul>
        <li><strong>Client</strong> : l'entreprise ou l'organisation inscrite sur Orgaly par son administrateur.</li>
        <li><strong>Administrateur</strong> : l'Utilisateur qui crée le compte du Client et agit pour son compte.</li>
        <li><strong>Employé</strong> : la personne invitée par l'Administrateur à accéder à son espace personnel.</li>
        <li><strong>Données du Client</strong> : toutes les informations saisies ou déposées dans Orgaly par le Client et ses Utilisateurs.</li>
      </ul>

      <h2>3. Acceptation</h2>
      <p>
        L'Administrateur accepte les CGU en cochant la case prévue lors de l'inscription ; il déclare
        disposer du pouvoir d'engager le Client. L'Employé les accepte en activant son compte. La date
        et la version des CGU acceptées sont conservées.
      </p>

      <h2>4. Accès au service et comptes</h2>
      <p>
        Orgaly est réservé aux professionnels. Chaque Utilisateur dispose d'identifiants personnels
        qu'il garde confidentiels ; toute action effectuée avec ces identifiants est réputée faite par
        lui. En cas de perte ou d'usage frauduleux, l'Utilisateur prévient sans délai l'Administrateur
        ou l'Éditeur. L'Administrateur gère les accès de ses Employés et désactive ceux qui quittent
        l'entreprise.
      </p>

      <h2>5. Utilisation conforme</h2>
      <p>L'Utilisateur s'engage notamment à ne pas :</p>
      <ul>
        <li>saisir des informations illicites, ou sans rapport avec la gestion du personnel ;</li>
        <li>saisir des données de santé détaillées (diagnostic, motif médical d'un arrêt) : Orgaly n'est pas conçu pour les recevoir ;</li>
        <li>tenter d'accéder aux données d'un autre Client, ou contourner les mesures de sécurité ;</li>
        <li>perturber le service (envois automatisés massifs, tests d'intrusion non autorisés, etc.).</li>
      </ul>

      <h2>6. Données personnelles</h2>
      <p>
        Pour les données de ses salariés, le Client est responsable de traitement et l'Éditeur agit
        comme sous-traitant, selon l'<Link to="/dpa">accord de sous-traitance</Link>. Il appartient au
        Client d'informer ses salariés de l'utilisation d'Orgaly. Les données des comptes
        d'Administrateur et de facturation sont traitées selon la{' '}
        <Link to="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>7. Module de paie : document indicatif</h2>
      <p>
        Orgaly n'est <strong>pas un logiciel de paie certifié</strong> et n'effectue aucune
        déclaration sociale nominative (DSN). Les bulletins générés reposent sur des taux de
        cotisation simplifiés et ne tiennent compte ni de la convention collective, ni des allègements
        de charges, ni du prélèvement à la source. Ils constituent une aide au calcul : le Client doit
        les faire vérifier par un professionnel de la paie avant toute remise au salarié et reste seul
        responsable de leur exactitude et des déclarations obligatoires.
      </p>

      <h2>8. Disponibilité</h2>
      <p>
        L'Éditeur s'efforce de rendre le service accessible en permanence, sans garantie de
        disponibilité continue. Il peut l'interrompre pour maintenance, si possible en dehors des
        heures ouvrées, ou en cas de défaillance d'un prestataire technique. Il est conseillé au Client
        de télécharger régulièrement les documents qu'il doit conserver (bulletins, etc.).
      </p>

      <h2>9. Propriété intellectuelle</h2>
      <p>
        Le logiciel reste la propriété de l'Éditeur. Le Client bénéficie d'un droit d'utilisation
        personnel, non exclusif et non cessible pendant la durée de son inscription. Le Client reste
        propriétaire des Données du Client.
      </p>

      <h2>10. Responsabilité</h2>
      <p>
        L'Éditeur est tenu d'une obligation de moyens. Il n'est pas responsable des décisions prises
        par le Client sur la base des informations calculées par Orgaly (soldes de congés, heures
        supplémentaires, montants de paie), ni des données saisies par les Utilisateurs. Les limites de
        responsabilité applicables aux abonnements payants figurent dans les CGV.
      </p>

      <h2>11. Suspension et suppression du compte</h2>
      <p>
        L'Éditeur peut suspendre un accès en cas de manquement grave aux présentes CGU, après
        notification sauf urgence (atteinte à la sécurité). L'Administrateur peut demander à tout
        moment la suppression du compte du Client à l'adresse{' '}
        <Field value={EDITOR.email} label="e-mail de contact" /> ; les Données du Client sont alors
        restituées sur demande puis supprimées dans les conditions de l'accord de sous-traitance.
        Un compte gratuit sans aucune connexion pendant 24 mois peut être supprimé, après un
        préavis de 30 jours envoyé par e-mail à l'Administrateur.
      </p>

      <h2>12. Modification des CGU</h2>
      <p>
        L'Éditeur peut faire évoluer les CGU. Les Utilisateurs sont informés de toute modification
        substantielle au moins 30 jours avant son entrée en vigueur ; la poursuite de l'utilisation
        vaut acceptation.
      </p>

      <h2>13. Droit applicable</h2>
      <p>
        Les CGU sont soumises au droit français. En cas de litige, les parties recherchent d'abord une
        solution amiable ; à défaut, les tribunaux compétents du ressort du domicile professionnel de
        l'Éditeur sont seuls compétents, sous réserve des règles d'ordre public.
      </p>
    </LegalLayout>
  );
}
