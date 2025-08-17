import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import Page from '../components/Page';

export default function Evidence() {
  const { user } = useAuth();

  const [caseFilter, setCaseFilter] = useState('');
  const [q, setQ] = useState('');
  const [files, setFiles] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCaseId, setUploadCaseId] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMeta, setEditMeta] = useState('{}');
  const [editTags, setEditTags] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const token = user?.token;
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await axiosInstance.get('/api/evidence', {
        headers,
        params: {
          ...(caseFilter ? { caseId: caseFilter } : {}),
          ...(q ? { q } : {}),
        },
      });
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to fetch evidence.';
      // eslint-disable-next-line no-alert
      alert(msg);
    } finally {
      setLoadingList(false);
    }
  }, [headers, caseFilter, q]);

  useEffect(() => {
    if (user) fetchList();
  }, [user, fetchList]);

  const upload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (uploadCaseId) formData.append('caseId', uploadCaseId);
      await axiosInstance.post('/api/evidence', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      setSelectedFile(null);
      setUploadCaseId('');
      fetchList();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Upload failed.';
      // eslint-disable-next-line no-alert
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (item) => {
    setEditing(item);
    setEditName(item?.name || '');
    setEditMeta(
      (() => {
        try {
          return JSON.stringify(item?.meta ?? {}, null, 2);
        } catch {
          return '{}';
        }
      })()
    );
    setEditTags(Array.isArray(item?.tags) ? item.tags.join(',') : '');
  };

  const saveEdit = async () => {
    if (!editing?._id && !editing?.id) return;
    setSavingEdit(true);
    try {
      let metaObj = {};
      try {
        metaObj = editMeta ? JSON.parse(editMeta) : {};
      } catch {
        // eslint-disable-next-line no-alert
        alert('Meta JSON is invalid.');
        setSavingEdit(false);
        return;
      }
      const id = editing._id || editing.id;
      await axiosInstance.put(
        `/api/evidence/${id}`,
        { name: editName, meta: metaObj, tags: editTags.split(',').map((s) => s.trim()).filter(Boolean) },
        { headers }
      );
      setEditing(null);
      fetchList();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Update failed.';
      // eslint-disable-next-line no-alert
      alert(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const remove = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this file?')) return;
    try {
      await axiosInstance.delete(`/api/evidence/${id}`, { headers });
      fetchList();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Delete failed.';
      // eslint-disable-next-line no-alert
      alert(msg);
    }
  };

  const download = async (id) => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/api/evidence/${id}/download`, {
        headers,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.bin`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Download failed.';
      // eslint-disable-next-line no-alert
      alert(msg);
    }
  };

  return (
    <Page title="Evidence">
      <div className="container" style={{ maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ margin: '16px 0' }}>Evidence</h2>

        <section style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <input
            placeholder="Filter by Case ID"
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
          />
          <input
            placeholder="Search keyword"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={fetchList} disabled={loadingList}>
            {loadingList ? 'Loading...' : 'Refresh'}
          </button>
        </section>

        <section style={{ border: '1px solid #eee', padding: 12, marginBottom: 20 }}>
          <h4>Upload</h4>
          <form onSubmit={upload} style={{ display: 'grid', gap: 8 }}>
            <input
              placeholder="Case ID (optional)"
              value={uploadCaseId}
              onChange={(e) => setUploadCaseId(e.target.value)}
            />
            <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            <button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </section>

        <ul style={{ paddingLeft: 16 }}>
          {files.map((f) => (
            <li key={f._id || f.id} style={{ marginBottom: 8 }}>
              <div>
                <strong>{f.name || f.filename || (f._id || f.id)}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => download(f._id || f.id)}>Download</button>
                <button onClick={() => openEdit(f)}>Edit</button>
                <button onClick={() => remove(f._id || f.id)}>Delete</button>
              </div>
            </li>
          ))}
          {files.length === 0 && <li>No data</li>}
        </ul>

        {editing && (
          <section style={{ border: '1px solid #eee', padding: 12, marginTop: 12 }}>
            <h4>Edit</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                placeholder="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <textarea
                placeholder="Meta (JSON)"
                rows={6}
                value={editMeta}
                onChange={(e) => setEditMeta(e.target.value)}
              />
              <input
                placeholder="Tags (comma separated)"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveEdit} disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}
