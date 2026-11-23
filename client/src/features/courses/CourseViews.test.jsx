import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/authContextBase.js';
import CourseCard from './CourseCard.jsx';
import CourseList from './CourseList.jsx';

describe('Course Views Component tests', () => {
  it('CourseCard renders course details, free badge, and link to course id', () => {
    const course = {
      id: 'crs_free_1',
      title: 'Intro to React',
      description: 'Learn modern React fundamentals.',
      category: 'Development',
      price: 0,
      thumbnail: 'https://img.example.com/thumb.jpg'
    };

    const html = renderToString(
      <MemoryRouter>
        <CourseCard course={course} />
      </MemoryRouter>
    );

    expect(html).toContain('Intro to React');
    expect(html).toContain('Development');
    expect(html).toContain('badge-free');
    expect(html).toContain('Free');
    expect(html).toContain('/courses/crs_free_1');
  });

  it('CourseCard renders paid pricing formatted in INR', () => {
    const course = {
      _id: 'crs_paid_1',
      title: 'Advanced Node',
      description: 'Master backend architectures.',
      category: 'Backend',
      price: 1499,
      thumbnail: 'https://img.example.com/thumb2.jpg'
    };

    const html = renderToString(
      <MemoryRouter>
        <CourseCard course={course} />
      </MemoryRouter>
    );

    expect(html).toContain('Advanced Node');
    expect(html).toContain('badge-paid');
    expect(html).toContain('₹1,499');
    expect(html).toContain('/courses/crs_paid_1');
  });

  it('CourseList renders home hero and courses without search bar or top courses heading', () => {
    const html = renderToString(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    expect(html).toContain('Master Tech Skills');
    expect(html).not.toContain('Search courses by title, topic, or instructor');
    expect(html).not.toContain('All Prices');
    expect(html).toContain('Curated Curriculum');
    expect(html).not.toContain('Top Courses');
  });

  it('CourseList hides hero, highlights, and CTA banner on /courses while showing search toolbar', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/courses']}>
        <CourseList showHero={false} />
      </MemoryRouter>
    );

    expect(html).not.toContain('Master Tech Skills');
    expect(html).not.toContain('Curated Curriculum');
    expect(html).not.toContain('Transform Your Tech Career With OpenLMS');
    expect(html).toContain('All Published Courses');
    expect(html).toContain('Search courses by title, topic, or instructor');
    expect(html).toContain('All Prices');
  });

  it('CourseList shows CTA banner on home page but hides Get Started for Free button when user is logged in', () => {
    const mockAuth = {
      user: { name: 'Student Dan', role: 'student' },
      isAuthenticated: true,
      logout: () => {}
    };

    const html = renderToString(
      <MemoryRouter initialEntries={['/']}>
        <AuthContext.Provider value={mockAuth}>
          <CourseList showHero={true} />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('Transform Your Tech Career With OpenLMS');
    expect(html).not.toContain('Get Started for Free');
    expect(html).toContain('Browse Free Courses');
  });

  it('CourseList shows Get Started for Free button when guest user is on home page', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/']}>
        <CourseList showHero={true} />
      </MemoryRouter>
    );

    expect(html).toContain('Transform Your Tech Career With OpenLMS');
    expect(html).toContain('Get Started for Free');
  });
});
