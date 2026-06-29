import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { EmptyStateIllustration } from '../components/ui/Illustrations';

const ENERGY_LABEL = { 20: 'Wrecked', 40: 'Low', 65: 'Good', 85: 'Strong' };

const SOURCE_CONFIG = {
  guided: { label: 'App guided', color: 'bg-purple-100 text-purple-600' },
  manual: { label: 'Manual',     color: 'bg-blue-100 text-blue-500' },
  video:  { label: 'Video',      color: 'bg-orange-100 text-orange-500' },
};

const INTENSITY_COLOR = {
  easy:     'text-green-600',
  moderate: 'text-yellow-600',
  hard:     'text-orange-600',
  max:      'text-red-600',
};

// Fetch + blob download that works with the auth header
async function downloadCSV(path, filename) {
  try {
    const res = await client.get(path, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Export failed. Please try again.');
  }
}

function ActivityItem({ item, onDelete }) {
  const src = SOURCE_CONFIG[item.source] || SOURCE_CONFIG.manual;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 flex-shrink-0 ${src.color}`}>
              {src.label}
            </span>
            <span className="text-sm font-semibold text-gray-900 truncate">{item.title}</span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            {item.energy && (
              <span className="bg-gray-100 rounded-full px-2 py-0.5 text-gray-600 font-medium">
                {ENERGY_LABEL[item.energy] || `Energy ${item.energy}`}
              </span>
            )}
            {item.duration_min && <span>{item.duration_min} min</span>}
            {item.intensity && (
              <span className={`font-semibold ${INTENSITY_COLOR[item.intensity] || 'text-gray-500'}`}>
                {item.intensity}
              </span>
            )}
            {item.effort && (
              <span className="text-gray-400">{item.effort.replace(/_/g, ' ')}</span>
            )}
          </div>

          {item.notes && (
            <p className="text-xs text-gray-400 italic mt-1 line-clamp-1">{item.notes}</p>
          )}
        </div>

        {/* Delete — only for manual/video entries */}
        {item.source !== 'guided' && (
          <button
            onClick={() => onDelete(item)}
            className="flex-shrink-0 text-gray-300 hover:text-red-400 tap-target transition-colors p-1"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const navigate  = useNavigate();
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [offset, setOffset]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState(null);
  const PAGE = 30;

  const fetchPage = useCallback((off) => {
    setLoading(true);
    Promise.all([
      client.get(`/history/unified?offset=${off}`),
      stats === null ? client.get('/history/stats') : Promise.resolve(null),
    ]).then(([uniRes, statsRes]) => {
      setItems(uniRes.data.items);
      setTotal(uniRes.data.total);
      setOffset(off);
      if (statsRes) setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }, [stats]);

  useEffect(() => { fetchPage(0); }, []);

  async function handleDelete(item) {
    await client.delete(`/activity/${item.item_id}`);
    setItems((prev) => prev.filter((i) => i.item_id !== item.item_id || i.source === 'guided'));
    setTotal((n) => n - 1);
  }

  // Group items by date
  const byDate = items.reduce((acc, item) => {
    const d = item.activity_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  const guidedCount   = items.filter((i) => i.source === 'guided').length;
  const manualCount   = items.filter((i) => i.source !== 'guided').length;

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Activity</p>
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/reflection')}
              className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl px-3 py-1.5 tap-target"
            >
              📝 Weekly review
            </button>
            <button
              onClick={() => navigate('/pain-history')}
              className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl px-3 py-1.5 tap-target"
            >
              📊 Pain patterns
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      {stats && (
        <div className="px-5 mb-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-purple-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-500">{stats.completed_sessions}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">App sessions</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">{total - stats.completed_sessions}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Self-logged</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-600">{total}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Total</p>
            </div>
          </div>
        </div>
      )}

      {/* Export buttons */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV('/history/export.csv', 'session-history.csv')}
            className="flex-1 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl py-2 tap-target"
          >
            ↓ Sessions CSV
          </button>
          <button
            onClick={() => downloadCSV('/activity/export.csv', 'activity-log.csv')}
            className="flex-1 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl py-2 tap-target"
          >
            ↓ Activities CSV
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-4">
            <EmptyStateIllustration size={100} />
            <div className="text-center">
              <p className="font-semibold text-gray-700">Nothing logged yet</p>
              <p className="text-sm text-gray-400 mt-1">Complete a check-in or tap + to log your first activity.</p>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(byDate).map(([date, dayItems]) => (
              <div key={date} className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </p>
                  {dayItems.length > 1 && (
                    <span className="text-[10px] text-blue-400 font-semibold bg-blue-50 rounded-full px-2 py-0.5">
                      {dayItems.length} activities
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {dayItems.map((item) => (
                    <ActivityItem
                      key={`${item.source}-${item.item_id}`}
                      item={item}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex justify-center gap-4 pt-4 pb-2">
              {offset > 0 && (
                <button onClick={() => fetchPage(offset - PAGE)} className="text-sm text-blue-400 font-semibold tap-target">
                  ← Newer
                </button>
              )}
              {offset + PAGE < total && (
                <button onClick={() => fetchPage(offset + PAGE)} className="text-sm text-blue-400 font-semibold tap-target">
                  Older →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
