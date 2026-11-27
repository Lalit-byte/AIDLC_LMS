import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiLayers, FiMenu, FiX } from 'react-icons/fi';
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
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const roleLabel =
    user?.role === 'instructor'
      ? 'Teacher'
      : user?.role === 'admin'
      ? 'Admin'
      : 'Student';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo-mark" aria-hidden="true">
            <FiLayers size={18} />
          </span>
          <span className="brand-title">OpenLMS</span>
        </Link>

        <nav aria-label="Primary">
          <ul className="navbar-links">
            {isAuthenticated && (
              <li>
                <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Home
                </NavLink>
              </li>
            )}
            {isAuthenticated && !isAuthPage && (
              <li>
                <NavLink to="/courses" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
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
            <div className="navbar-user-group">
              <div className="navbar-user-meta">
                <span className="navbar-user-name">{user?.name || 'Account'}</span>
                <span className="navbar-user-role">{roleLabel}</span>
              </div>
              <button type="button" onClick={logout} className="btn btn-outline navbar-logout-btn">
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

        <button
          type="button"
          className="navbar-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <ul className="navbar-mobile-links">
            {isAuthenticated && (
              <li>
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Home
                </NavLink>
              </li>
            )}
            {isAuthenticated && !isAuthPage && (
              <li>
                <NavLink
                  to="/courses"
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
              <div className="navbar-mobile-user-stack">
                <div className="navbar-mobile-user-row">
                  <span className="navbar-user-name">{user?.name}</span>
                  <span className="badge badge-paid">{roleLabel}</span>
                </div>
                <button
                  type="button"
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
              <div className="navbar-mobile-auth-stack">
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
