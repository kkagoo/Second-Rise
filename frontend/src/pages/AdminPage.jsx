import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeDate(dateStr) {
  if (!dateStr) return 'Never';
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const diffDays = Math.round((todayMs - new Date(dateStr.slice(0, 10)).getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1) return `${diffDays}d ago`;
  return dateStr.slice(0, 10);
}

function Badge({ label, color }) {
  const colors = {
    green:  'bg-green-100 text-green-800',
    gray:   'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-800',
    red:    'bg-red-100 text-red-700',
    amber:  'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}

const STAGE_LABELS = {
  pre:           'Pre',
  peri:          'Peri',
  perimenopause: 'Peri',
  post:          'Post',
  menopause:     'Meno',
  not_sure:      '?',
};

// Energy 1–5 → color
function energyColor(v) {
  if (!v) return 'text-gray-400';
  if (v >= 4) return 'text-green-600 font-semibold';
  if (v >= 3) return 'text-amber-600 font-semibold';
  return 'text-red-500 font-semibold';
}

// Recovery 0-100 → color
function recoveryColor(v) {
  if (!v) return 'text-gray-400';
  if (v >= 70) return 'text-green-600 font-semibold';
  if (v >= 50) return 'text-amber-600 font-semibold';
  return 'text-red-500 font-semibold';
}

const EFFORT_EMOJI = {
  easy:      '😌 Easy',
  moderate:  '💪 Moderate',
  hard:      '🔥 Hard',
  very_hard: '🥵 Max',
};

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="text-3xl font-bold text-purple-900">{value ?? '—'}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// Simple inline bar
function MiniBar({ value, max, color = 'bg-purple-400' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  );
}

// ── Resource Modal ─────────────────────────────────────────────────────────────
const EMPTY_RESOURCE = { title: '', type: 'article', author: '', url: '', description: '', tags: '', thumbnail_url: '', featured: false };

function ResourceModal({ resource, onClose, onSaved }) {
  const [form, setForm] = useState(resource || EMPTY_RESOURCE);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title.trim() || !form.url.trim()) { setErr('Title and URL are required.'); return; }
    setSaving(true);
    setErr('');
    try {
      const body = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        featured: !!form.featured,
        active: true,
      };
      if (form.id) {
        await client.put(`/admin/resources/${form.id}`, body);
      } else {
        await client.post('/admin/resources', body);
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-800 mb-5">{form.id ? 'Edit Resource' : 'Add Resource'}</h2>

        {[
          { label: 'Title *', key: 'title', placeholder: 'e.g. The Galveston Diet Podcast' },
          { label: 'Author / Source', key: 'author', placeholder: 'e.g. Dr. Mary Claire Haver' },
          { label: 'URL *', key: 'url', placeholder: 'https://…', type: 'url' },
          { label: 'Description (max 200 chars)', key: 'description', placeholder: 'Brief description…', textarea: true },
          { label: 'Tags (comma-separated)', key: 'tags', placeholder: 'hormones, fitness, nutrition' },
          { label: 'Thumbnail URL (optional)', key: 'thumbnail_url', placeholder: 'https://… (image shown on card)', type: 'url' },
        ].map(({ label, key, placeholder, type, textarea }) => (
          <div key={key} className="mb-3">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
            {textarea ? (
              <textarea
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                maxLength={200}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-700 focus:outline-none resize-y min-h-[70px]"
              />
            ) : (
              <input
                type={type || 'text'}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-700 focus:outline-none"
              />
            )}
          </div>
        ))}

        <div className="mb-3">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Type</label>
          <select
            value={form.type}
            onChange={e => set('type', e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-700 focus:outline-none"
          >
            <option value="article">Article</option>
            <option value="podcast">Podcast</option>
            <option value="video">Video</option>
            <option value="book">Book / Guide</option>
            <option value="tool">Tool / Calculator</option>
          </select>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="res-featured"
            checked={!!form.featured}
            onChange={e => set('featured', e.target.checked)}
            className="w-4 h-4 accent-purple-700"
          />
          <label htmlFor="res-featured" className="text-sm text-gray-700">Feature this resource (shown at top)</label>
        </div>

        {err && <p className="text-red-500 text-sm mb-3">{err}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-900 text-white hover:bg-purple-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ stats, loading }) {
  if (loading) return <div className="text-gray-400 py-12 text-center text-sm">Loading…</div>;
  if (!stats) return null;

  const effortEntries = Object.entries(stats.effort_distribution || {});
  const maxEffort = Math.max(...effortEntries.map(([, n]) => n), 1);

  return (
    <div className="space-y-6">
      {/* Core stats */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Activity</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Total users"     value={stats.total_users} />
          <StatCard label="New this week"   value={stats.new_this_week} />
          <StatCard label="New this month"  value={stats.new_this_month} />
          <StatCard label="Check-ins today" value={stats.checkins_today} />
          <StatCard label="Total check-ins" value={stats.total_checkins} />
          <StatCard label="Total workouts"  value={stats.total_workouts} />
        </div>
      </div>

      {/* Cohort health signals */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cohort signals (last 7 days)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            label="Avg energy"
            value={stats.cohort_avg_energy != null ? `${stats.cohort_avg_energy} / 5` : '—'}
            sub="Self-reported at check-in"
          />
          <StatCard
            label="Avg readiness"
            value={stats.cohort_avg_readiness != null ? `${stats.cohort_avg_readiness}%` : '—'}
            sub="Computed from check-in inputs"
          />
          <StatCard
            label="Wearable active"
            value={stats.wearable_active_users}
            sub="Users with wearable data synced"
          />
        </div>
      </div>

      {/* Effort distribution */}
      {effortEntries.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Workout effort (last 30 days)</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3 max-w-sm">
            {effortEntries.map(([effort, count]) => (
              <div key={effort}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{EFFORT_EMOJI[effort] || effort}</span>
                  <span className="text-gray-400">{count} sessions</span>
                </div>
                <MiniBar value={count} max={maxEffort} color="bg-purple-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cohort Trends Tab ─────────────────────────────────────────────────────────
function CohortTrendsTab({ loading, trends, effortBreakdown }) {
  if (loading) return <div className="text-gray-400 py-12 text-center text-sm">Loading…</div>;

  const effortColors = {
    easy: 'bg-green-400', moderate: 'bg-amber-400', hard: 'bg-orange-400', very_hard: 'bg-red-400',
  };
  const maxEffort = Math.max(...(effortBreakdown || []).map(r => r.n), 1);

  return (
    <div className="space-y-8">
      {/* 4-week trend table */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Weekly cohort trend (last 5 weeks)</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-[11px] uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Week starting</th>
                <th className="px-4 py-3 font-semibold">Active users</th>
                <th className="px-4 py-3 font-semibold">Check-ins</th>
                <th className="px-4 py-3 font-semibold">Workouts</th>
                <th className="px-4 py-3 font-semibold">Avg energy</th>
                <th className="px-4 py-3 font-semibold">Avg readiness</th>
                <th className="px-4 py-3 font-semibold">Avg effort</th>
              </tr>
            </thead>
            <tbody>
              {(!trends || trends.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Not enough data yet — check back after the first week of activity.
                  </td>
                </tr>
              )}
              {(trends || []).map((row, i) => (
                <tr key={row.week} className={`border-t border-gray-100 ${i === 0 ? 'bg-purple-50/40' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">
                    {row.week_start ? fmtDate(row.week_start) : row.week}
                    {i === 0 && <span className="ml-2 text-[10px] text-purple-600 font-semibold">current</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.active_users}</td>
                  <td className="px-4 py-3 text-gray-700">{row.total_checkins}</td>
                  <td className="px-4 py-3 text-gray-700">{row.total_workouts}</td>
                  <td className={`px-4 py-3 ${energyColor(row.avg_energy)}`}>
                    {row.avg_energy != null ? `${row.avg_energy} / 5` : '—'}
                  </td>
                  <td className={`px-4 py-3 ${recoveryColor(row.avg_readiness)}`}>
                    {row.avg_readiness != null ? `${row.avg_readiness}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.avg_effort_score != null ? `${row.avg_effort_score} / 5` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Energy = self-reported 1–5 at check-in. Readiness = computed from inputs. Effort = mapped from session rating.
        </p>
      </div>

      {/* Effort breakdown */}
      {effortBreakdown && effortBreakdown.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Effort breakdown (last 30 days)</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3 max-w-sm">
            {effortBreakdown.map(row => (
              <div key={row.effort_rating}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{EFFORT_EMOJI[row.effort_rating] || row.effort_rating}</span>
                  <span className="text-gray-400">{row.n} sessions</span>
                </div>
                <MiniBar
                  value={row.n}
                  max={maxEffort}
                  color={effortColors[row.effort_rating] || 'bg-purple-400'}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ users, loading, onDelete }) {
  const [q, setQ] = useState('');
  const filtered = users.filter(u => u.email.toLowerCase().includes(q.toLowerCase()));

  if (loading) return <div className="text-gray-400 py-12 text-center text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{users.length} users</span>
        <input
          type="text"
          placeholder="Search email…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-purple-700 focus:outline-none w-52"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-[11px] uppercase tracking-wide">
              <th className="px-3 py-3 font-semibold">ID</th>
              <th className="px-3 py-3 font-semibold">Email</th>
              <th className="px-3 py-3 font-semibold">Signed up</th>
              <th className="px-3 py-3 font-semibold">Stage</th>
              <th className="px-3 py-3 font-semibold">Onboarded</th>
              <th className="px-3 py-3 font-semibold">Check-ins</th>
              <th className="px-3 py-3 font-semibold">Workouts</th>
              <th className="px-3 py-3 font-semibold">Last active</th>
              <th className="px-3 py-3 font-semibold">Streak</th>
              <th className="px-3 py-3 font-semibold" title="Avg self-reported energy 1–5 (last 7d)">⚡ Energy 7d</th>
              <th className="px-3 py-3 font-semibold" title="Avg wearable recovery score 0–100 (last 7d, Oura/WHOOP/Garmin)">🫀 Recovery 7d</th>
              <th className="px-3 py-3 font-semibold" title="Most recent post-session effort rating">Last effort</th>
              <th className="px-3 py-3 font-semibold">Wearable</th>
              <th className="px-3 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-gray-400">No users found</td>
              </tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 text-gray-400">{u.id}</td>
                <td className="px-3 py-2.5 max-w-[160px]">
                  <span className="block truncate text-gray-800" title={u.email}>{u.email}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                <td className="px-3 py-2.5">
                  {u.menopause_stage
                    ? <Badge label={STAGE_LABELS[u.menopause_stage] || u.menopause_stage} color="purple" />
                    : <span className="text-gray-300">—</span>
                  }
                </td>
                <td className="px-3 py-2.5">
                  {u.onboarding_complete
                    ? <Badge label="Yes" color="green" />
                    : <Badge label="No" color="gray" />
                  }
                </td>
                <td className="px-3 py-2.5 text-gray-700">{u.total_checkins ?? 0}</td>
                <td className="px-3 py-2.5 text-gray-700">{u.total_workouts ?? 0}</td>
                <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{relativeDate(u.last_checkin)}</td>
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                  {u.current_streak > 0 ? `${u.current_streak} 🔥` : '—'}
                </td>
                {/* Progress signals */}
                <td className={`px-3 py-2.5 whitespace-nowrap ${energyColor(u.avg_energy_7d)}`}>
                  {u.avg_energy_7d != null ? `${u.avg_energy_7d}` : '—'}
                </td>
                <td className={`px-3 py-2.5 whitespace-nowrap ${recoveryColor(u.avg_wearable_recovery_7d)}`}>
                  {u.avg_wearable_recovery_7d != null ? `${u.avg_wearable_recovery_7d}` : '—'}
                </td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                  {u.latest_effort ? (EFFORT_EMOJI[u.latest_effort] || u.latest_effort) : '—'}
                </td>
                <td className="px-3 py-2.5">
                  {u.wearable_connected
                    ? <span className="text-green-600 font-medium">✓</span>
                    : <span className="text-gray-300">–</span>
                  }
                </td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => onDelete(u.id, u.email)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        ⚡ = self-reported energy 1–5 avg (last 7d) &nbsp;·&nbsp;
        🫀 = wearable recovery score 0–100 avg from Oura/WHOOP/Garmin (last 7d) &nbsp;·&nbsp;
        No raw health values stored in this view.
      </p>
    </div>
  );
}

// ── Waitlist Tab ──────────────────────────────────────────────────────────────
const CHALLENGE_LABELS = {
  routine_stopped_working: 'Routine stopped working',
  dont_know_whats_right:   "Doesn't know what body needs",
  no_time:                 'No time to figure it out',
  exhausted:               'Too exhausted to start',
};

function WaitlistTab({ waitlist, loading }) {
  const [q, setQ] = useState('');
  const filtered = (waitlist || []).filter(w =>
    w.email.toLowerCase().includes(q.toLowerCase()) ||
    (w.name || '').toLowerCase().includes(q.toLowerCase())
  );

  if (loading) return <div className="text-gray-400 py-12 text-center text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{(waitlist || []).length} signups</span>
        <input
          type="text"
          placeholder="Search name or email…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-purple-700 focus:outline-none w-52"
        />
      </div>

      {/* ICP breakdown */}
      {(waitlist || []).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(CHALLENGE_LABELS).map(([key, label]) => {
            const count = (waitlist || []).filter(w => w.challenge === key).length;
            return (
              <div key={key} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-900">{count}</div>
                <div className="text-xs text-gray-500 mt-1 leading-tight">{label}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-[11px] uppercase tracking-wide">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Challenge</th>
              <th className="px-4 py-3 font-semibold">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No signups yet</td>
              </tr>
            )}
            {filtered.map(w => (
              <tr key={w.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-gray-700">{w.name || <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-2.5 text-gray-800 font-medium">{w.email}</td>
                <td className="px-4 py-2.5">
                  {w.challenge
                    ? <Badge label={CHALLENGE_LABELS[w.challenge] || w.challenge} color="purple" />
                    : <span className="text-gray-300">—</span>
                  }
                </td>
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{fmtDate(w.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Resources Tab ─────────────────────────────────────────────────────────────
function ResourcesTab({ resources, loading, onAdd, onEdit, onDelete }) {
  if (loading) return <div className="text-gray-400 py-12 text-center text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{resources.length} resources</span>
        <button
          onClick={() => onAdd()}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-900 text-white hover:bg-purple-800 transition-colors"
        >
          + Add resource
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-[11px] uppercase tracking-wide">
              <th className="px-3 py-3 font-semibold">Title</th>
              <th className="px-3 py-3 font-semibold">Type</th>
              <th className="px-3 py-3 font-semibold">Author</th>
              <th className="px-3 py-3 font-semibold">Featured</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No resources yet. Add one above.
                </td>
              </tr>
            )}
            {resources.map(r => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 max-w-[220px]">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-800 font-semibold hover:underline block truncate"
                    title={r.title}
                  >
                    {r.title}
                  </a>
                </td>
                <td className="px-3 py-2.5"><Badge label={r.type} color="gray" /></td>
                <td className="px-3 py-2.5 text-gray-600">{r.author || '—'}</td>
                <td className="px-3 py-2.5">
                  {r.featured ? <Badge label="Featured" color="purple" /> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2.5">
                  {r.active ? <Badge label="Active" color="green" /> : <Badge label="Hidden" color="gray" />}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(r)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(r.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main AdminPage ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [denied, setDenied] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [trends, setTrends] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  const [waitlist, setWaitlist] = useState([]);
  const [waitlistLoading, setWaitlistLoading] = useState(true);

  const [modal, setModal] = useState(null);

  const handleForbidden = useCallback((err) => {
    if (err?.response?.status === 403) setDenied(true);
  }, []);

  useEffect(() => {
    client.get('/admin/stats')
      .then(r => { setStats(r.data); setStatsLoading(false); })
      .catch(err => { handleForbidden(err); setStatsLoading(false); });

    client.get('/admin/trends')
      .then(r => { setTrends(r.data); setTrendsLoading(false); })
      .catch(err => { handleForbidden(err); setTrendsLoading(false); });

    client.get('/admin/users')
      .then(r => { setUsers(Array.isArray(r.data) ? r.data : []); setUsersLoading(false); })
      .catch(err => { handleForbidden(err); setUsersLoading(false); });

    client.get('/admin/resources')
      .then(r => { setResources(r.data.resources || []); setResourcesLoading(false); })
      .catch(err => { handleForbidden(err); setResourcesLoading(false); });

    client.get('/admin/waitlist')
      .then(r => { setWaitlist(Array.isArray(r.data) ? r.data : []); setWaitlistLoading(false); })
      .catch(err => { handleForbidden(err); setWaitlistLoading(false); });
  }, [handleForbidden]);

  async function handleDeleteUser(id, email) {
    if (!window.confirm(`Permanently delete user ${email}? This cannot be undone.`)) return;
    await client.delete(`/admin/users/${id}`);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  async function handleDeleteResource(id) {
    if (!window.confirm('Delete this resource?')) return;
    await client.delete(`/admin/resources/${id}`);
    setResources(prev => prev.filter(r => r.id !== id));
  }

  function reloadResources() {
    client.get('/admin/resources')
      .then(r => setResources(r.data.resources || []))
      .catch(() => {});
  }

  if (denied) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-700 font-medium">Access denied</p>
        <button onClick={() => navigate('/')} className="text-purple-700 underline text-sm">Back to home</button>
      </div>
    );
  }

  const TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'cohort',    label: 'Cohort Trends' },
    { id: 'users',     label: 'Users' },
    { id: 'waitlist',  label: `Waitlist${waitlist.length ? ` (${waitlist.length})` : ''}` },
    { id: 'resources', label: 'Resources' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-purple-900 text-white px-6 h-14 flex items-center justify-between shadow">
        <span className="font-bold tracking-tight text-base">🌅 Second Rise Admin</span>
        <button
          onClick={() => navigate('/')}
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          Back to app
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? 'border-purple-900 text-purple-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        {tab === 'dashboard' && (
          <DashboardTab stats={stats} loading={statsLoading} />
        )}
        {tab === 'cohort' && (
          <CohortTrendsTab
            loading={trendsLoading}
            trends={trends?.trends}
            effortBreakdown={trends?.effort_breakdown}
          />
        )}
        {tab === 'users' && (
          <UsersTab
            users={users}
            loading={usersLoading}
            onDelete={handleDeleteUser}
          />
        )}
        {tab === 'waitlist' && (
          <WaitlistTab waitlist={waitlist} loading={waitlistLoading} />
        )}
        {tab === 'resources' && (
          <ResourcesTab
            resources={resources}
            loading={resourcesLoading}
            onAdd={() => setModal({ resource: null })}
            onEdit={r => setModal({
              resource: {
                ...r,
                tags: Array.isArray(r.tags)
                  ? r.tags.join(', ')
                  : (() => { try { return JSON.parse(r.tags || '[]').join(', '); } catch { return ''; } })(),
              }
            })}
            onDelete={handleDeleteResource}
          />
        )}
      </div>

      {/* Resource modal */}
      {modal && (
        <ResourceModal
          resource={modal.resource}
          onClose={() => setModal(null)}
          onSaved={reloadResources}
        />
      )}
    </div>
  );
}
