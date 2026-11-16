import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/authContextBase.js';
import AdminDashboard from './AdminDashboard.jsx';

describe('AdminDashboard Component', () => {
  it('renders admin dashboard with stat cards and privilege banner for admin users', () => {
    const mockAdminAuth = {
      user: { name: 'Super Admin', role: 'admin', email: 'admin@platform.com' },
      isAuthenticated: true,
      loading: false,
      logout: () => {}
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockAdminAuth}>
          <AdminDashboard />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('Admin Dashboard');
    expect(html).toContain('Platform Administrator');
    expect(html).toContain('Pending Reviews');
    expect(html).toContain('Live Published Courses');
    expect(html).toContain('Categories');
    expect(html).toContain('Users');
    expect(html).toContain('Student Workspace');
    expect(html).toContain('Educator Studio');
  });

  it('renders access denied screen when a student or non-admin attempts to access /admin', () => {
    const mockStudentAuth = {
      user: { name: 'John Student', role: 'student' },
      isAuthenticated: true,
      loading: false,
      logout: () => {}
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockStudentAuth}>
          <AdminDashboard />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('Administrator Access Only');
    expect(html).not.toContain('Live Published Courses');
  });

  it('renders sign-in prompt when an unauthenticated guest visits /admin', () => {
    const mockGuestAuth = {
      user: null,
      isAuthenticated: false,
      loading: false,
      logout: () => {}
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockGuestAuth}>
          <AdminDashboard />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('Admin Authentication Required');
    expect(html).toContain('Sign In as Admin');
  });
});
