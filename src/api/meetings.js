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

// Gérant : toutes les réunions de l'entreprise ; employé : les siennes
export const getMeetings   = (start, end, token) => req('GET', `/meetings?start=${start}&end=${end}`, token);
export const createMeeting = (data, token)       => req('POST',   '/meetings', token, data);
export const updateMeeting = (id, data, token)   => req('PUT',    `/meetings/${id}`, token, data);
export const deleteMeeting = (id, token)         => req('DELETE', `/meetings/${id}`, token);
