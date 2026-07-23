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

export const getShiftTemplates    = (token)           => req('GET',    '/shift-templates', token);
export const createShiftTemplate  = (data, token)     => req('POST',   '/shift-templates', token, data);
export const updateShiftTemplate  = (id, data, token) => req('PUT',    `/shift-templates/${id}`, token, data);
export const deleteShiftTemplate  = (id, token)       => req('DELETE', `/shift-templates/${id}`, token);
