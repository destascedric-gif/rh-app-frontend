import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Recharge l'état depuis le localStorage au démarrage
  useEffect(() => {
    const savedToken = localStorage.getItem('rh_token');
    const savedUser  = localStorage.getItem('rh_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      try { localStorage.setItem('orgaly_no_track', '1'); } catch { /* stockage indisponible */ }
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

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
