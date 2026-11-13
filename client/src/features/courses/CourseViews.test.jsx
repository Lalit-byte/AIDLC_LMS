import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CourseCard from './CourseCard.jsx';

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
});
