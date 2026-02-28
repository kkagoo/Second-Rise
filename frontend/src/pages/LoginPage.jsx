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

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 safe-bottom">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-earth-900">Second Rise</h1>
          <p className="text-earth-500 mt-2 text-sm">Movement built for where you are now.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-earth-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border-2 border-earth-100 bg-white px-4 py-3 text-earth-900 focus:outline-none focus:border-sunrise-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-earth-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border-2 border-earth-100 bg-white px-4 py-3 text-earth-900 focus:outline-none focus:border-sunrise-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-earth-500 mt-6">
          No account yet?{' '}
          <Link to="/signup" className="text-sunrise-600 font-semibold">
            Sign up
          </Link>
        </p>

        <div className="mt-4 pt-4 border-t border-earth-100 text-center">
          <p className="text-xs text-earth-400 mb-2">Testing / demo</p>
          <button
            onClick={async () => {
              setError('');
              setLoading(true);
              try {
                // Create or login demo account
                let res;
                try {
                  res = await client.post('/auth/signup', { email: 'demo@secondrise.app', password: 'demo1234' });
                } catch {
                  res = await client.post('/auth/login', { email: 'demo@secondrise.app', password: 'demo1234' });
                }
                login(res.data.token);
                navigate('/');
              } catch (err) {
                setError('Demo login failed.');
              } finally {
                setLoading(false);
              }
            }}
            className="text-sm text-earth-500 underline tap-target"
            disabled={loading}
          >
            Continue as demo user →
          </button>
        </div>
      </div>
    </div>
  );
}
