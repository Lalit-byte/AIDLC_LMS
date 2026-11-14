import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);

  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMobileMenuOpen(false);
  }

  const isInstructorOrAdmin = user?.role === 'instructor' || user?.role === 'admin';
  const roleLabel =
    user?.role === 'instructor'
      ? 'Teacher'
      : user?.role === 'admin'
      ? 'Admin'
      : 'Student';

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span>🎓</span>
          <span>OpenLMS</span>
        </Link>
        <nav>
          <ul className="navbar-links">
            {isAuthenticated && (
              <li>
                <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Courses
                </NavLink>
              </li>
            )}
            {isAuthenticated && (
              <li>
                <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  My Learning
                </NavLink>
              </li>
            )}
            {isInstructorOrAdmin && (
              <li>
                <NavLink to="/studio" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Instructor Studio
                </NavLink>
              </li>
            )}
            {user?.role === 'admin' && (
              <li>
                <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Admin Panel
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {user?.name || 'Account'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  {roleLabel}
                </span>
              </div>
              <button onClick={logout} className="btn btn-outline" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle button */}
        <button
          type="button"
          className="navbar-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <ul className="navbar-mobile-links">
            {isAuthenticated && (
              <li>
                <NavLink
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Courses
                </NavLink>
              </li>
            )}
            {isAuthenticated && (
              <li>
                <NavLink
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  My Learning
                </NavLink>
              </li>
            )}
            {isInstructorOrAdmin && (
              <li>
                <NavLink
                  to="/studio"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Instructor Studio
                </NavLink>
              </li>
            )}
            {user?.role === 'admin' && (
              <li>
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Admin Panel
                </NavLink>
              </li>
            )}
          </ul>

          <div className="navbar-mobile-actions">
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name}</span>
                  <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>
                    {roleLabel}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
