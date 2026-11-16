import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../../components/BrandMark';
import './site.css';

// Cadre commun du site vitrine (accueil, tarifs, contact) : en-tête,
// pied de page, titre de l'onglet. Maquette validée le 16 nov. 2026.

export const CONTACT_EMAIL = 'contact@myorgaly.fr';
export const INSTAGRAM_URL = 'https://www.instagram.com/myorgaly/';

export function Logo({ size = 34 }) {
  return (
    <span className="s-logo" style={{ width: size, height: size }}>
      <BrandMark size={Math.round(size * 0.62)} />
    </span>
  );
}

function homePathFor(user) {
  if (!user) return null;
  if (user.role === 'owner') return '/pilotage';
  if (user.role === 'admin') return '/dashboard';
  return '/mon-espace';
}

export default function SiteLayout({ title, children }) {
  const { user } = useAuth();
  const { pathname, hash } = useLocation();
  const homePath = homePathFor(user);

  useEffect(() => { if (title) document.title = title; }, [title]);

  // Lien vers une ancre (« /#fonctions ») depuis une autre page : on
  // descend jusqu'à elle une fois la page affichée ; sinon, haut de page.
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="s-site">
      <header className="s-header">
        <div className="s-wrap s-head">
          <Link className="s-brand" to="/"><Logo /> Orgaly</Link>
          <nav className="s-nav" aria-label="Navigation principale">
            <Link to="/#fonctions">Fonctionnalités</Link>
            <NavLink to="/tarifs" className={({ isActive }) => (isActive ? 'is-on' : '')}>Tarifs</NavLink>
            <Link to={pathname === '/tarifs' ? '/tarifs#questions' : '/#questions'}>Questions</Link>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? 'is-on' : '')}>Contact</NavLink>
          </nav>
          <div className="s-head-r">
            {homePath
              ? <Link className="s-btn" to={homePath}>Mon espace</Link>
              : (
                <>
                  <Link className="s-login" to="/login">Se connecter</Link>
                  <Link className="s-btn" to="/setup/admin">Essayer gratuitement</Link>
                </>
              )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="s-footer">
        <div className="s-wrap">
          <div className="s-foot">
            <div>
              <Link className="s-brand" to="/"><Logo /> Orgaly</Link>
              <p className="s-tagline">La gestion d'équipe simple, même sans service RH.</p>
            </div>
            <div>
              <h4>Produit</h4>
              <Link to="/#fonctions">Fonctionnalités</Link>
              <Link to="/tarifs">Tarifs</Link>
              <Link to="/#questions">Questions</Link>
              <Link to="/login">Se connecter</Link>
            </div>
            <div>
              <h4>Contact</h4>
              <Link to="/contact">Nous écrire</Link>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram @myorgaly</a>
            </div>
            <div>
              <h4>Légal</h4>
              <Link to="/mentions-legales">Mentions légales</Link>
              <Link to="/cgu">CGU</Link>
              <Link to="/cgv">CGV</Link>
              <Link to="/confidentialite">Confidentialité</Link>
              <Link to="/dpa">Sous-traitance (DPA)</Link>
            </div>
          </div>
          <div className="s-copy">© {new Date().getFullYear()} Orgaly</div>
        </div>
      </footer>
    </div>
  );
}
