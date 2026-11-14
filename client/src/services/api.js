import { MOCK_COURSES } from './mockData';

// Toggle mock mode: courses live by default (Issue #25)
const USE_MOCK_COURSES = false;
const API_BASE_URL = '/api';

export function isDirectVideo(url) {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url.trim());
}

export function formatEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.includes('youtube.com/embed/') || trimmed.includes('player.vimeo.com/video/')) {
    return trimmed;
  }
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }
  const vimeoMatch = trimmed.match(/vimeo\.com\/([0-9]+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return trimmed;
}

export function normalizeCourse(c) {
  if (!c) return c;
  return {
    ...c,
    id: c.id || c.slug || c._id?.toString(),
    price: typeof c.price === 'number' ? c.price : Number(c.price || 0),
    category: typeof c.category === 'object' ? c.category?.name || 'General' : c.category || 'General',
    instructor:
      typeof c.instructor === 'object'
        ? c.instructor?.name || c.instructorName || 'Instructor'
        : c.instructorName || c.instructor || 'Instructor',
    sections: (c.sections || []).map((s) => ({
      ...s,
      id: s.id || s._id?.toString(),
      lessons: (s.lessons || []).map((l) => ({
        ...l,
        id: l.id || l._id?.toString(),
        embedUrl: formatEmbedUrl(l.embedUrl || l.videoUrl || l.url)
      }))
    }))
  };
}

function getStoredToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    null
  );
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

    const token = getStoredToken();
    const res = token
      ? await fetch(`${API_BASE_URL}/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      : await fetch(`${API_BASE_URL}/courses/${id}`);
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
  async getCurrentUser(token) {
    const authToken = token || getStoredToken();
    if (!authToken) {
      return null;
    }
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to authenticate');
    }
    return data.data.user;
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }
    return data.data; // { user, token }
  },

  async register(userData) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) {
      const details = data.error?.details
        ? ` (${Array.isArray(data.error.details) ? data.error.details.join(', ') : data.error.details})`
        : '';
      throw new Error((data.error?.message || 'Registration failed') + details);
    }
    return data.data; // { user, token }
  },

  // Enrollment & Learning endpoints
  async getEnrolledCourses() {
    const token = getStoredToken();
    if (!token) return [];
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch(`${API_BASE_URL}/enrollments/my-courses`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch enrolled courses.');
    }
    const json = await res.json();
    const list = json.data?.courses || [];
    return list.map(normalizeCourse);
  },

  async enrollFreeCourse(courseId) {
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await fetch(`${API_BASE_URL}/enrollments/${courseId}/free`, {
      method: 'POST',
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Enrollment failed.');
    }
    return res.json();
  },

  // Payment endpoints
  async createPaymentOrder(courseId) {
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await fetch(`${API_BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ courseId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create payment order.');
    }
    return res.json();
  },

  async verifyCheckout(payload) {
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await fetch(`${API_BASE_URL}/payments/verify-checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Payment verification failed.');
    }
    return res.json();
  },

  // Progress tracking endpoints
  async getCourseProgress(courseId) {
    const token = getStoredToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${API_BASE_URL}/enrollments/${courseId}/progress`, { headers });
      if (!res.ok) {
        const stored = localStorage.getItem(`progress_${courseId}`);
        return stored ? JSON.parse(stored) : [];
      }
      const json = await res.json();
      return json.data?.completedLessons || [];
    } catch {
      const stored = localStorage.getItem(`progress_${courseId}`);
      return stored ? JSON.parse(stored) : [];
    }
  },

  async toggleLessonProgress(courseId, lessonId) {
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    try {
      const res = await fetch(`${API_BASE_URL}/enrollments/${courseId}/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ lessonId })
      });
      if (!res.ok) {
        const stored = localStorage.getItem(`progress_${courseId}`);
        let list = stored ? JSON.parse(stored) : [];
        if (list.includes(lessonId)) {
          list = list.filter((id) => id !== lessonId);
        } else {
          list.push(lessonId);
        }
        localStorage.setItem(`progress_${courseId}`, JSON.stringify(list));
        return list;
      }
      const json = await res.json();
      return json.data?.completedLessons || [];
    } catch {
      const stored = localStorage.getItem(`progress_${courseId}`);
      let list = stored ? JSON.parse(stored) : [];
      if (list.includes(lessonId)) {
        list = list.filter((id) => id !== lessonId);
      } else {
        list.push(lessonId);
      }
      localStorage.setItem(`progress_${courseId}`, JSON.stringify(list));
      return list;
    }
  },

  // Instructor Studio endpoints
  async getInstructorDashboard() {
    const token = getStoredToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${API_BASE_URL}/courses/instructor/dashboard`, { headers });
      if (res.ok) {
        const json = await res.json();
        return {
          ...json.data,
          courses: (json.data?.courses || []).map(normalizeCourse)
        };
      }
    } catch {
      // fallback
    }
    const localCourses = JSON.parse(localStorage.getItem('instructor_courses') || '[]');
    return {
      stats: {
        totalEnrolments: 0,
        totalCourses: localCourses.length,
        totalEarnings: 0
      },
      courses: localCourses.map(normalizeCourse),
      latestEnrolments: [],
      allEnrolments: []
    };
  },

  async getInstructorCourses() {
    const token = getStoredToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${API_BASE_URL}/courses/instructor/my-courses`, { headers });
      if (res.ok) {
        const json = await res.json();
        return (json.data?.courses || []).map(normalizeCourse);
      }
    } catch {
      // fallback
    }
    const stored = localStorage.getItem('instructor_courses');
    if (stored) return JSON.parse(stored).map(normalizeCourse);
    return [];
  },

  async saveInstructorCourse(course) {
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const courseId = course._id || course.id;

    if (token) {
      const isExisting = courseId && !courseId.startsWith('crs_');
      const url = isExisting ? `${API_BASE_URL}/courses/${courseId}` : `${API_BASE_URL}/courses`;
      const method = isExisting ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(course)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || (isExisting ? 'Failed to update course.' : 'Failed to create course.'));
      }

      return this.getInstructorDashboard();
    }

    const stored = localStorage.getItem('instructor_courses');
    let list = stored ? JSON.parse(stored) : [...MOCK_COURSES];
    const index = list.findIndex((c) => (c.id || c._id) === courseId);
    if (index >= 0) {
      list[index] = { ...list[index], ...course };
    } else {
      list.unshift({
        ...course,
        id: `crs_${Date.now()}`,
        status: 'draft',
        sections: course.sections || []
      });
    }
    localStorage.setItem('instructor_courses', JSON.stringify(list));
    return this.getInstructorDashboard();
  },

  async submitCourseForReview(courseId) {
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    if (token && courseId && !courseId.startsWith('crs_')) {
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}/submit`, {
        method: 'PATCH',
        headers
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to submit course for review.');
      }
      return this.getInstructorDashboard();
    }

    const stored = localStorage.getItem('instructor_courses');
    let list = stored ? JSON.parse(stored) : [];
    const index = list.findIndex((c) => (c.id || c._id) === courseId);
    if (index >= 0) {
      list[index].status = 'pending_review';
      localStorage.setItem('instructor_courses', JSON.stringify(list));
    }
    return this.getInstructorDashboard();
  },

  async addSection(courseId, sectionData) {
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await fetch(`${API_BASE_URL}/courses/${courseId}/sections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sectionData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to add section.');
    }
    return (await res.json()).data;
  },

  async addLesson(courseId, sectionId, lessonData) {
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await fetch(`${API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons`, {
      method: 'POST',
      headers,
      body: JSON.stringify(lessonData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to add lesson.');
    }
    return (await res.json()).data;
  },

  // Admin Portal endpoints
  async getAdminOverview() {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/admin/overview`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch admin overview.');
    }
    const json = await res.json();
    return json.data;
  },

  async getPendingCourses() {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/admin/courses/pending`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch pending courses.');
    }
    const json = await res.json();
    return json.data?.courses || [];
  },

  async approveCourse(courseId) {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to approve course.');
    }
    const json = await res.json();
    return json.data?.course;
  },

  async rejectCourse(courseId, reason) {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to reject course.');
    }
    const json = await res.json();
    return json.data?.course;
  }
};
