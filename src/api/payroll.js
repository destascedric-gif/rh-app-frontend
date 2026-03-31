const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const req = async (method, url, token, body = null) => {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Erreur serveur');
  }
  return res;
};

export const getAllPayslips = async (filters, token) => {
  const params = new URLSearchParams(filters).toString();
  const res    = await req('GET', `/payroll${params ? '?' + params : ''}`, token);
  return res.json();
};

// Génère un bulletin et déclenche le téléchargement PDF
export const generatePayslip = async (data, token) => {
  const res = await req('POST', '/payroll/generate', token, data);
  return res.blob();
};

// Télécharge un bulletin existant en PDF
export const downloadPayslip = async (id, token) => {
  const res = await req('GET', `/payroll/${id}/pdf`, token);
  return res.blob();
};

export const generateAllPayslips = async (data, token) => {
  const res = await req('POST', '/payroll/generate-all', token, data);
  return res.json();
};

export const deletePayslip = async (id, token) => {
  const res = await req('DELETE', `/payroll/${id}`, token);
  return res.json();
};

// Utilitaire : déclenche le téléchargement du blob PDF dans le navigateur
export const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
