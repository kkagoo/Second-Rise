import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await client.post('/auth/login', { email, password });
      login(res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setError('');
    setLoading(true);
    try {
      let res;
      try {
        res = await client.post('/auth/signup', { email: 'demo@secondrise.app', password: 'demo1234' });
      } catch (signupErr) {
        if (signupErr.response?.status === 409) {
          res = await client.post('/auth/login', { email: 'demo@secondrise.app', password: 'demo1234' });
        } else {
          throw signupErr;
        }
      }
      login(res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Demo login failed — is the server running?');
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
          <h1 className="text-3xl font-bold text-earth-900 mb-2">Second Rise</h1>
          <p className="text-earth-600 text-base leading-relaxed">
            Workouts built around how you actually feel — not a generic plan.
          </p>
        </div>

        {/* Sign in form */}
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
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full py-4 text-base mt-1">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {/* Sign up */}
        <div className="mt-4">
          <Link
            to="/signup"
            className="flex items-center justify-center w-full rounded-2xl border-2 border-earth-200 bg-white py-3.5 text-base font-semibold text-earth-800 hover:border-sunrise-400 transition-colors tap-target"
          >
            Create an account
          </Link>
        </div>

        {/* Demo */}
        <div className="mt-6 pt-6 border-t border-earth-100 text-center">
          <p className="text-sm text-earth-500 mb-3">Just want to explore?</p>
          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full rounded-2xl border-2 border-dashed border-earth-200 py-3.5 text-base font-semibold text-earth-600 hover:border-sunrise-400 hover:text-sunrise-700 transition-colors tap-target disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Try the demo →'}
          </button>
        </div>

      </div>
    </div>
  );
}
