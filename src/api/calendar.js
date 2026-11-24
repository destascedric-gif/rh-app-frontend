const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const req = async (method, url, token) => {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
};

// Planning dans l'agenda du téléphone : lien personnel (.ics)
export const getCalendarLink   = (token) => req('GET', '/calendar/link', token);
export const resetCalendarLink = (token) => req('POST', '/calendar/link/reset', token);
