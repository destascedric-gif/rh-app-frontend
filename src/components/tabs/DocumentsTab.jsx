import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDocuments, addDocument } from '../../api/employees';

const DOC_TYPES = ['contrat', 'avenant', 'autre'];

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024)       return `${bytes} o`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
};

export default function DocumentsTab({ employeeId }) {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ name: '', type: 'contrat', fileUrl: '' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    try {
      const data = await getDocuments(employeeId, token);
      setDocuments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [employeeId, token]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await addDocument(employeeId, form, token);
      setShowForm(false);
      setForm({ name: '', type: 'contrat', fileUrl: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="tab-loading">Chargement…</p>;

  return (
    <div className="documents-tab">
      <div className="tab-toolbar">
        <h3>{documents.length} document{documents.length > 1 ? 's' : ''}</h3>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Ajouter un document'}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <form className="inline-form" onSubmit={handleAdd}>
          <div className="field">
            <label>Nom du document *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contrat CDI — Janvier 2025"
              required
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>URL du fichier *</label>
              <input
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Ajouter'}
          </button>
        </form>
      )}

      {/* Liste */}
      {documents.length === 0 ? (
        <p className="empty-state">Aucun document enregistré.</p>
      ) : (
        <div className="doc-list">
          {documents.map((doc) => (
            <div key={doc.id} className="doc-card">
              <div className="doc-icon">
                {doc.type === 'contrat' ? '📄' : doc.type === 'avenant' ? '📝' : '📎'}
              </div>
              <div className="doc-info">
                <div className="doc-name">{doc.name}</div>
                <div className="doc-meta">
                  <span className="tag">{doc.type}</span>
                  {doc.file_size && <span>{formatSize(doc.file_size)}</span>}
                  <span>Ajouté par {doc.uploaded_by_name}</span>
                  <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                Ouvrir
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
