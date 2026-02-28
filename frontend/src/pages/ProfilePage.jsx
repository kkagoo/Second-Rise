import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';

function ProfileRow({ label, value }) {
  if (!value && value !== false) return null;
  const display = Array.isArray(value) ? value.join(', ') : String(value);
  return (
    <div className="flex justify-between py-3 border-b border-gray-50">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-[55%]">{display || '—'}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-5 pt-14 pb-28">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div className="mb-2">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Account</p>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-sky-card flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4BA3E3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Second Rise member</p>
        </div>

        <Card>
          <h2 className="font-semibold text-gray-800 mb-2 text-sm">Your profile</h2>
          <ProfileRow label="Age range"          value={profile.age_range} />
          <ProfileRow label="Menopause stage"    value={profile.menopause_stage} />
          <ProfileRow label="HRT status"         value={profile.hrt_status} />
          <ProfileRow label="Bone health"        value={profile.bone_health} />
          <ProfileRow label="Pelvic floor history" value={profile.pelvic_floor_history ? 'Yes' : 'No'} />
          <ProfileRow label="Chronic joints"     value={profile.chronic_joints} />
          <ProfileRow label="Activity baseline"  value={profile.activity_baseline} />
          <ProfileRow label="Equipment"          value={profile.equipment_available} />
          <ProfileRow label="Preferred time"     value={profile.preferred_time} />
        </Card>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600 tap-target transition-colors border border-gray-200 rounded-2xl py-3.5"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
