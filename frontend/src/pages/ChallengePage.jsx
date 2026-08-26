import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function ChallengePage() {
  const { code }            = useParams();
  const { token }           = useAuth();
  const navigate            = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [joining, setJoining]     = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const shareUrl = `${window.location.origin}/c/${code}`;

  async function load() {
    try {
      const res = await client.get(`/challenges/${code}`);
      setChallenge(res.data);
    } catch {
      setError('Challenge not found.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [code]);

  async function handleJoin() {
    if (!token) {
      // Send them to signup with the challenge code in state so they land back here
      navigate(`/signup?next=/c/${code}`);
      return;
    }
    setJoining(true);
    try {
      await client.post(`/challenges/${code}/join`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join. Try again.');
    } finally {
      setJoining(false);
    }
  }

  function handleCheckin() {
    // Send user through the real Second Rise check-in flow.
    // CheckinPage will auto-join + log the challenge check-in on completion.
    navigate(`/checkin?challenge=${code}`);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: challenge.name, text: `Join me: ${challenge.name}`, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error && !challenge) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-gray-500 mb-4">{error}</p>
      <Link to="/" className="text-blue-400 font-semibold">Go to Second Rise →</Link>
    </div>
  );

  const ended   = challenge.days_left === 0;
  const today   = challenge.today_checkin_count;
  const total   = challenge.participant_count;
  const pct     = total > 0 ? Math.round((today / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 pt-12 pb-10 safe-bottom">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">🌅</div>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{challenge.name}</h1>
          {ended ? (
            <p className="text-gray-400 text-sm mt-1">This challenge has ended</p>
          ) : (
            <p className="text-blue-400 font-semibold text-sm mt-1">
              {challenge.days_left} day{challenge.days_left !== 1 ? 's' : ''} left
            </p>
          )}
        </div>

        {/* Progress card */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <p className="text-3xl font-bold text-gray-900 text-center">
            {today} <span className="text-lg font-normal text-gray-400">/ {total}</span>
          </p>
          <p className="text-center text-sm text-gray-500 mb-3">moved today</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        {!challenge.user_is_participant && !ended && (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-4 mb-3 transition-colors disabled:opacity-60"
          >
            {joining ? 'Joining…' : 'Join this challenge'}
          </button>
        )}

        {challenge.user_is_participant && !ended && (
          challenge.user_checked_in_today ? (
            <div className="w-full bg-green-50 border border-green-200 rounded-2xl py-4 mb-3 text-center">
              <span className="text-green-600 font-semibold">✓ You moved today</span>
            </div>
          ) : (
            <button
              onClick={handleCheckin}
              disabled={checkingIn}
              className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold rounded-2xl py-4 mb-3 transition-colors disabled:opacity-60"
            >
              {checkingIn ? 'Logging…' : 'I moved today ✓'}
            </button>
          )
        )}

        {/* Recommendation nudge — shown below the I moved button */}
        {challenge.user_is_participant && !ended && !challenge.user_checked_in_today && (
          <p className="text-center text-xs text-gray-400 mb-2">
            Tapping the button takes you through your daily check-in and picks today's workout.
          </p>
        )}

        {/* Share */}
        {!ended && (
          <button
            onClick={handleShare}
            className="w-full border border-gray-200 text-gray-600 font-medium rounded-2xl py-3.5 mb-6 transition-colors hover:bg-gray-50"
          >
            Share challenge link
          </button>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* Footer nudge for non-users */}
        {!token && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Joining takes 30 seconds.{' '}
            <Link to={`/signup?next=/c/${code}`} className="text-blue-400 underline">Create a free account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
