import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Circular illustration container */}
        <div className="w-52 h-52 rounded-full bg-sky-card flex items-center justify-center mb-8">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            {/* Simple dumbbell / movement illustration */}
            <circle cx="50" cy="38" r="22" fill="#4BA3E3" opacity="0.15" />
            <circle cx="50" cy="38" r="14" fill="#4BA3E3" opacity="0.25" />
            {/* Dumbbell shape */}
            <rect x="30" y="35" width="40" height="6" rx="3" fill="#4BA3E3" />
            <rect x="22" y="29" width="10" height="18" rx="4" fill="#4BA3E3" />
            <rect x="68" y="29" width="10" height="18" rx="4" fill="#4BA3E3" />
            {/* Person silhouette */}
            <circle cx="50" cy="68" r="5" fill="#F4874B" />
            <path d="M44 78 Q50 73 56 78 L58 90 H42 L44 78z" fill="#F4874B" opacity="0.7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 text-center leading-tight mb-2">
          Best workouts<br />for you
        </h1>
        <p className="text-gray-400 text-sm text-center mb-10">
          Movement built for where you are now.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="Email address"
            className="w-full rounded-2xl bg-gray-100 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Password"
            className="w-full rounded-2xl bg-gray-100 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-4 mt-1 transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Get started'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5">
          No account?{' '}
          <Link to="/signup" className="text-blue-400 font-semibold">
            Sign up
          </Link>
        </p>
      </div>

      {/* Demo user footer */}
      <div className="px-6 pb-10 safe-bottom text-center">
        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-400 mb-2">Try without an account</p>
          <button
            onClick={handleDemo}
            disabled={loading}
            className="text-sm font-semibold text-orange-400 hover:text-orange-500 transition-colors tap-target"
          >
            Continue as demo user →
          </button>
        </div>
      </div>
    </div>
  );
}
