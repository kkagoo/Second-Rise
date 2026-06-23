import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { EmptyStateIllustration } from '../components/ui/Illustrations';

const ENERGY_LABEL = { 20: 'Wrecked', 40: 'Low', 65: 'Good', 85: 'Strong' };
const EFFORT_COLOR = {
  too_easy:     'green',
  just_right:   'green',
  too_much:     'red',
  didnt_finish: 'default',
};

const INTENSITY_COLOR = {
  easy:     'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  hard:     'bg-orange-100 text-orange-700',
  max:      'bg-red-100 text-red-700',
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('sessions');

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [stats, setStats]       = useState(null);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [sessLoading, setSessLoading] = useState(true);

  // Activity log state
  const [activities, setActivities] = useState([]);
  const [actTotal, setActTotal]     = useState(0);
  const [actPage, setActPage]       = useState(1);
  const [actLoading, setActLoading] = useState(true);

  useEffect(() => {
    setSessLoading(true);
    Promise.all([
      client.get(`/history?page=${page}`),
      client.get('/history/stats'),
    ]).then(([histRes, statsRes]) => {
      setSessions(histRes.data.sessions);
      setTotal(histRes.data.total);
      setStats(statsRes.data);
    }).finally(() => setSessLoading(false));
  }, [page]);

  useEffect(() => {
    setActLoading(true);
    client.get(`/activity?limit=20&offset=${(actPage - 1) * 20}`)
      .then((res) => {
        setActivities(res.data.activities);
        setActTotal(res.data.total);
      })
      .finally(() => setActLoading(false));
  }, [actPage]);

  async function deleteActivity(id) {
    await client.delete(`/activity/${id}`);
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setActTotal((n) => n - 1);
  }

  function exportCSV() {
    const token = localStorage.getItem('sr_token');
    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    window.open(`${base}/activity/export.csv?t=${token}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="px-5 pt-14 pb-4">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Activity</p>
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <div className="flex gap-2">
            {tab === 'activities' && (
              <button
                onClick={exportCSV}
                className="text-xs font-semibold text-blue-400 border border-blue-200 rounded-xl px-3 py-1.5 tap-target"
              >
                Export CSV
              </button>
            )}
            <button
              onClick={() => navigate('/pain-history')}
              className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl px-3 py-1.5 tap-target"
            >
              📊 Pain chart
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setTab('sessions')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold tap-target transition-all ${tab === 'sessions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
          >
            Sessions
          </button>
          <button
            onClick={() => setTab('activities')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold tap-target transition-all ${tab === 'activities' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
          >
            Activities
          </button>
        </div>
      </div>

      {/* ── Sessions tab ── */}
      {tab === 'sessions' && (
        <div className="px-5 max-w-md mx-auto">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="text-center">
                <p className="text-3xl font-bold text-blue-400">{stats.completed_sessions}</p>
                <p className="text-xs text-gray-400 mt-1">Workouts done</p>
              </Card>
              <Card className="text-center">
                <p className="text-3xl font-bold text-blue-400">{stats.avg_readiness}</p>
                <p className="text-xs text-gray-400 mt-1">Avg energy</p>
              </Card>
            </div>
          )}

          {sessLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-4">
              <EmptyStateIllustration size={100} />
              <div className="text-center">
                <p className="font-semibold text-gray-700">No sessions yet</p>
                <p className="text-sm text-gray-400 mt-1">Complete a check-in to get started!</p>
              </div>
            </div>
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
                      <p className="text-xs text-gray-400 mt-0.5">Readiness: {s.computed_readiness}</p>
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
      )}

      {/* ── Activities tab ── */}
      {tab === 'activities' && (
        <div className="px-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">{actTotal} activities logged</p>
            <button
              onClick={() => navigate('/log-activity')}
              className="bg-blue-400 text-white text-sm font-semibold rounded-xl px-4 py-2 tap-target"
            >
              + Log activity
            </button>
          </div>

          {actLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-4">
              <p className="text-5xl">🏃</p>
              <div className="text-center">
                <p className="font-semibold text-gray-700">No activities logged yet</p>
                <p className="text-sm text-gray-400 mt-1">Tap "Log activity" to track any workout.</p>
              </div>
              <button
                onClick={() => navigate('/log-activity')}
                className="bg-blue-400 text-white font-semibold rounded-2xl px-8 py-3 tap-target"
              >
                Log my first activity
              </button>
            </div>
          ) : (
            <>
              {/* Group by date */}
              {Object.entries(
                activities.reduce((acc, a) => {
                  if (!acc[a.activity_date]) acc[a.activity_date] = [];
                  acc[a.activity_date].push(a);
                  return acc;
                }, {})
              ).map(([date, acts]) => (
                <div key={date} className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </p>
                  <div className="flex flex-col gap-2">
                    {acts.map((a) => (
                      <div key={a.id} className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{a.activity}</p>
                            {a.intensity && (
                              <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${INTENSITY_COLOR[a.intensity] || 'bg-gray-100 text-gray-500'}`}>
                                {a.intensity}
                              </span>
                            )}
                            {a.source === 'video' && (
                              <span className="text-xs bg-blue-50 text-blue-400 font-semibold rounded-full px-2 py-0.5">video</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {a.category}{a.duration_min ? ` · ${a.duration_min} min` : ''}
                          </p>
                          {a.notes && <p className="text-xs text-gray-400 mt-1 italic">{a.notes}</p>}
                        </div>
                        <button
                          onClick={() => deleteActivity(a.id)}
                          className="text-gray-300 hover:text-red-400 tap-target transition-colors p-1"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-center gap-4 pt-4">
                {actPage > 1 && (
                  <button onClick={() => setActPage((p) => p - 1)} className="text-sm text-blue-400 font-semibold tap-target">
                    ← Previous
                  </button>
                )}
                {activities.length === 20 && actPage * 20 < actTotal && (
                  <button onClick={() => setActPage((p) => p + 1)} className="text-sm text-blue-400 font-semibold tap-target">
                    Next →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
