import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '420px', padding: '5rem 1.5rem' }}>
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>Sign in to OpenLMS</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2rem', textAlign: 'center' }}>
          Enter your credentials to access your courses
        </p>

        {error && (
          <div style={{ color: 'var(--color-danger, #ef4444)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
