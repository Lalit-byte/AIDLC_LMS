import { MOCK_COURSES, MOCK_USER } from './mockData';

// Toggle between mock and real API when backend is ready in Phase 2
const USE_MOCK_API = true;
const API_BASE_URL = '/api';

export const api = {
  // Course endpoints
  async getCourses() {
    if (USE_MOCK_API) {
      return Promise.resolve([...MOCK_COURSES]);
    }
    const res = await fetch(`${API_BASE_URL}/courses`);
    return res.json();
  },

  async getCourseById(id) {
    if (USE_MOCK_API) {
      const course = MOCK_COURSES.find((c) => c.id === id);
      return course ? Promise.resolve(course) : Promise.reject(new Error('Course not found'));
    }
    const res = await fetch(`${API_BASE_URL}/courses/${id}`);
    return res.json();
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
