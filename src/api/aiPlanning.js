const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const req = async (method, url, token, body = null) => {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Erreur serveur');
    err.status = res.status;
    err.problems = data.problems;
    throw err;
  }
  return data;
};

// Planning généré par IA (gérant)
// Ce qu'Orgaly sait avant de générer : { warnings, people, range, … }
export const getAiPlanningFacts = (year, month, token) => req('GET', `/ai-planning/facts?year=${year}&month=${month}`, token);
// « Oui, la fiche est juste »
export const confirmContract = (userId, token) => req('POST', '/ai-planning/confirm-contract', token, { userId });
// { year, month, mode, requests, previous?: { slots }, refinement? } → proposition (rien n'est écrit)
export const generateAiPlanning = (data, token) => req('POST', '/ai-planning/generate', token, data);
// { year, month, mode, slots } → { added, replaced }
export const applyAiPlanning = (data, token) => req('POST', '/ai-planning/apply', token, data);
