import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import Page from '../components/Page';

export default function Profile() {
  console.log('PROFILE_PAGE');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', university: '', address: '' });

  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const load = async () => {
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
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put('/api/auth/profile', {
        name: form.name,
        university: form.university,
        address: form.address,
      }, { headers });
      alert('Profile updated.');
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update profile.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const onClearOptionals = () => {
    setForm((f) => ({ ...f, university: '', address: '' }));
  };

  if (!user) return <div className="p-6">Please sign in.</div>;
  if (loading) return <div className="p-6">Loading profile…</div>;

  return (
    <Page title="Profile" subtitle="Update your personal information.">
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email (read-only)</label>
            <input
              className="w-full p-2.5 border rounded-lg bg-gray-50 text-gray-600"
              value={form.email}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">University (optional)</label>
            <input
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              placeholder="e.g. SJTU"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Address (optional)</label>
            <input
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="City, Street"
            />
          </div>

        {/* Actions */}
          <div className="sm:col-span-2 flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={onClearOptionals}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Clear optional fields
            </button>
          </div>
        </form>
      </div>
    </Page>
  );
}
