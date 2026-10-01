import { Link } from 'react-router-dom';
import LegalLayout, { Field } from './LegalLayout';
import { EDITOR, PRICING } from '../../legal/legalInfo';

export default function Cgv() {
  return (
    <LegalLayout title="Conditions générales de vente">
      <h2>1. Champ d'application</h2>
      <p>
        Les présentes conditions générales de vente (« CGV ») régissent la souscription d'abonnements
        au logiciel Orgaly, édité par {EDITOR.name} (« l'Éditeur »), par des clients professionnels
        (« le Client »). Elles complètent les <Link to="/cgu">conditions générales d'utilisation</Link>{' '}
        et l'<Link to="/dpa">accord de sous-traitance</Link>, qui en font partie intégrante.
        Orgaly n'est pas proposé aux consommateurs.
      </p>

      <h2>2. Offres</h2>
      <ul>
        <li>
          <strong>Plan Gratuit</strong> : accès à toutes les fonctionnalités, dans la limite de{' '}
          {PRICING.freeEmployeeLimit} employés actifs.
        </li>
        <li>
          <strong>Plan Pro</strong> : nombre d'employés actifs illimité, au prix de{' '}
          <strong>{PRICING.pricePerEmployee} HT par employé actif et par mois</strong>.
        </li>
      </ul>
      <p>
        Est un « employé actif » tout compte employé non désactivé, y compris les invitations en
        attente d'activation. Le compte administrateur n'est pas compté. En plan Pro, tous les employés
        actifs sont facturés, y compris les cinq premiers.
      </p>

      <h2>3. Souscription</h2>
      <p>
        L'Administrateur souscrit au plan Pro depuis la page « Abonnement » de son espace, après avoir
        accepté les présentes CGV. Le paiement est réalisé sur une page sécurisée de notre prestataire
        de paiement Stripe ; l'Éditeur n'a jamais accès aux numéros de carte. L'abonnement prend effet
        dès la confirmation du paiement.
      </p>

      <h2>4. Prix et facturation</h2>
      <p>
        Les prix sont exprimés en euros hors taxes. {EDITOR.vatMention} : le montant facturé
        correspond donc au prix hors taxes, tant que l'Éditeur bénéficie de ce régime. L'abonnement
        est facturé mensuellement, d'avance, à la date anniversaire de la souscription. Une facture est
        émise à chaque échéance et reste disponible dans l'espace de facturation.
      </p>
      <p>
        Lorsque le nombre d'employés actifs varie en cours de mois, la différence est calculée au
        prorata du temps restant et reportée sur la facture suivante (en plus ou en moins).
      </p>

      <h2>5. Paiement et retard</h2>
      <p>
        Le paiement s'effectue par prélèvement automatique sur la carte bancaire enregistrée. En cas
        d'échec, de nouvelles tentatives sont effectuées pendant plusieurs jours et le Client en est
        averti. Si le paiement reste impayé, l'abonnement est résilié et le compte repasse au plan
        Gratuit : aucune donnée n'est supprimée, mais l'ajout ou la réactivation d'employés au-delà de
        la limite gratuite est bloqué.
      </p>
      <p>
        Conformément à l'article L. 441-10 du Code de commerce, toute somme non payée à l'échéance
        porte de plein droit intérêt au taux égal à trois fois le taux d'intérêt légal, et donne lieu à
        une indemnité forfaitaire pour frais de recouvrement de 40 €.
      </p>

      <h2>6. Durée et résiliation</h2>
      <p>
        L'abonnement est conclu pour une durée d'un mois, renouvelée tacitement chaque mois. Le Client
        peut le résilier <strong>à tout moment, en ligne</strong>, depuis la page « Abonnement » puis
        « Gérer mon abonnement », sans frais ni justification. La résiliation prend effet à la fin de
        la période mensuelle en cours, déjà payée ; aucun remboursement au prorata n'est effectué. Le
        compte repasse ensuite au plan Gratuit avec ses données.
      </p>
      <p>
        L'Éditeur peut résilier l'abonnement en cas de manquement grave du Client non corrigé 15 jours
        après mise en demeure, ou moyennant un préavis de 3 mois en cas d'arrêt du service.
      </p>

      <h2>7. Évolution des prix</h2>
      <p>
        Toute modification de prix est notifiée par e-mail au moins 30 jours avant son application.
        Le Client qui la refuse peut résilier son abonnement avant cette date.
      </p>

      <h2>8. Droit de rétractation</h2>
      <p>
        Le contrat étant conclu entre professionnels, le droit de rétractation prévu par le Code de la
        consommation ne s'applique pas, sous réserve des dispositions d'ordre public.
      </p>

      <h2>9. Module de paie</h2>
      <p>
        Le module de paie fournit des bulletins à titre indicatif : Orgaly n'est pas un logiciel de
        paie certifié et n'effectue aucune déclaration sociale (voir l'article 7 des CGU). L'abonnement
        ne comprend aucune prestation de paie, de conseil social ou juridique.
      </p>

      <h2>10. Responsabilité</h2>
      <p>
        L'Éditeur est tenu d'une obligation de moyens. Sa responsabilité ne peut être engagée que pour
        les dommages directs prouvés résultant d'un manquement à ses obligations ; elle est limitée, tous
        faits générateurs confondus, aux sommes payées par le Client au cours des 12 mois précédant le
        fait générateur. Sont exclus les dommages indirects (perte de chiffre d'affaires, redressement
        social ou fiscal, atteinte à l'image, etc.).
      </p>

      <h2>11. Réversibilité des données</h2>
      <p>
        À la fin de l'abonnement comme à tout moment, le Client peut demander l'export de ses données
        dans un format courant et lisible (CSV ou JSON) à l'adresse{' '}
        <Field value={EDITOR.email} label="e-mail de contact" />. L'export est fourni sous 30 jours,
        sans frais.
      </p>

      <h2>12. Force majeure</h2>
      <p>
        Aucune partie n'est responsable d'un manquement causé par un événement de force majeure au
        sens de l'article 1218 du Code civil, y compris la défaillance d'un hébergeur ou d'un
        prestataire essentiel indépendante de la volonté de l'Éditeur.
      </p>

      <h2>13. Droit applicable et litiges</h2>
      <p>
        Les CGV sont soumises au droit français. À défaut de solution amiable dans un délai de 30 jours,
        tout litige relève des tribunaux compétents du ressort du domicile professionnel de l'Éditeur.
      </p>
    </LegalLayout>
  );
}
