import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import Page from '../components/Page';

export default function Cases() {
  const { user } = useAuth();

  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const token = user?.token;
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const fetchList = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/cases', { headers });
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to fetch cases.';
      // eslint-disable-next-line no-alert
      alert(msg);
    }
  }, [headers]);

  useEffect(() => {
    if (user) fetchList();
  }, [user, fetchList]); // ✅ 把 fetchList 放进依赖

  const createCase = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setBusy(true);
    try {
      await axiosInstance.post('/api/cases', form, { headers });
      setForm({ title: '', description: '' });
      fetchList(); // 复用稳定的 fetchList
    } catch (err) {
      const msg = err?.response?.data?.message || 'Create case failed.';
      // eslint-disable-next-line no-alert
      alert(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Cases">
      <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ margin: '16px 0' }}>Case List</h2>

        <form onSubmit={createCase} style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            />
            <textarea
              placeholder="Description"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
            />
            <button type="submit" disabled={busy}>
              {busy ? 'Creating...' : 'Create Case'}
            </button>
          </div>
        </form>

        <ul style={{ paddingLeft: 16 }}>
          {list.map((c) => (
            <li key={c._id || c.id}>
              <strong>{c.title}</strong>
              {c.description ? <span> — {c.description}</span> : null}
            </li>
          ))}
          {list.length === 0 && <li>No data</li>}
        </ul>
      </div>
    </Page>
  );
}
