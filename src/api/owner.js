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
export const getOwnerActivity   = (params, token) => req('GET', `/owner/activity?${new URLSearchParams(params)}`, token);
export const getOwnerHealth     = (token)         => req('GET', '/owner/health', token);
export const getOwnerCompany    = (id, token)     => req('GET', `/owner/companies/${id}`, token);
// Intelligence artificielle : dépenses et crédit estimé ; visites du site
export const getOwnerAi          = (days, token)         => req('GET', `/owner/ai?days=${days}`, token);
// { kind: 'recharge' | 'releve', amount } → crédit recalculé
export const addOwnerAiCredit    = (data, token)         => req('POST', '/owner/ai/credit', token, data);
export const deleteOwnerAiCredit = (id, token)           => req('DELETE', `/owner/ai/credit/${id}`, token);
export const getOwnerVisits      = (days, token)         => req('GET', `/owner/visits?days=${days}`, token);
