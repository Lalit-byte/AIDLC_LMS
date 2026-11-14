import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { api } from '../../services/api';
import CourseCard from '../courses/CourseCard';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getEnrolledCourses()
      .then((enrolledCourses) => {
        if (!active) return;
        setCourses(enrolledCourses || []);
      })
      .catch(() => {
        if (!active) return;
        setCourses([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const roleLabel =
    user?.role === 'instructor'
      ? 'Teacher'
      : user?.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : 'Student';

  if (!isAuthenticated && !loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Sign in to view My Learning</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Access all your enrolled courses, lessons, and certificates.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block' }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Welcome back, {user ? user.name : 'Learner'}!
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Logged in as <strong style={{ color: 'var(--color-text-main)' }}>{roleLabel}</strong> &bull; Track your active courses and learning progress.
          </p>
        </div>
        <Link to="/" className="btn btn-outline">
          Explore Catalogue
        </Link>
      </div>

      {loading ? (
        <div>Loading your enrolled courses...</div>
      ) : courses.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>
            You haven't enrolled in any courses yet.
          </p>
          <Link to="/" className="btn btn-primary">
            Browse Free & Paid Courses
          </Link>
        </div>
      ) : (
        <div className="responsive-grid">
          {courses.map((course) => {
            const courseTarget = course.id || course.slug || course._id;
            return (
              <CourseCard
                key={courseTarget}
                course={course}
                actionLabel="Resume Course ➔"
                actionUrl={`/learn/${courseTarget}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
