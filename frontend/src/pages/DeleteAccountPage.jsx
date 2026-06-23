import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function DeleteAccountPage() {
  const navigate  = useNavigate();
  const { logout } = useAuth();

  const [typed,    setTyped]    = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');

  const ready = typed.trim().toUpperCase() === 'DELETE';

  async function handleDelete() {
    if (!ready) return;
    setDeleting(true);
    setError('');
    try {
      await client.delete('/account');
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <button
          onClick={() => navigate('/profile')}
          className="text-blue-400 text-sm font-semibold mb-4 flex items-center gap-1"
        >
          ← Back to profile
        </button>
        <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-1">Danger zone</p>
        <h1 className="text-2xl font-bold text-gray-900">Delete account</h1>
        <p className="text-sm text-gray-400 mt-1">This is permanent and cannot be undone.</p>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* Warning card */}
        <div className="bg-red-50 border border-red-200 rounded-3xl p-5">
          <p className="font-bold text-red-700 text-sm mb-2">The following will be permanently deleted:</p>
          <ul className="text-sm text-red-600 flex flex-col gap-1.5 list-disc list-inside">
            <li>All daily check-ins and body map history</li>
            <li>All workout logs and AI recommendations</li>
            <li>All wearable connections and synced data</li>
            <li>Your profile and account</li>
          </ul>
        </div>

        {/* Confirm input */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-700">
            Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-500">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="DELETE"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={deleting}
            className={`w-full rounded-2xl border-2 px-4 py-3 text-base font-mono tracking-widest outline-none transition-colors
              ${typed.length > 0 ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-blue-300'}`}
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={handleDelete}
            disabled={!ready || deleting}
            className={`w-full font-bold rounded-2xl py-4 text-base transition-colors tap-target
              ${ready && !deleting
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            {deleting ? 'Deleting…' : 'Permanently delete my account'}
          </button>

          <button
            onClick={() => navigate('/profile')}
            disabled={deleting}
            className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600 tap-target transition-colors border border-gray-200 rounded-2xl py-3.5"
          >
            Cancel — keep my account
          </button>
        </div>
      </div>
    </div>
  );
}
