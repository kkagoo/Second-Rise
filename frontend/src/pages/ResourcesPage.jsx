import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client';

const TYPE_FILTERS = [
  { id: null,       label: 'All' },
  { id: 'article',  label: '📄 Articles' },
  { id: 'podcast',  label: '🎙 Podcasts' },
  { id: 'video',    label: '▶️ Videos' },
  { id: 'book',     label: '📚 Books' },
  { id: 'tool',     label: '🛠 Tools' },
];

const TYPE_COLOR = {
  article: 'bg-blue-50 text-blue-500',
  podcast: 'bg-purple-50 text-purple-500',
  video:   'bg-orange-50 text-orange-500',
  book:    'bg-green-50 text-green-500',
  tool:    'bg-teal-50 text-teal-500',
};

function BookmarkIcon({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ResourceCard({ resource, onToggleBookmark }) {
  const [toggling, setToggling] = useState(false);

  async function handleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    setToggling(true);
    await onToggleBookmark(resource);
    setToggling(false);
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-100 rounded-2xl p-4 shadow-sm tap-target"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <span className={`inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 mb-2 ${TYPE_COLOR[resource.type] || 'bg-gray-100 text-gray-500'}`}>
            {resource.type}
          </span>
          {resource.featured && (
            <span className="ml-1.5 inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 mb-2 bg-yellow-50 text-yellow-600">
              ⭐ Featured
            </span>
          )}
          <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">{resource.title}</h3>
          {resource.author && (
            <p className="text-xs text-gray-400 mb-1.5">by {resource.author}</p>
          )}
          {resource.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{resource.description}</p>
          )}
          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-gray-400 bg-gray-50 rounded-full px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleBookmark}
          disabled={toggling}
          className={`flex-shrink-0 p-1.5 rounded-xl tap-target transition-colors ${
            resource.bookmarked ? 'text-blue-400' : 'text-gray-300 hover:text-blue-300'
          }`}
        >
          <BookmarkIcon filled={resource.bookmarked} />
        </button>
      </div>
    </a>
  );
}

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [typeFilter, setType]     = useState(null);
  const [searchQ, setSearchQ]     = useState('');
  const [tab, setTab]             = useState('browse'); // 'browse' | 'saved'

  const fetchResources = useCallback(() => {
    setLoading(true);
    setError('');
    const endpoint = tab === 'saved' ? '/resources/bookmarks' : '/resources';
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (searchQ.trim()) params.set('q', searchQ.trim());
    const url = `${endpoint}${params.toString() ? '?' + params.toString() : ''}`;
    client.get(url)
      .then((res) => setResources(res.data.resources || []))
      .catch(() => setError('Could not load resources.'))
      .finally(() => setLoading(false));
  }, [tab, typeFilter, searchQ]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  async function toggleBookmark(resource) {
    if (resource.bookmarked) {
      await client.delete(`/resources/${resource.id}/bookmark`);
    } else {
      await client.post(`/resources/${resource.id}/bookmark`);
    }
    setResources((prev) =>
      prev.map((r) => r.id === resource.id ? { ...r, bookmarked: !r.bookmarked } : r)
    );
    // If in saved tab and unbookmarking, remove from list
    if (tab === 'saved' && resource.bookmarked) {
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
    }
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Wellness</p>
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <p className="text-sm text-gray-400 mt-1">Curated for women in perimenopause.</p>
      </div>

      {/* Browse / Saved tabs */}
      <div className="px-5 mb-4">
        <div className="flex bg-gray-100 rounded-2xl p-1">
          {['browse', 'saved'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold tap-target transition-all ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              {t === 'browse' ? 'Explore' : '🔖 Saved'}
            </button>
          ))}
        </div>
      </div>

      {/* Search (browse only) */}
      {tab === 'browse' && (
        <div className="px-5 mb-3">
          <div className="relative">
            <svg className="absolute left-3 top-3 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search articles, podcasts…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      )}

      {/* Type filter pills (browse only) */}
      {tab === 'browse' && (
        <div className="px-5 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {TYPE_FILTERS.map(({ id, label }) => (
              <button
                key={String(id)}
                onClick={() => setType(id)}
                className={`flex-shrink-0 text-sm font-semibold rounded-2xl px-4 py-2 tap-target transition-all border-2 ${
                  typeFilter === id
                    ? 'bg-gray-900 text-white border-transparent'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">{tab === 'saved' ? '🔖' : '📚'}</p>
            <p className="font-semibold text-gray-700">
              {tab === 'saved' ? 'No saved resources yet' : 'No resources found'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {tab === 'saved'
                ? 'Tap the bookmark icon on any resource to save it.'
                : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} onToggleBookmark={toggleBookmark} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
