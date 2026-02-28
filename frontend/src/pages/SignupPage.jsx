import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Button from '../components/ui/Button';

export default function SignupPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await client.post('/auth/signup', { email, password });
      login(res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full rounded-2xl border-2 border-earth-200 bg-white px-4 py-3.5 text-base text-earth-900 placeholder:text-earth-300 focus:outline-none focus:border-sunrise-500 transition-colors';
  const labelClass = 'block text-sm font-semibold text-earth-700 mb-1.5';

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 safe-bottom">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-earth-900 mb-2">Create your account</h1>
          <p className="text-earth-600 text-base leading-relaxed">
            Free to use. No subscription. Just check in and move.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <p className="text-xs text-earth-500 mt-1.5 ml-1">Minimum 8 characters</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full py-4 text-base mt-1">
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <div className="mt-4">
          <Link
            to="/login"
            className="flex items-center justify-center w-full rounded-2xl border-2 border-earth-200 bg-white py-3.5 text-base font-semibold text-earth-800 hover:border-sunrise-400 transition-colors tap-target"
          >
            Already have an account? Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
