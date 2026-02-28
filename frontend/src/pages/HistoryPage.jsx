import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const ENERGY_LABEL = { 20: 'Wrecked', 40: 'Low', 65: 'Good', 85: 'Strong' };
const EFFORT_COLOR = {
  too_easy:     'green',
  just_right:   'green',
  too_much:     'red',
  didnt_finish: 'default',
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats]       = useState(null);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      client.get(`/history?page=${page}`),
      client.get('/history/stats'),
    ]).then(([histRes, statsRes]) => {
      setSessions(histRes.data.sessions);
      setTotal(histRes.data.total);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-white px-5 pt-14 pb-28">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Activity</p>
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.total_sessions}</p>
              <p className="text-xs text-gray-400 mt-1">Sessions</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.completed_sessions}</p>
              <p className="text-xs text-gray-400 mt-1">Completed</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.avg_readiness}</p>
              <p className="text-xs text-gray-400 mt-1">Avg score</p>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No sessions yet. Complete a check-in to get started!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <Card key={s.checkin_id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                        {ENERGY_LABEL[s.layer1_energy] || '•'}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">
                        {s.primary_session_type || 'Check-in only'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(s.timestamp).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Readiness: {s.computed_readiness}
                    </p>
                  </div>
                  {s.effort_rating && (
                    <Badge color={EFFORT_COLOR[s.effort_rating] || 'default'}>
                      {s.effort_rating.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              </Card>
            ))}

            <div className="flex justify-center gap-4 pt-4">
              {page > 1 && (
                <button onClick={() => setPage((p) => p - 1)} className="text-sm text-blue-400 font-semibold tap-target">
                  ← Previous
                </button>
              )}
              {sessions.length === 10 && page * 10 < total && (
                <button onClick={() => setPage((p) => p + 1)} className="text-sm text-blue-400 font-semibold tap-target">
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
