import { describe, it, expect, afterEach, vi } from 'vitest';
import { api, normalizeCourse } from './api.js';

describe('client api service - course catalogue', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('normalizeCourse standardizes _id, instructor name, and section/lesson IDs', () => {
    const rawCourse = {
      _id: '507f191e810c19729de860ea',
      title: 'Full Stack',
      instructor: { _id: 'inst_1', name: 'John Doe', email: 'john@example.com' },
      sections: [
        {
          _id: 'sec_1',
          title: 'Introduction',
          lessons: [{ _id: 'lsn_1', title: 'Welcome' }]
        }
      ]
    };

    const normalized = normalizeCourse(rawCourse);
    expect(normalized.id).toBe('507f191e810c19729de860ea');
    expect(normalized.instructor).toBe('John Doe');
    expect(normalized.sections[0].id).toBe('sec_1');
    expect(normalized.sections[0].lessons[0].id).toBe('lsn_1');
  });

  it('getCourses queries GET /api/courses with search, category, and price query params', async () => {
    let capturedUrl = '';
    global.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            courses: [
              {
                _id: 'crs_1',
                title: 'React 19 Deep Dive',
                category: 'Development',
                price: 0,
                instructorName: 'Sarah Connor',
                sections: []
              }
            ]
          }
        })
      });
    });

    const courses = await api.getCourses({
      search: 'react',
      category: 'Development',
      price: 'free'
    });

    expect(capturedUrl).toContain('/api/courses?');
    expect(capturedUrl).toContain('search=react');
    expect(capturedUrl).toContain('category=Development');
    expect(capturedUrl).toContain('price=free');
    expect(courses.length).toBe(1);
    expect(courses[0].id).toBe('crs_1');
    expect(courses[0].title).toBe('React 19 Deep Dive');
  });

  it('getCourseById queries /api/courses/:id and returns normalized course', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          course: {
            _id: 'crs_123',
            title: 'Express Masterclass',
            price: 499,
            category: 'Development',
            instructor: { name: 'Alex Smith' },
            sections: [
              {
                _id: 's1',
                title: 'Section 1',
                lessons: [{ _id: 'l1', title: 'Lesson 1' }]
              }
            ]
          }
        }
      })
    });

    const course = await api.getCourseById('crs_123');
    expect(global.fetch).toHaveBeenCalledWith('/api/courses/crs_123');
    expect(course.id).toBe('crs_123');
    expect(course.instructor).toBe('Alex Smith');
    expect(course.sections[0].id).toBe('s1');
  });

  it('getCourseById throws user-friendly error on 404 or server failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        error: { message: 'Course not found.' }
      })
    });

    await expect(api.getCourseById('invalid-id')).rejects.toThrow('Course not found.');
  });
});
