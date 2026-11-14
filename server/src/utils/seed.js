import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/aidlc_lms';

console.log('Connecting to database...');
await mongoose.connect(uri);

const userCol = mongoose.connection.db.collection('users');
const catCol = mongoose.connection.db.collection('categories');
const courseCol = mongoose.connection.db.collection('courses');

// 1. Get or create instructor
let instructor = await userCol.findOne({ role: 'instructor' });
if (!instructor) {
  instructor = await userCol.findOne({});
}

const instructorId = instructor ? instructor._id : new mongoose.Types.ObjectId();
const instructorName = instructor ? instructor.name : 'Platform Instructor';

// 2. Seed Categories
const categories = [
  {
    name: 'Development',
    slug: 'development',
    description: 'Web, mobile, and software development courses',
    isActive: true
  },
  {
    name: 'Cloud',
    slug: 'cloud',
    description: 'Cloud architecture, DevOps, and infrastructure',
    isActive: true
  },
  {
    name: 'Design',
    slug: 'design',
    description: 'UI/UX design systems and product design',
    isActive: true
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Business and product management',
    isActive: true
  }
];

for (const cat of categories) {
  await catCol.updateOne(
    { slug: cat.slug },
    { $set: { ...cat, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
}
console.log('Categories seeded.');

// 3. Seed Courses
const sampleCourses = [
  {
    title: 'Modern Full-Stack Web Development',
    slug: 'modern-fullstack-web-dev',
    description:
      'Master React, Node.js, Express, and MongoDB with hands-on projects and best practices.',
    instructor: instructorId,
    instructorName: instructorName,
    price: 1999,
    currency: 'INR',
    category: 'Development',
    thumbnail:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    totalLessons: 2,
    status: 'published',
    sections: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Getting Started with Full Stack',
        order: 0,
        lessons: [
          {
            _id: new mongoose.Types.ObjectId(),
            title: 'Course Introduction & Architecture',
            duration: '12 min',
            type: 'video',
            embedUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
            content: '',
            isPreview: true,
            order: 0
          },
          {
            _id: new mongoose.Types.ObjectId(),
            title: 'Development Environment Setup',
            duration: '18 min',
            type: 'text',
            content:
              'In this lesson, we configure our local workspace. Ensure you have Node.js 20+ installed, along with Git and a code editor. We will initialize our project structure and verify that our package runner operates smoothly.',
            embedUrl: '',
            isPreview: false,
            order: 1
          }
        ]
      }
    ]
  },
  {
    title: 'Introduction to Cloud & Microservices',
    slug: 'intro-cloud-microservices',
    description:
      'Learn modern cloud patterns, distributed system design, and container orchestration.',
    instructor: instructorId,
    instructorName: instructorName,
    price: 0,
    currency: 'INR',
    category: 'Cloud',
    thumbnail:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    totalLessons: 1,
    status: 'published',
    sections: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Core Fundamentals',
        order: 0,
        lessons: [
          {
            _id: new mongoose.Types.ObjectId(),
            title: 'What is Cloud Native?',
            duration: '15 min',
            type: 'video',
            embedUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
            content: '',
            isPreview: true,
            order: 0
          }
        ]
      }
    ]
  },
  {
    title: 'UI/UX Design Systems with Modern CSS',
    slug: 'ui-ux-design-systems',
    description:
      'Create responsive, scalable, accessible design systems using pure modular CSS.',
    instructor: instructorId,
    instructorName: instructorName,
    price: 1499,
    currency: 'INR',
    category: 'Design',
    thumbnail:
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
    totalLessons: 1,
    status: 'published',
    sections: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Design Foundations',
        order: 0,
        lessons: [
          {
            _id: new mongoose.Types.ObjectId(),
            title: 'Tokens and Responsive Layouts',
            duration: '22 min',
            type: 'text',
            content:
              'CSS Variables allow centralizing design decisions into maintainable tokens. By defining colors, radii, spacing, and font sizes at the root, components stay cohesive without depending on heavy third-party CSS utility frameworks.',
            embedUrl: '',
            isPreview: true,
            order: 0
          }
        ]
      }
    ]
  }
];

for (const c of sampleCourses) {
  await courseCol.updateOne(
    { slug: c.slug },
    { $set: { ...c, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
}
console.log('Courses seeded successfully!');

const totalInDb = await courseCol.countDocuments();
console.log('Total courses in database:', totalInDb);

await mongoose.disconnect();
console.log('Done.');
