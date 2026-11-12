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
  }
};
