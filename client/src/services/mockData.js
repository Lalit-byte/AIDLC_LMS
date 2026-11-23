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
            embedUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
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
            embedUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
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
  },
  {
    id: 'crs_04',
    title: 'Practical Python & Machine Learning',
    slug: 'practical-python-machine-learning',
    description: 'Learn data analysis, predictive modeling, and applied machine learning with NumPy and Scikit-Learn.',
    instructor: 'Marcus Chen',
    price: 2499,
    currency: 'INR',
    category: 'Data Science',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    totalLessons: 20,
    status: 'published',
    sections: []
  },
  {
    id: 'crs_05',
    title: 'Kubernetes & CI/CD DevOps in Production',
    slug: 'kubernetes-cicd-devops-production',
    description: 'Master automated container deployments, Helm charts, and continuous delivery pipelines.',
    instructor: 'Priya Sharma',
    price: 0,
    currency: 'INR',
    category: 'DevOps',
    thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop&q=80',
    totalLessons: 14,
    status: 'published',
    sections: []
  },
  {
    id: 'crs_06',
    title: 'Mobile App Engineering with React Native',
    slug: 'mobile-app-engineering-react-native',
    description: 'Build native iOS and Android apps with cross-platform React Native, Expo, and offline sync.',
    instructor: 'Liam O’Connor',
    price: 1899,
    currency: 'INR',
    category: 'Mobile',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80',
    totalLessons: 16,
    status: 'published',
    sections: []
  },
  {
    id: 'crs_07',
    title: 'Applied AI with LLMs & Vector Databases',
    slug: 'applied-ai-llms-vector-databases',
    description: 'Architect generative AI applications using LangChain, embeddings, and RAG retrieval pipelines.',
    instructor: 'Sophia Turner',
    price: 2999,
    currency: 'INR',
    category: 'AI',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80',
    totalLessons: 24,
    status: 'published',
    sections: []
  },
  {
    id: 'crs_08',
    title: 'Modern Cyber Security & Threat Analysis',
    slug: 'modern-cyber-security-threat-analysis',
    description: 'Understand zero-trust architecture, OWASP vulnerabilities, and real-world penetration testing.',
    instructor: 'Tariq Al-Mansoor',
    price: 0,
    currency: 'INR',
    category: 'Security',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
    totalLessons: 10,
    status: 'published',
    sections: []
  }
];
