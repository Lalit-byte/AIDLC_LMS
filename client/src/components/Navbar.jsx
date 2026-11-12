import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span>🎓</span>
          <span>OpenLMS</span>
        </Link>
        <nav>
          <ul className="navbar-links">
            <li>
              <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Courses
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                My Learning
              </NavLink>
            </li>
            <li>
              <NavLink to="/studio" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Instructor Studio
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="navbar-actions">
          <Link to="/login" className="btn btn-outline">
            Log in
          </Link>
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
