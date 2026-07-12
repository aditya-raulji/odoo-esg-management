'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'admin') {
      setEmail('admin@ecosphere.io');
      setPassword('Admin@123');
    } else {
      setEmail('aditi.rao@ecosphere.io');
      setPassword('Emp@123');
    }
    setError('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.08) 0%, var(--bg) 60%)' }}
    >
      {/* Background decoration */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse at 20% 80%, rgba(59,130,246,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.04) 0%, transparent 50%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div
          className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl"
          style={{ boxShadow: '0 0 60px rgba(34,197,94,0.06)' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}
            >
              <Leaf size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                EcoSphere
              </h1>
              <p className="text-xs text-[var(--muted)]">ESG Management Platform</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text)] mb-1">Welcome back</h2>
          <p className="text-sm text-[var(--muted)] mb-6">Sign in to your EcoSphere account</p>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[var(--text)] mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ecosphere.io"
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)] transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[var(--text)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-black transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 rounded-xl bg-[var(--panel2)] border border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
              Demo Credentials
            </p>
            <div className="space-y-2">
              <button
                id="demo-admin-btn"
                type="button"
                onClick={() => fillDemo('admin')}
                className="w-full text-left px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--green)] transition-colors text-xs"
              >
                <span className="font-medium text-[var(--text)]">Admin</span>
                <span className="text-[var(--muted)] ml-2">admin@ecosphere.io / Admin@123</span>
              </button>
              <button
                id="demo-employee-btn"
                type="button"
                onClick={() => fillDemo('employee')}
                className="w-full text-left px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--green)] transition-colors text-xs"
              >
                <span className="font-medium text-[var(--text)]">Employee</span>
                <span className="text-[var(--muted)] ml-2">aditi.rao@ecosphere.io / Emp@123</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--muted)] mt-6">
          EcoSphere © 2026 — ESG Management Platform
        </p>
      </div>
    </div>
  );
}
