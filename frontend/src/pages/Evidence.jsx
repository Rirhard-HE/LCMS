import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import Page from '../components/Page';

const isObjectId = (s) => /^[0-9a-fA-F]{24}$/.test(s || '');
const formatBytes = (n) => {
  if (n == null) return '-';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0, val = n;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};
const truncateHash = (h, head = 10, tail = 10) => {
  if (!h) return '-';
  if (h.length <= head + tail) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
};

export default function Evidence() {
  console.log('EVIDENCE_PAGE');
  const { user } = useAuth();

  // List filters
  const [caseFilter, setCaseFilter] = useState('');
  const [q, setQ] = useState('');

  // Upload form
  const [uploadCaseId, setUploadCaseId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Data
  const [files, setFiles] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Edit modal
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMeta, setEditMeta] = useState('{}');
  const [editTags, setEditTags] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const fetchList = async () => {
    setLoadingList(true);
    try {
      const res = await axiosInstance.get('/api/evidence', {
        headers,
        params: {
          ...(caseFilter ? { caseId: caseFilter } : {}),
          ...(q ? { q } : {}),
        },
      });
      setFiles(res.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to fetch evidence.';
      alert(msg);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { if (user) fetchList(); /* eslint-disable-next-line */ }, [user, caseFilter, q]);

  const upload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    if (!isObjectId(uploadCaseId)) return alert('Invalid Case ID (must be a 24-char hex ObjectId).');

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('caseId', uploadCaseId.trim());
      await axiosInstance.post('/api/evidence', fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      setSelectedFile(null);
      // 保持当前筛选；如想自动同步筛选为上传的 case，可取消下注释
      // setCaseFilter(uploadCaseId.trim());
      await fetchList();
      alert('Upload success.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Upload failed.';
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  const openEdit = async (id) => {
    try {
      const res = await axiosInstance.get(`/api/evidence/${id}`, { headers });
      const ev = res.data;
      setEditing(ev);
      setEditName(ev.originalName || '');
      setEditMeta(JSON.stringify(ev.metadata || {}, null, 2));
      setEditTags((ev.tags || []).join(', '));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to open editor.';
      alert(msg);
    }
  };

  const saveEdit = async () => {
    let parsed = {};
    try { parsed = editMeta ? JSON.parse(editMeta) : {}; }
    catch { return alert('Metadata must be valid JSON.'); }

    setSavingEdit(true);
    try {
      await axiosInstance.put(`/api/evidence/${editing._id}`, {
        originalName: editName,
        metadata: parsed,
        tags: editTags,
      }, { headers });
      setEditing(null);
      await fetchList();
      alert('Saved.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Update failed.';
      alert(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this evidence? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/api/evidence/${id}`, { headers });
      await fetchList();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Delete failed.';
      alert(msg);
    }
  };

  const download = async (id, filename) => {
    try {
      const res = await axiosInstance.get(`/api/evidence/${id}/download`, {
        headers, responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'download';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Download failed.';
      alert(msg);
    }
  };

  if (!user) return <div className="p-6">Please sign in.</div>;

  return (
    <Page
      title="Evidence Management"
      subtitle="Upload, search, edit and delete evidence. Use a valid Case ID to upload."
    >
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Filter by Case ID (optional)</label>
            <input
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="24-char ObjectId"
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Search by filename</label>
            <input
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. report.pdf"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={fetchList} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">Refresh</button>
            <button
              onClick={() => { setCaseFilter(''); setQ(''); }}
              className="px-4 py-2 bg-white border hover:bg-gray-50 rounded-lg"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 mb-8">
        <form onSubmit={upload} className="grid sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Case ID (required for upload)</label>
            <input
              className={`w-full p-2.5 border rounded-lg focus:ring-2 ${uploadCaseId && !isObjectId(uploadCaseId) ? 'border-red-400 focus:ring-red-500' : 'focus:ring-blue-500'}`}
              placeholder="24-char ObjectId"
              value={uploadCaseId}
              onChange={(e) => setUploadCaseId(e.target.value)}
            />
            {uploadCaseId && !isObjectId(uploadCaseId) && (
              <p className="text-xs text-red-600 mt-1">Invalid ObjectId format.</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Select file</label>
            <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="w-full" />
            <p className="text-xs text-gray-500 mt-1">Large files are supported; hashing is done server-side.</p>
          </div>
          <div className="sm:col-span-3">
            <button
              disabled={!selectedFile || !isObjectId(uploadCaseId) || uploading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {loadingList && <div className="text-gray-500 text-sm">Loading…</div>}
        {!loadingList && files.length === 0 && <div className="text-gray-500 text-sm">No evidence found.</div>}
        {!loadingList && files.map(f => (
          <div key={f._id} className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-medium text-gray-900 truncate">{f.originalName}</div>
                <div className="text-sm text-gray-600">
                  Size: {formatBytes(f.size)} · MIME: {f.mimeType || '-'} · Hash: <span title={f.hash}>{truncateHash(f.hash)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Case: {f.caseId}</div>
                {Array.isArray(f.tags) && f.tags.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">Tags: {f.tags.join(', ')}</div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => download(f._id, f.originalName)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Download</button>
                <button onClick={() => openEdit(f._id)} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Edit</button>
                <button onClick={() => remove(f._id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow w-full max-w-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Edit evidence</h2>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Filename (display)</label>
              <input
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Metadata (JSON)</label>
              <textarea
                className="w-full p-2.5 border rounded-lg font-mono h-40 focus:ring-2 focus:ring-blue-500"
                value={editMeta}
                onChange={(e) => setEditMeta(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Tip: Use valid JSON, e.g. {"{ \"note\": \"...\" }"}.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">Tags (comma separated)</label>
              <input
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. image, pdf"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-100 rounded-lg" onClick={() => setEditing(null)}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
