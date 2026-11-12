import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import CourseCard from '../courses/CourseCard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCurrentUser(), api.getCourses()])
      .then(([userData, courseList]) => {
        setUser(userData);
        setCourses(courseList.filter((c) => userData.enrolledCourseIds.includes(c.id)));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome back, {user ? user.name : 'Learner'}!</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Track your active courses and learning progress.</p>

      {loading ? (
        <div>Loading your enrolled courses...</div>
      ) : courses.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>You haven't enrolled in any courses yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              actionLabel="Resume Course ➔"
              actionUrl={`/learn/${course.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
