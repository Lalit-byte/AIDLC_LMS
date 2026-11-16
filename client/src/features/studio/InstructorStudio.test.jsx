import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/authContextBase.js';
import InstructorStudio from './InstructorStudio.jsx';

describe('InstructorStudio Component', () => {
  it('renders educator sidebar, stat cards, and latest enrolments for an instructor', () => {
    const mockAuth = {
      user: { name: 'Prof. Davis', role: 'instructor' },
      isAuthenticated: true,
      loading: false,
      logout: () => {}
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <InstructorStudio />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Sidebar items from user specification
    expect(html).toContain('Dashboard');
    expect(html).toContain('Add Course');
    expect(html).toContain('My Courses');
    expect(html).toContain('Student Enrolled');

    // Stat cards for instructors: shows Published Courses, Total Enrolments, and Total Revenue
    expect(html).toContain('Total Enrolments');
    expect(html).toContain('Published Courses');
    expect(html).toContain('Total Revenue');

    // Latest enrolments table
    expect(html).toContain('Latest Enrolments');
    expect(html).toContain('Student Name');
    expect(html).toContain('Course Title');
  });

  it('renders total courses and total revenue cards when accessed by an admin', () => {
    const mockAdminAuth = {
      user: { name: 'Super Admin', role: 'admin' },
      isAuthenticated: true,
      loading: false,
      logout: () => {}
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockAdminAuth}>
          <InstructorStudio />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('Total Enrolments');
    expect(html).toContain('Total Courses');
    expect(html).toContain('Total Revenue');
  });

  it('renders access denied screen when user is a student', () => {
    const mockStudentAuth = {
      user: { name: 'Student John', role: 'student' },
      isAuthenticated: true,
      loading: false,
      logout: () => {}
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockStudentAuth}>
          <InstructorStudio />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('Instructor Access Only');
    expect(html).not.toContain('Total Enrolments');
  });
});
