const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const req = async (method, url, token, body = null) => {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
};

// Règles de présence par poste (gérant) : { rules, jobTitles }
export const getPresenceRules   = (token)       => req('GET',    '/presence-rules', token);
// { jobTitles: ['Opticien diplômé', …], minCount, scope: 'toujours' | 'jour' }
export const createPresenceRule = (data, token) => req('POST',   '/presence-rules', token, data);
export const deletePresenceRule = (id, token)   => req('DELETE', `/presence-rules/${id}`, token);
