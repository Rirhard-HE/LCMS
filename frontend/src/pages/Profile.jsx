import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import Page from '../components/Page';

export default function Profile() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    university: '',
    address: '',
  });

  const token = user?.token;
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/auth/profile', { headers });
      const p = res.data || {};
      setForm({
        name: p.name || '',
        email: p.email || '',
        university: p.university || '',
        address: p.address || '',
      });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load profile.';
      // eslint-disable-next-line no-alert
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put('/api/auth/profile', form, { headers });
      // eslint-disable-next-line no-alert
      alert('Saved.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Save failed.';
      // eslint-disable-next-line no-alert
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="Profile">
      <div className="container" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '16px 0' }}>Profile</h2>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <form onSubmit={save} style={{ display: 'grid', gap: 10 }}>
            <label>
              <div>Name</div>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              />
            </label>
            <label>
              <div>Email</div>
              <input
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              />
            </label>
            <label>
              <div>University</div>
              <input
                value={form.university}
                onChange={(e) => setForm((s) => ({ ...s, university: e.target.value }))}
              />
            </label>
            <label>
              <div>Address</div>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              />
            </label>

            <div>
              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Page>
  );
}
