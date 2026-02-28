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

  const inputClass = 'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors';

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 safe-bottom">
      <div className="w-full max-w-sm">

        {/* Logo / wordmark */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-stone-900">Second Rise</h1>
          <p className="text-stone-500 mt-1 text-sm">Movement built for where you are now.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-widest">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-widest">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full mt-1">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-5">
          No account?{' '}
          <Link to="/signup" className="text-stone-900 font-semibold underline underline-offset-2">
            Sign up
          </Link>
        </p>

        <div className="mt-6 pt-5 border-t border-stone-200 text-center">
          <p className="text-xs text-stone-400 mb-2">Try without an account</p>
          <button
            onClick={handleDemo}
            disabled={loading}
            className="text-sm font-medium text-stone-600 hover:text-stone-900 tap-target transition-colors underline underline-offset-2"
          >
            Continue as demo user
          </button>
        </div>

      </div>
    </div>
  );
}
