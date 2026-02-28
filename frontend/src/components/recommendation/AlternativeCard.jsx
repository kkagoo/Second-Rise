import React from 'react';
import Card from '../ui/Card';

export default function AlternativeCard({ session_type, reasoning, onSelect, loading }) {
  return (
    <Card>
      <h3 className="font-semibold text-earth-800 mb-1">{session_type}</h3>
      <p className="text-sm text-earth-500 leading-relaxed mb-3">{reasoning}</p>
      <button
        onClick={onSelect}
        disabled={loading}
        className="text-sunrise-600 text-sm font-semibold underline tap-target disabled:opacity-50"
      >
        {loading ? 'Loading workout…' : 'Choose this instead →'}
      </button>
    </Card>
  );
}
