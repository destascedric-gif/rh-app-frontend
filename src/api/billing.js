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
// product : 'base' (abonnement Orgaly, interval 'month' | 'year') ou 'ai' (option IA, au mois)
export const startCheckout  = (token, product, interval = 'month') =>
  req('POST', '/billing/checkout', token, { acceptCgv: true, product, interval });
export const openPortal     = (token) => req('POST', '/billing/portal', token);
// Demande de l'option IA avancée par e-mail (tant que le paiement en ligne n'est pas ouvert) → { requestedAt }
export const requestAiOption = (token) => req('POST', '/billing/ai-request', token);
