import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/useAuth';
import { api } from '../../services/api';
import CourseCard from '../courses/CourseCard';
import Pagination from '../../components/Pagination';
import { paginateItems } from '../../components/paginationUtils';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

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
      <div className="container gate-card-wrap">
        <div className="gate-card">
          <div className="gate-icon-circle">
            <FiBookOpen size={22} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '1.375rem', marginBottom: '0.5rem' }}>Sign in to view My Learning</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Access all your enrolled courses, lessons, and certificates.
          </p>
          <Link to="/login" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container learning-dashboard">
      <header className="learning-header">
        <div>
          <h1 className="learning-title">
            Welcome back, {user ? user.name : 'Learner'}!
          </h1>
          <p className="learning-subtitle">
            Logged in as <strong style={{ color: 'var(--color-text-main)' }}>{roleLabel}</strong> &bull; Track your active courses and learning progress.
          </p>
        </div>
        <Link to="/courses" className="btn btn-outline">
          <span>Explore Catalogue</span>
          <FiArrowRight size={15} aria-hidden="true" />
        </Link>
      </header>

      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading your enrolled courses...
        </div>
      ) : courses.length === 0 ? (
        <div className="learning-empty-card">
          <div className="gate-icon-circle" style={{ marginBottom: 0 }}>
            <FiBookOpen size={22} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '1.125rem' }}>No Active Enrolments</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', maxWidth: '420px' }}>
            You haven&apos;t enrolled in any courses yet.
          </p>
          <Link to="/courses" className="btn btn-primary">
            Browse Free &amp; Paid Courses
          </Link>
        </div>
      ) : (
        <>
          <div className="responsive-grid" style={{ marginBottom: '2rem' }}>
            {paginateItems(courses, page, 12).items.map((course) => {
              const courseTarget = course.id || course.slug || course._id;
              return (
                <CourseCard
                  key={courseTarget}
                  course={course}
                  actionLabel="Resume Course"
                  actionUrl={`/learn/${courseTarget}`}
                />
              );
            })}
          </div>
          <Pagination
            currentPage={page}
            totalItems={courses.length}
            pageSize={12}
            onPageChange={setPage}
            itemLabel="courses"
          />
        </>
      )}
    </div>
  );
}
