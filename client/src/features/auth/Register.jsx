import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({ name, email, password, role });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        <h1 className="auth-card-title">Create an Account</h1>
        <p className="auth-card-subtitle">
          Join OpenLMS and start learning today
        </p>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="register-name" className="studio-field-label">Full name</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="studio-input"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="register-email" className="studio-field-label">Email address</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="studio-input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="studio-field-label">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="studio-input"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="register-role" className="studio-field-label">I want to join as</label>
            <select
              id="register-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="studio-input"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <option value="student">Student (Learn courses)</option>
              <option value="instructor">Teacher / Instructor (Teach courses)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
