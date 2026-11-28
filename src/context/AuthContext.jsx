import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Date de fin de validité du jeton de connexion (ms), lue dans le jeton
// lui-même ; null si illisible.
const tokenExpiry = (jwtToken) => {
  try {
    const part = jwtToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(part));
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
};

const isExpired = (jwtToken) => {
  const exp = tokenExpiry(jwtToken);
  return exp !== null && exp <= Date.now();
};

export const AuthProvider = ({ children }) => {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Recharge l'état depuis le localStorage au démarrage. Un jeton expiré
  // (au bout de 7 jours) est oublié : la personne retrouve la page de
  // connexion au lieu de pages pleines d'erreurs « Token expiré » (audit du
  // 28 nov. 2026).
  useEffect(() => {
    const savedToken = localStorage.getItem('rh_token');
    const savedUser  = localStorage.getItem('rh_user');
    if (savedToken && savedUser) {
      try { localStorage.setItem('orgaly_no_track', '1'); } catch { /* stockage indisponible */ }
      if (isExpired(savedToken)) {
        localStorage.removeItem('rh_token');
        localStorage.removeItem('rh_user');
      } else {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('rh_token', jwtToken);
    localStorage.setItem('rh_user', JSON.stringify(userData));
    // Navigateur d'une personne qui a un compte (gérant, salarié,
    // propriétaire) : ses visites des pages publiques ne sont plus comptées
    try { localStorage.setItem('orgaly_no_track', '1'); } catch { /* stockage indisponible */ }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rh_token');
    localStorage.removeItem('rh_user');
  };

  // Page restée ouverte jusqu'à la fin de validité du jeton : déconnexion à
  // ce moment-là (les pages protégées renvoient alors vers la connexion).
  useEffect(() => {
    if (!token) return undefined;
    const exp = tokenExpiry(token);
    if (exp === null) return undefined;
    const delay = exp - Date.now();
    if (delay > 2 ** 31 - 1) return undefined; // au-delà de ~24 jours : setTimeout ne sait pas faire
    const timer = setTimeout(logout, Math.max(0, delay));
    return () => clearTimeout(timer);
  }, [token]);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
