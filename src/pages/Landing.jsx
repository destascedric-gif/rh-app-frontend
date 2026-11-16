import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PRICING } from '../legal/legalInfo';
import { DEFAULT_TITLE } from '../seo';
import SiteLayout, { Logo } from './site/SiteLayout';
import { Icon, euros } from './site/siteUtils';

// Page d'accueil du site vitrine (refonte du 16 nov. 2026, d'après la
// maquette « Maquette design/Site vitrine (16 nov 2026)/accueil.html »).
// Captures du compte démo et vidéo Instagram dans public/site/.

const AUDIENCE = [
  { icon: 'croissant', label: 'Boulangeries' },
  { icon: 'utensils',  label: 'Restaurants' },
  { icon: 'scissors',  label: 'Salons de coiffure' },
  { icon: 'bag',       label: 'Boutiques' },
  { icon: 'sparkle',   label: 'Instituts de beauté' },
  { icon: 'store',     label: 'Commerces de quartier' },
];

const CHANGES = [
  {
    icon: 'calendar', title: 'Le planning',
    before: 'Une feuille ou un tableau Excel à refaire, puis à envoyer à chacun',
    after: "Vos horaires habituels se placent d'un geste, ou la semaine précédente se recopie en un clic.",
  },
  {
    icon: 'sun', title: 'Les congés',
    before: 'Des demandes par SMS ou WhatsApp, des soldes tenus de tête',
    after: 'Le salarié demande depuis son téléphone, vous acceptez en un clic, le solde se met à jour.',
  },
  {
    icon: 'clock', title: 'Les heures',
    before: 'Additionnées à la main ou sur Excel en fin de mois',
    after: 'Calculées directement à partir du planning, heures supplémentaires comprises.',
  },
];

const FAQ = [
  {
    q: 'Mes salariés doivent-ils installer une application ?',
    a: "Non. Orgaly s'ouvre dans le navigateur, sur ordinateur, tablette ou téléphone. Chaque salarié reçoit une invitation par e-mail et se connecte avec son adresse.",
  },
  {
    q: `C'est vraiment gratuit jusqu'à ${PRICING.freeEmployees} salariés ?`,
    a: `Oui. Avec 1, 2 ou ${PRICING.freeEmployees} salariés, vous avez tout l'abonnement sans payer, sans limite de durée. Le gérant n'est jamais compté.`,
  },
  {
    q: 'Faut-il une carte bancaire pour essayer ?',
    a: `Non. Vous créez votre espace avec votre adresse e-mail, et rien ne vous est demandé pendant les ${PRICING.trialMonths} mois d'essai.`,
  },
  {
    q: 'Les bulletins de paie sont-ils officiels ?',
    a: "Non. Orgaly prépare des bulletins indicatifs pour vous faire gagner du temps, mais ce n'est pas un logiciel de paie certifié : faites-les vérifier par votre expert-comptable.",
  },
  {
    q: 'Que deviennent mes données ?',
    a: 'Elles restent les vôtres : vous pouvez les récupérer sur simple demande, et elles ne sont jamais revendues ni utilisées pour de la publicité.',
    link: { to: '/confidentialite', label: 'Lire la politique de confidentialité' },
  },
  {
    q: 'Et si je veux arrêter ?',
    a: "Vous arrêtez quand vous voulez, sans engagement. Si vous avez besoin de vos données, il suffit de nous écrire.",
  },
];

// Illustration de l'option IA (dessinée, pas une capture)
const IA_WEEK = [
  { name: 'Sarah', cells: ['o', 'o', 'r', 'o', 'f', 'f'] },
  { name: 'Mehdi', cells: ['f', 'f', 'o', 'r', 'o', 'o'] },
  { name: 'Julie', cells: ['r', 'o', 'f', 'f', 'r', 'o'] },
];
const IA_LABEL = { o: '9h30', f: '10h', r: 'Repos' };

// Vidéo du haut de page (16 nov. 2026, demande de Cédric) : affichée
// entière, à son format d'origine (vertical 9:16, celui d'Instagram),
// muette et en boucle ; un bouton met le son. Plus de « Voir la vidéo ».
function HeroVideo({ videoRef, sound, toggleSound }) {
  return (
    <div className="s-hero-stage">
      <div className="s-video">
        <video
          ref={videoRef}
          src="/site/orgaly-video.mp4"
          poster="/site/orgaly-video.jpg"
          autoPlay muted loop playsInline preload="metadata"
          aria-label="Vidéo de présentation d'Orgaly"
        />
        <button type="button" className="s-video-sound" onClick={toggleSound}
          aria-label={sound ? 'Couper le son' : 'Mettre le son'}>
          {sound ? <Icon.soundOn size={18} /> : <Icon.soundOff size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function Landing() {
  const videoRef = useRef(null);
  const [sound, setSound] = useState(false);
  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setSound(!v.muted);
    if (!v.muted) v.play().catch(() => {});
  };

  return (
    <SiteLayout title={DEFAULT_TITLE}>
      {/* ── Haut de page ───────────────────────────── */}
      <section className="s-wrap s-hero">
        <div>
          <span className="s-eyebrow">Pour les commerces et les petites équipes</span>
          <h1>La gestion d'équipe simple, <em>même sans service RH.</em></h1>
          <ul className="s-checks">
            <li>Le planning de la semaine en quelques glisser-déposer</li>
            <li>Chaque salarié le retrouve sur son téléphone</li>
            <li>Les congés demandés et acceptés en un clic</li>
            <li>Les heures et heures sup. calculées toutes seules</li>
          </ul>
          <div className="s-ctas">
            <Link className="s-btn" to="/setup/admin">Essayer gratuitement</Link>
          </div>
          <div className="s-reassure">
            <span>Gratuit jusqu'à {PRICING.freeEmployees} salariés</span>
            <span>{PRICING.trialMonths} mois d'essai</span>
            <span>Sans carte bancaire</span>
          </div>
        </div>
        <HeroVideo videoRef={videoRef} sound={sound} toggleSound={toggleSound} />
      </section>

      {/* ── Pensé pour ─────────────────────────────── */}
      <div className="s-forwho">
        <div className="s-wrap">
          <b>Pensé pour</b>
          {AUDIENCE.map(({ icon, label }) => {
            const I = Icon[icon];
            return <span key={label} className="s-chip"><I size={20} />{label}</span>;
          })}
        </div>
      </div>

      {/* ── Ce qui change ──────────────────────────── */}
      <section className="s-block s-wrap">
        <div className="s-sec-head">
          <div className="s-kicker">Ce qui change</div>
          <h2>Fini le planning à refaire chaque semaine</h2>
          <p>Feuille, tableau Excel, groupe WhatsApp… chacun a sa méthode, et chacune prend du temps. Orgaly réunit tout au même endroit.</p>
        </div>
        <div className="s-ba">
          {CHANGES.map((c) => {
            const I = Icon[c.icon];
            return (
              <div key={c.title} className="s-ba-card">
                <div className="s-ba-ico"><I /></div>
                <h3>{c.title}</h3>
                <p className="s-ba-before"><span className="s-sr">Avant : </span>{c.before}</p>
                <p className="s-ba-after"><span className="s-sr">Avec Orgaly : </span>{c.after}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Fonctions ──────────────────────────────── */}
      <section className="s-block s-wrap s-feats" id="fonctions">
        <div className="s-feat s-feat--wide">
          <div className="s-feat-txt">
            <span className="s-tag">Planning</span>
            <h3>Toute la semaine prête en quelques minutes</h3>
            <p>Glissez vos horaires types sur les cases, ou reprenez une semaine déjà faite. Les jours fériés et les jours de fermeture sont signalés tout seuls.</p>
            <ul>
              <li>Horaires types en couleur, à glisser</li>
              <li>Semaines types et « copier la semaine précédente »</li>
              <li>Total d'heures de chacun, en direct</li>
            </ul>
          </div>
          <div className="s-stage">
            <div className="s-browser">
              <div className="s-browser-bar"><i /><i /><i /><span>myorgaly.fr</span></div>
              <img src="/site/planning-semaine.webp" alt="Planning de la semaine dans Orgaly" width="1600" height="924" loading="lazy" />
            </div>
          </div>
        </div>

        <div className="s-feat s-feat--rev">
          <div className="s-feat-txt">
            <span className="s-tag">Sur le téléphone</span>
            <h3>Chacun retrouve son planning dans sa poche</h3>
            <p>Plus besoin d'envoyer le planning en photo ou par message. Vos salariés voient leurs horaires, leurs pauses et leurs heures de la semaine.</p>
            <ul>
              <li>Rien à installer : un lien suffit</li>
              <li>Planning de la semaine et du mois</li>
              <li>Une notification quand une réunion est prévue</li>
            </ul>
          </div>
          <div className="s-stage s-stage--phones">
            <div className="s-phone"><img src="/site/tel-semaine.webp" alt="Planning de la semaine d'une salariée sur téléphone" loading="lazy" /></div>
            <div className="s-phone"><img src="/site/tel-espace.webp" alt="Accueil d'une salariée sur téléphone" loading="lazy" /></div>
          </div>
        </div>

        <div className="s-feat">
          <div className="s-feat-txt">
            <span className="s-tag">Congés</span>
            <h3>Les congés sans SMS ni papier</h3>
            <p>Le salarié fait sa demande depuis son téléphone. Vous la recevez, vous acceptez en un clic, et le solde de congés se met à jour.</p>
            <ul>
              <li>Soldes calculés en jours ouvrés</li>
              <li>Les congés apparaissent dans le planning</li>
              <li>Historique de toutes les demandes</li>
            </ul>
          </div>
          <div className="s-stage s-stage--warm s-stage--phones s-stage--left">
            <div className="s-phone"><img src="/site/tel-conges.webp" alt="Demande de congés sur téléphone" loading="lazy" /></div>
            <div className="s-float" aria-hidden="true">
              <b>Demande de congé</b>
              <div className="s-float-row">
                <span className="s-av">SB</span>
                <div><strong>Sarah Benali</strong><br /><span style={{ color: '#8A8072' }}>Congés payés · du 23 au 27 nov.</span></div>
              </div>
              <div className="s-float-acts"><span>Accepter</span><span>Refuser</span></div>
            </div>
          </div>
        </div>

        <div className="s-feat s-feat--rev s-feat--wide">
          <div className="s-feat-txt">
            <span className="s-tag">Heures</span>
            <h3>Les heures se calculent toutes seules</h3>
            <p>Dès que le planning est fait, Orgaly additionne les heures de chacun et repère les heures supplémentaires. Le pointage est disponible en plus, si vous le souhaitez. Les bulletins préparés sont indicatifs : à faire vérifier par votre expert-comptable.</p>
            <ul>
              <li>Heures supplémentaires et complémentaires</li>
              <li>Récapitulatif du mois par salarié</li>
              <li>Bulletins indicatifs en PDF</li>
            </ul>
          </div>
          <div className="s-stage">
            <div className="s-browser">
              <div className="s-browser-bar"><i /><i /><i /><span>myorgaly.fr</span></div>
              <img src="/site/heures-planning.webp" alt="Planning de la semaine d'une salariée avec ses heures nettes calculées" width="1600" height="475" loading="lazy" />
            </div>
          </div>
        </div>

        <div className="s-feat">
          <div className="s-feat-txt">
            <span className="s-tag s-tag--ia">✦ En option</span>
            <h3>Le planning du mois préparé par l'IA</h3>
            <p>L'IA d'Orgaly s'inspire des habitudes de votre équipe, de vos jours d'ouverture et de vos demandes (« Sarah en repos le 5 »). Orgaly vérifie chaque règle, et rien n'est enregistré avant votre accord.</p>
            <ul>
              <li>Un mois complet en quelques minutes</li>
              <li>Congés et contrats respectés</li>
              <li>Vous retouchez, puis vous validez</li>
            </ul>
            <Link className="s-btn-ghost" to="/tarifs#option-ia" style={{ marginTop: 22 }}>Découvrir l'option</Link>
          </div>
          <div className="s-stage s-stage--navy">
            <div className="s-ia-card" aria-hidden="true">
              <div className="s-ia-title"><span>✦</span>Générer avec l'IA · décembre</div>
              <div className="s-ia-ask">« Sarah en repos le 5 décembre. Toujours quelqu'un à l'ouverture. »</div>
              <div className="s-ia-week">
                <span className="h" />
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d) => <span key={d} className="h">{d}</span>)}
                {IA_WEEK.map((row) => [
                  <span key={row.name} className="n">{row.name}</span>,
                  ...row.cells.map((c, i) => <span key={`${row.name}${i}`} className={c === 'r' ? '' : c}>{IA_LABEL[c]}</span>),
                ])}
              </div>
              <div className="s-ia-ok"><span className="s-check" />Règles vérifiées · à vous de valider</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trois étapes ───────────────────────────── */}
      <section className="s-block s-wrap" style={{ paddingTop: 0 }}>
        <div className="s-sec-head"><div className="s-kicker">Pour démarrer</div><h2>Prêt en trois étapes</h2></div>
        <div className="s-steps">
          <div className="s-step"><h3>Créez votre espace</h3><p>Le nom de votre commerce et vos jours d'ouverture.</p><small>2 minutes</small></div>
          <div className="s-step"><h3>Ajoutez votre équipe</h3><p>Chaque salarié reçoit une invitation par e-mail pour se connecter.</p><small>1 minute par salarié</small></div>
          <div className="s-step"><h3>Faites votre planning</h3><p>Créez vos horaires habituels et glissez-les sur la semaine.</p><small>Et c'est parti</small></div>
        </div>
      </section>

      {/* ── Résumé des tarifs ──────────────────────── */}
      <section className="s-wrap">
        <div className="s-pricing">
          <div>
            <div className="s-kicker" style={{ color: '#8FA6F5' }}>Tarifs</div>
            <h2>Gratuit pour les petites équipes</h2>
            <p className="s-lead">Tout l'abonnement, sans engagement. Vous ne payez que pour les salariés au-delà des {PRICING.freeEmployees} premiers.</p>
            <Link className="s-btn s-btn--white" to="/tarifs" style={{ marginTop: 26 }}>Voir les tarifs</Link>
          </div>
          <div className="s-teaser">
            <div className="s-t-box"><span>Jusqu'à {PRICING.freeEmployees} salariés</span><b>Gratuit</b><small>pour toujours</small></div>
            <div className="s-t-box"><span>Par salarié en plus</span><b>{euros(PRICING.pricePerEmployeeCents)}</b><small>HT par mois</small></div>
            <div className="s-t-box"><span>Au maximum</span><b>{euros(PRICING.monthlyCapCents)}</b><small>HT par mois</small></div>
            <div className="s-t-box"><span>Pour essayer</span><b>{PRICING.trialMonths} mois</b><small>offerts</small></div>
          </div>
        </div>
      </section>

      {/* ── Questions ──────────────────────────────── */}
      <section className="s-block s-wrap" id="questions">
        <div className="s-sec-head"><div className="s-kicker">Questions fréquentes</div><h2>Vous vous demandez peut-être…</h2></div>
        <div className="s-faq">
          {FAQ.map((f, i) => (
            <details key={f.q} className="s-q" open={i === 0}>
              <summary>{f.q}</summary>
              <p>
                {f.a}
                {f.link && <> <Link to={f.link.to} style={{ color: 'var(--s-blue)', fontWeight: 600 }}>{f.link.label}</Link></>}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Bandeau final ──────────────────────────── */}
      <section className="s-wrap">
        <div className="s-final">
          <Logo size={56} />
          <h2>Le plus simple, c'est d'essayer avec votre équipe</h2>
          <p>Gratuit jusqu'à {PRICING.freeEmployees} salariés · {PRICING.trialMonths} mois d'essai · Sans carte bancaire</p>
          <Link className="s-btn s-btn--white" to="/setup/admin">Créer mon espace</Link>
        </div>
      </section>
    </SiteLayout>
  );
}
