import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-2">
          <Link to="/login" className="text-2xl font-extrabold text-gray-900 tracking-tight">
            FreelanceHub<span className="text-orange-500">.</span>
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 mt-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h1>

          {sent ? (
            <div className="mt-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-800">
                  If <span className="font-semibold">{email}</span> is registered, you'll receive a reset link shortly.
                </p>
              </div>
              <Link
                to="/login"
                className="block text-center text-sm text-orange-500 hover:text-orange-600 font-semibold mt-3"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6 mt-1">
                Enter your email and we'll send you a reset link.
              </p>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 text-white py-2.5 rounded-full font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-all shadow-sm"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <p className="text-sm text-center mt-5">
                <Link to="/login" className="text-orange-500 hover:text-orange-600 font-semibold">
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
