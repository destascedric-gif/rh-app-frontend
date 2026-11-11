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

// Semaines types du planning (gérant)
export const getWeekTemplates   = (token)           => req('GET',    '/week-templates', token);
// { name, weekStart } : enregistre la semaine qui commence ce lundi-là
export const createWeekTemplate = (data, token)     => req('POST',   '/week-templates', token, data);
// { name } pour renommer, { weekStart } pour remplacer le contenu
export const updateWeekTemplate = (id, data, token) => req('PUT',    `/week-templates/${id}`, token, data);
export const deleteWeekTemplate = (id, token)       => req('DELETE', `/week-templates/${id}`, token);
// { weekStart, mode: 'empty' | 'replace', templateId } ou { …, copyPrevious: true }
export const applyWeekTemplate  = (data, token)     => req('POST',   '/week-templates/apply', token, data);
// { weekStart, userIds } : vide la semaine (créneaux et repos, jamais les congés) ;
// renvoie { deleted, slots } — slots à renvoyer à applyWeekTemplate pour annuler
export const clearWeek          = (data, token)     => req('POST',   '/week-templates/clear', token, data);
