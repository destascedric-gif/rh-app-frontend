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

export const getBilling     = (token) => req('GET',  '/billing', token);
// Renvoient { url } : la page Stripe vers laquelle rediriger le navigateur
export const startCheckout  = (token) => req('POST', '/billing/checkout', token, { acceptCgv: true });
export const openPortal     = (token) => req('POST', '/billing/portal', token);
