import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/authContextBase.js';
import Login from './Login.jsx';
import Register from './Register.jsx';
import Navbar from '../../components/Navbar.jsx';

describe('Auth and Navbar Component Views', () => {
  it('Login renders email, password inputs, and submit button', () => {
    const html = renderToString(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(html).toContain('Sign in to OpenLMS');
    expect(html).toContain('Email address');
    expect(html).toContain('Password');
    expect(html).toContain('Sign In');
  });

  it('Register renders name, email, password inputs, role selector, and submit button', () => {
    const html = renderToString(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(html).toContain('Create an Account');
    expect(html).toContain('Full name');
    expect(html).toContain('Email address');
    expect(html).toContain('Password');
    expect(html).toContain('Student (Learn courses)');
    expect(html).toContain('Teacher / Instructor (Teach courses)');
    expect(html).toContain('Create Account');
  });

  it('Navbar hides Courses, studio, and my learning for unauthenticated guest', () => {
    const html = renderToString(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(html).not.toContain('Courses');
    expect(html).not.toContain('Instructor Studio');
    expect(html).not.toContain('My Learning');
    expect(html).toContain('Log in');
    expect(html).toContain('Get Started');
  });

  it('Navbar renders Student role badge, Courses, and My Learning, but hides Instructor Studio for student', () => {
    const mockStudentContext = {
      user: { name: 'Alice Student', role: 'student' },
      isAuthenticated: true,
      logout: () => {}
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockStudentContext}>
          <Navbar />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('Courses');
    expect(html).toContain('Alice Student');
    expect(html).toContain('Student');
    expect(html).toContain('My Learning');
    expect(html).not.toContain('Instructor Studio');
  });

  it('Navbar renders Teacher role badge and Instructor Studio for instructor', () => {
    const mockTeacherContext = {
      user: { name: 'Bob Teacher', role: 'instructor' },
      isAuthenticated: true,
      logout: () => {}
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockTeacherContext}>
          <Navbar />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('Bob Teacher');
    expect(html).toContain('Teacher');
    expect(html).toContain('Instructor Studio');
  });
});
