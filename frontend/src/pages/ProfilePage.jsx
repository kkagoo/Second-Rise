import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

function ProfileRow({ label, value }) {
  if (!value && value !== false) return null;
  const display = Array.isArray(value) ? value.join(', ') : String(value);
  return (
    <div className="flex justify-between py-2 border-b border-earth-50">
      <span className="text-sm text-earth-500">{label}</span>
      <span className="text-sm font-medium text-earth-800 text-right max-w-[55%]">{display || '—'}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sunrise-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-5 pt-12 pb-8 safe-bottom">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-earth-900">Profile</h1>
          <button onClick={() => navigate('/')} className="text-sm text-earth-400 underline tap-target">
            Home
          </button>
        </div>

        <Card>
          <h2 className="font-semibold text-earth-800 mb-4">Your profile</h2>
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
          <Button
            variant="secondary"
            onClick={() => navigate('/onboarding')}
            className="w-full"
          >
            Update profile
          </Button>
          <Button
            variant="ghost"
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full text-earth-500"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
