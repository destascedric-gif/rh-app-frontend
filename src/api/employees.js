const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const request = async (method, url, token, body = null) => {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
};

export const getEmployees       = (token)           => request('GET',  '/employees', token);
export const getEmployee        = (id, token)       => request('GET',  `/employees/${id}`, token);
export const updateEmployee     = (id, data, token) => request('PUT',  `/employees/${id}`, token, data);
export const deactivateEmployee = (id, token)       => request('DELETE', `/employees/${id}`, token);

export const getPayslips        = (id, token)       => request('GET',  `/employees/${id}/payslips`, token);
export const getDocuments       = (id, token)       => request('GET',  `/employees/${id}/documents`, token);
export const addDocument        = (id, data, token) => request('POST', `/employees/${id}/documents`, token, data);
export const getTimesheets      = (id, params, token) =>
  request('GET', `/employees/${id}/timesheets?${new URLSearchParams(params)}`, token);
