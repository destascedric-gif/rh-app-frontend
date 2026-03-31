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

// Employé
export const getMySchedule    = (start, end, token) =>
  req('GET', `/schedule/my?start=${start}&end=${end}`, token);

// Admin
export const getAdminSchedule = (start, end, userId, token) =>
  req('GET', `/schedule/admin?start=${start}&end=${end}${userId ? `&userId=${userId}` : ''}`, token);

export const createShift = (data, token)      => req('POST',   '/schedule',      token, data);
export const updateShift = (id, data, token)  => req('PUT',    `/schedule/${id}`, token, data);
export const deleteShift = (id, token)        => req('DELETE', `/schedule/${id}`, token);
