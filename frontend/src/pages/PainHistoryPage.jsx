import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

function MiniLineChart({ data, width = 340, height = 120 }) {
  if (!data || data.length < 2) {
    return <p className="text-xs text-gray-400 text-center py-6">Not enough data yet</p>;
  }

  const padX = 8;
  const padY = 12;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  // pain is 0 or 1; scale y so 0 is bottom, 1 is top
  const xStep = chartW / (data.length - 1);

  const painPts = data.map((d, i) => ({
    x: padX + i * xStep,
    y: padY + (1 - d.pain) * chartH,
    pain: d.pain,
    activity: d.activity,
    label: d.label,
  }));

  // SVG path for pain line
  const linePath = painPts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  // fill under line
  const fillPath =
    `M${painPts[0].x.toFixed(1)},${padY + chartH} ` +
    painPts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L${painPts[painPts.length - 1].x.toFixed(1)},${padY + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      <line x1={padX} y1={padY} x2={padX + chartW} y2={padY} stroke="#F3F4F6" strokeWidth="1" />
      <line x1={padX} y1={padY + chartH / 2} x2={padX + chartW} y2={padY + chartH / 2} stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4 2" />
      <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#F3F4F6" strokeWidth="1" />

      {/* Y axis labels */}
      <text x="0" y={padY + 4}         fontSize="8" fill="#9CA3AF">Pain</text>
      <text x="0" y={padY + chartH + 4} fontSize="8" fill="#9CA3AF">None</text>

      {/* Pain fill */}
      <path d={fillPath} fill="#FCA5A5" opacity="0.3" />
      {/* Pain line */}
      <path d={linePath} fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Activity dots (green = had activity that day) */}
      {painPts.map((p, i) =>
        p.activity > 0 ? (
          <circle
            key={`act-${i}`}
            cx={p.x}
            cy={padY + chartH - 6}
            r="4"
            fill="#34D399"
            opacity="0.85"
          />
        ) : null
      )}

      {/* Pain dots */}
      {painPts.map((p, i) =>
        p.pain > 0 ? (
          <circle key={`pain-${i}`} cx={p.x} cy={p.y} r="4" fill="#EF4444" />
        ) : null
      )}
    </svg>
  );
}

export default function PainHistoryPage() {
  const navigate = useNavigate();
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays]       = useState(30);

  useEffect(() => {
    setLoading(true);
    client.get(`/activity/pain-history?days=${days}`)
      .then((res) => {
        const raw = res.data.data || [];
        // Build chart-ready array
        const pts = raw.map((d) => ({
          day:      d.day,
          pain:     d.pain_flagged ? 1 : 0,
          activity: d.activity_count,
          areas:    d.body_areas || [],
          label:    d.day,
        }));
        setData(pts);
      })
      .finally(() => setLoading(false));
  }, [days]);

  const painDays  = data.filter((d) => d.pain === 1).length;
  const activeDays = data.filter((d) => d.activity > 0).length;
  const painWithActivity = data.filter((d) => d.pain === 1 && d.activity > 0).length;

  // Body area frequency
  const areaCount = {};
  data.forEach((d) => {
    (d.areas || []).forEach((a) => { areaCount[a] = (areaCount[a] || 0) + 1; });
  });
  const topAreas = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="px-5 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="text-blue-400 text-sm font-semibold mb-3 tap-target">
          ← Back
        </button>
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Explore</p>
        <h1 className="text-2xl font-bold text-gray-900">Pain Patterns</h1>
        <p className="text-sm text-gray-400 mt-1">Testing whether aches follow workouts 1–2 days later.</p>
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <p className="text-xs text-amber-700">⚠️ This is exploratory — patterns shown here are not medical conclusions.</p>
        </div>
      </div>

      {/* Time range selector */}
      <div className="px-5 mb-5">
        <div className="flex gap-2">
          {[14, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold tap-target transition-all ${
                days === d ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="px-5 text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold text-gray-700">No check-in data yet</p>
          <p className="text-sm text-gray-400 mt-1">Complete daily check-ins to see trends here.</p>
        </div>
      ) : (
        <div className="px-5 space-y-4">
          {/* Chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full bg-red-400" />
                <span className="text-xs text-gray-500">Pain flagged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs text-gray-500">Had activity</span>
              </div>
            </div>
            <MiniLineChart data={data} />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">{data[0]?.day}</span>
              <span className="text-xs text-gray-400">{data[data.length - 1]?.day}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{painDays}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pain days</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{activeDays}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active days</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{painWithActivity}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pain + active</p>
            </div>
          </div>

          {/* Lag pattern insight */}
          {data.length >= 7 && (
            <div className="bg-sky-card rounded-2xl p-4">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">Pattern test</p>
              {(() => {
                const matchDays = data.filter((d) => d.has_match).length;
                if (painDays === 0) return <p className="text-sm text-gray-700">No pain flagged in this period. 🎉</p>;
                if (matchDays === 0) return <p className="text-sm text-gray-700">No clear workout-to-pain matches found in the 1–2 day window. Try logging more activities with body area notes.</p>;
                return (
                  <p className="text-sm text-gray-700">
                    On <strong>{matchDays} of {painDays}</strong> pain days, a workout matching that body area was logged 1–2 days before. Worth watching — but not a conclusion yet.
                  </p>
                );
              })()}
            </div>
          )}

          {/* Body-area matched entries */}
          {data.filter((d) => d.pain_flagged && d.prior_activities?.length > 0).length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-1">Pain days with prior activity</p>
              <p className="text-xs text-gray-400 mb-3">Activities logged 1–2 days before each pain report</p>
              <div className="space-y-3">
                {data
                  .filter((d) => d.pain_flagged && d.prior_activities?.length > 0)
                  .slice(-8)
                  .reverse()
                  .map((d) => (
                    <div key={d.day} className="border-l-2 border-red-200 pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-red-500">🔴 {d.day}</span>
                        {d.body_areas.length > 0 && (
                          <span className="text-xs text-gray-400">{d.body_areas.slice(0, 2).join(', ')}</span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {d.prior_activities.slice(0, 3).map((act, i) => (
                          <p key={i} className={`text-xs ${d.has_match && d.related_workouts?.some((r) => r.activity === act.activity) ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                            ↑ {act.activity} ({act.category})
                            {d.has_match && d.related_workouts?.some((r) => r.activity === act.activity) && ' ← possible match'}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top pain areas */}
          {topAreas.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-3">Most flagged body areas</p>
              <div className="space-y-2">
                {topAreas.map(([area, count]) => (
                  <div key={area} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-700 w-28">{area}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-red-400 h-2 rounded-full"
                        style={{ width: `${(count / painDays) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent pain days list */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900 mb-3">Recent pain days</p>
            {data.filter((d) => d.pain === 1).length === 0 ? (
              <p className="text-xs text-gray-400">No pain flagged in this period 🎉</p>
            ) : (
              <div className="space-y-2">
                {data
                  .filter((d) => d.pain === 1)
                  .slice(-10)
                  .reverse()
                  .map((d) => (
                    <div key={d.day} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-800 font-semibold">{d.day}</span>
                        {d.areas.length > 0 && (
                          <span className="text-xs text-gray-400 ml-2">{d.areas.slice(0, 3).join(', ')}</span>
                        )}
                      </div>
                      {d.activity > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 font-semibold rounded-full px-2 py-0.5">
                          {d.activity} activit{d.activity === 1 ? 'y' : 'ies'}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
