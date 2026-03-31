const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const req = async (method, url, token, body = null) => {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
};

// Employé
export const getMyBalance      = (token)              => req('GET',   '/leaves/balance', token);
export const getMyRequests     = (token)              => req('GET',   '/leaves/my-requests', token);
export const submitRequest     = (data, token)        => req('POST',  '/leaves/request', token, data);
export const getNotifications  = (token)              => req('GET',   '/leaves/notifications', token);
export const markAllRead       = (token)              => req('PATCH', '/leaves/notifications/read-all', token);

// Admin
export const getAllRequests     = (status, token)     => req('GET',   `/leaves/admin/requests${status ? `?status=${status}` : ''}`, token);
export const reviewRequest     = (id, data, token)   => req('PATCH', `/leaves/admin/requests/${id}`, token, data);
export const getEmployeeBalance = (userId, token)    => req('GET',   `/leaves/admin/balances/${userId}`, token);
