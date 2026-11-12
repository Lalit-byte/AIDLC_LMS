export const MOCK_USER = {
  id: 'usr_student_01',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  role: 'student',
  enrolledCourseIds: ['crs_01']
};

export const MOCK_COURSES = [
  {
    id: 'crs_01',
    title: 'Modern Full-Stack Web Development',
    slug: 'modern-fullstack-web-dev',
    description: 'Master React, Node.js, Express, and MongoDB with hands-on projects and best practices.',
    instructor: 'Sarah Connor',
    price: 1999,
    currency: 'INR',
    category: 'Development',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    totalLessons: 18,
    status: 'published',
    sections: [
      {
        id: 'sec_01',
        title: 'Getting Started with Full Stack',
        lessons: [
          {
            id: 'lsn_01',
            title: 'Course Introduction & Architecture',
            duration: '12 min',
            type: 'video',
            embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            isPreview: true
          },
          {
            id: 'lsn_02',
            title: 'Development Environment Setup',
            duration: '18 min',
            type: 'text',
            content: 'In this lesson, we configure our local workspace. Ensure you have Node.js 20+ installed, along with Git and a code editor. We will initialize our project structure and verify that our package runner operates smoothly.',
            isPreview: false
          }
        ]
      }
    ]
  },
  {
    id: 'crs_02',
    title: 'Introduction to Cloud & Microservices',
    slug: 'intro-cloud-microservices',
    description: 'Learn modern cloud patterns, distributed system design, and container orchestration.',
    instructor: 'David Miller',
    price: 0,
    currency: 'INR',
    category: 'Cloud',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    totalLessons: 8,
    status: 'published',
    sections: [
      {
        id: 'sec_02',
        title: 'Core Fundamentals',
        lessons: [
          {
            id: 'lsn_03',
            title: 'What is Cloud Native?',
            duration: '15 min',
            type: 'video',
            embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            isPreview: true
          }
        ]
      }
    ]
  },
  {
    id: 'crs_03',
    title: 'UI/UX Design Systems with Modern CSS',
    slug: 'ui-ux-design-systems',
    description: 'Create responsive, scalable, accessible design systems using pure modular CSS.',
    instructor: 'Elena Rostova',
    price: 1499,
    currency: 'INR',
    category: 'Design',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
    totalLessons: 12,
    status: 'published',
    sections: [
      {
        id: 'sec_03',
        title: 'Design Foundations',
        lessons: [
          {
            id: 'lsn_04',
            title: 'Tokens and Responsive Layouts',
            duration: '22 min',
            type: 'text',
            content: 'CSS Variables allow centralizing design decisions into maintainable tokens. By defining colors, radii, spacing, and font sizes at the root, components stay cohesive without depending on heavy third-party CSS utility frameworks.',
            isPreview: true
          }
        ]
      }
    ]
  }
];
