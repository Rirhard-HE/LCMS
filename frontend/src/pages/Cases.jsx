import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import Page from '../components/Page';

export default function Cases() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: '', description: '' });
  const [busy, setBusy] = useState(false);

  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const fetchList = async () => {
    try {
      const res = await axiosInstance.get('/api/cases', { headers });
      setList(res.data);
    } catch {
      alert('Failed to fetch cases.');
    }
  };

  useEffect(() => { if (user) fetchList(); /* eslint-disable-next-line */ }, [user]);

  const createCase = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    setBusy(true);
    try {
      await axiosInstance.post('/api/cases', form, { headers });
      setForm({ title: '', description: '' });
      fetchList();
    } catch {
      alert('Create failed.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Case ID copied.');
    } catch {
      alert(text);
    }
  };

  if (!user) return <div className="p-6">Please sign in.</div>;

  return (
    <Page
      title="Case Management"
      subtitle="Create and manage investigation cases."
      actions={null}
    >
      {/* Create form */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 mb-8">
        <form onSubmit={createCase} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="block text-sm text-gray-700 mb-1">Title</label>
            <input
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Case title"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional notes"
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={busy}
            >
              {busy ? 'Creating…' : 'Create case'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {list.map(c => (
          <div key={c._id} className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-medium text-gray-900">{c.title}</div>
                <div className="text-sm text-gray-600">Status: {c.status}</div>
                <div className="text-xs text-gray-500 mt-1">ID: {c._id}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copy(c._id)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  Copy ID
                </button>
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-gray-500 text-sm">No cases yet.</div>
        )}
      </div>
    </Page>
  );
}
