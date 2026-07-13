import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

function relativeDate(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const dateOnly = dateStr.slice(0, 10);
  const diffMs = now.setHours(0, 0, 0, 0) - new Date(dateOnly).getTime();
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1) return `${diffDays} days ago`;
  return dateOnly;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    client.get('/admin/users')
      .then(res => {
        setUsers(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 403) {
          setDenied(true);
        } else {
          setError(err.response?.data?.error || 'Failed to load users');
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-700 font-medium">Access denied</p>
        <button onClick={() => navigate('/')} className="text-blue-500 underline text-sm">
          Back to home
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={() => navigate('/')} className="text-blue-500 underline text-sm">
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          &larr; Back
        </button>
        <h1 className="text-xl font-semibold text-gray-800">User Activity</h1>
        <span className="ml-auto text-sm text-gray-400">{users.length} users</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Last active</th>
              <th className="px-4 py-3 font-medium">Streak</th>
              <th className="px-4 py-3 font-medium">Sessions (7d)</th>
              <th className="px-4 py-3 font-medium">Wearable</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            )}
            {users.map((user, idx) => (
              <tr
                key={user.id}
                className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}
              >
                <td className="px-4 py-3 max-w-[200px] sm:max-w-xs">
                  <span className="block truncate text-gray-800" title={user.email}>
                    {user.email}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {relativeDate(user.last_active)}
                </td>
                <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                  {user.current_streak > 0 ? `${user.current_streak} 🔥` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {user.sessions_this_week ?? 0}
                </td>
                <td className="px-4 py-3">
                  {user.wearable_connected
                    ? <span className="text-green-600 font-medium">✓</span>
                    : <span className="text-gray-400">–</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
