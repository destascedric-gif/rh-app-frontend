const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const req = async (method, url, token, body = null) => {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
};

// Page de pilotage (propriétaire d'Orgaly uniquement)
export const getOwnerStats      = (days, token) => req('GET', `/owner/stats?days=${days}`, token);
export const setupOwnerPassword = (data)        => req('POST', '/owner/setup', null, data);
