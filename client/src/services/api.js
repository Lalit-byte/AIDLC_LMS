import { MOCK_COURSES, MOCK_USER } from './mockData';

// Toggle mock mode: courses live by default (Issue #25)
const USE_MOCK_COURSES = false;
const USE_MOCK_API = true;
const API_BASE_URL = '/api';

export function normalizeCourse(c) {
  if (!c) return c;
  return {
    ...c,
    id: c.id || c.slug || c._id?.toString(),
    instructor:
      typeof c.instructor === 'object'
        ? c.instructor?.name || c.instructorName || 'Instructor'
        : c.instructorName || c.instructor || 'Instructor',
    sections: (c.sections || []).map((s) => ({
      ...s,
      id: s.id || s._id?.toString(),
      lessons: (s.lessons || []).map((l) => ({
        ...l,
        id: l.id || l._id?.toString()
      }))
    }))
  };
}

export const api = {
  // Course endpoints
  async getCourses(params = {}) {
    if (USE_MOCK_COURSES) {
      let result = [...MOCK_COURSES];
      if (params.category && params.category !== 'All') {
        result = result.filter((c) => c.category === params.category);
      }
      if (params.price === 'free') {
        result = result.filter((c) => c.price === 0);
      } else if (params.price === 'paid') {
        result = result.filter((c) => c.price > 0);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        result = result.filter(
          (c) =>
            c.title?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        );
      }
      return Promise.resolve(result.map(normalizeCourse));
    }

    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.price && params.price !== 'all') query.set('price', params.price);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const qs = query.toString();
    const res = await fetch(`${API_BASE_URL}/courses${qs ? `?${qs}` : ''}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch courses: ${res.status}`);
    }
    const json = await res.json();
    const list = json.data?.courses || json.data || [];
    return list.map(normalizeCourse);
  },

  async getCourseById(id) {
    if (USE_MOCK_COURSES) {
      const course = MOCK_COURSES.find((c) => c.id === id || c.slug === id);
      return course
        ? Promise.resolve(normalizeCourse(course))
        : Promise.reject(new Error('Course not found'));
    }

    const res = await fetch(`${API_BASE_URL}/courses/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Course not found (${res.status})`);
    }
    const json = await res.json();
    const course = json.data?.course || json.data;
    return normalizeCourse(course);
  },

  async getCategories() {
    if (USE_MOCK_COURSES) {
      const unique = Array.from(new Set(MOCK_COURSES.map((c) => c.category))).filter(Boolean);
      return Promise.resolve(['All', ...unique]);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) return ['All'];
      const json = await res.json();
      const categories = json.data?.categories || [];
      return ['All', ...categories.map((c) => c.name)];
    } catch {
      return ['All'];
    }
  },

  // Auth endpoints
  async getCurrentUser() {
    if (USE_MOCK_API) {
      return Promise.resolve(MOCK_USER);
    }
    const res = await fetch(`${API_BASE_URL}/auth/me`);
    return res.json();
  },

  async login(credentials) {
    if (USE_MOCK_API) {
      return Promise.resolve({ user: MOCK_USER, token: 'mock-jwt-token' });
    }
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  // Progress tracking endpoints
  async getCourseProgress(courseId) {
    if (USE_MOCK_API) {
      const stored = localStorage.getItem(`progress_${courseId}`);
      return Promise.resolve(stored ? JSON.parse(stored) : []);
    }
    const res = await fetch(`${API_BASE_URL}/courses/${courseId}/progress`);
    return res.json();
  },

  async toggleLessonProgress(courseId, lessonId) {
    if (USE_MOCK_API) {
      const stored = localStorage.getItem(`progress_${courseId}`);
      let list = stored ? JSON.parse(stored) : [];
      if (list.includes(lessonId)) {
        list = list.filter((id) => id !== lessonId);
      } else {
        list.push(lessonId);
      }
      localStorage.setItem(`progress_${courseId}`, JSON.stringify(list));
      return Promise.resolve(list);
    }
    const res = await fetch(`${API_BASE_URL}/courses/${courseId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId })
    });
    return res.json();
  },

  // Instructor Studio endpoints
  async getInstructorCourses() {
    if (USE_MOCK_API) {
      const stored = localStorage.getItem('instructor_courses');
      if (stored) return Promise.resolve(JSON.parse(stored));
      localStorage.setItem('instructor_courses', JSON.stringify(MOCK_COURSES));
      return Promise.resolve([...MOCK_COURSES]);
    }
    const res = await fetch(`${API_BASE_URL}/instructor/courses`);
    return res.json();
  },

  async saveInstructorCourse(course) {
    if (USE_MOCK_API) {
      const stored = localStorage.getItem('instructor_courses');
      let list = stored ? JSON.parse(stored) : [...MOCK_COURSES];
      const index = list.findIndex((c) => c.id === course.id);
      if (index >= 0) {
        list[index] = { ...list[index], ...course };
      } else {
        const newCourse = {
          ...course,
          id: `crs_${Date.now()}`,
          status: 'draft',
          sections: course.sections || []
        };
        list.unshift(newCourse);
      }
      localStorage.setItem('instructor_courses', JSON.stringify(list));
      return Promise.resolve(list);
    }
    const res = await fetch(`${API_BASE_URL}/instructor/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course)
    });
    return res.json();
  },

  async submitCourseForReview(courseId) {
    if (USE_MOCK_API) {
      const stored = localStorage.getItem('instructor_courses');
      let list = stored ? JSON.parse(stored) : [...MOCK_COURSES];
      const index = list.findIndex((c) => c.id === courseId);
      if (index >= 0) {
        list[index].status = 'pending_review';
        localStorage.setItem('instructor_courses', JSON.stringify(list));
      }
      return Promise.resolve(list);
    }
    const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/submit`, {
      method: 'POST'
    });
    return res.json();
  }
};
