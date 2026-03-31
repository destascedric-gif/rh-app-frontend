const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Helpers ───────────────────────────────────────────
const post = async (url, body, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${url}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
};

const get = async (url, token = null) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${url}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
};

// ── Auth API ──────────────────────────────────────────
export const checkSetupStatus = ()               => get('/auth/setup-status');
export const setupAdmin       = (data)           => post('/auth/setup/admin', data);
export const setupCompany     = (data, token)    => post('/auth/setup/company', data, token);
export const login            = (data)           => post('/auth/login', data);
export const inviteEmployee   = (data, token)    => post('/auth/invite', data, token);
export const acceptInvite     = (data)           => post('/auth/accept-invite', data);
