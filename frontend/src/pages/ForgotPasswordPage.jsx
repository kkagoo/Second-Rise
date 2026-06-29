import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await client.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-5">📬</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">Check your inbox</h1>
        <p className="text-gray-500 text-sm text-center max-w-xs mb-8 leading-relaxed">
          If <strong>{email}</strong> is registered, we've sent a reset link. Check your spam folder if you don't see it within a minute.
        </p>
        <Link to="/login" className="text-blue-400 font-semibold text-sm">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-4xl mb-5 text-center">🔑</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Forgot your password?</h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email address"
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
            className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-4 transition-colors disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          <Link to="/login" className="text-blue-400 font-semibold">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
