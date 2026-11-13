import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import CheckoutModal from '../checkout/CheckoutModal';
import LessonPreviewModal from '../lessons/LessonPreviewModal';
import './CourseDetails.css';

export default function CourseDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [previewLesson, setPreviewLesson] = useState(null);

  useEffect(() => {
    let active = true;
    api.getCourseById(id)
      .then((data) => {
        if (!active) return;
        setCourse(data);
        const firstSec = data?.sections?.[0];
        if (firstSec) {
          const secKey = firstSec.id || firstSec._id;
          setOpenSections({ [secKey]: true });
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Course not found or network error occurred.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        Loading course details...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
          {error?.includes('404') || !course ? 'Course Not Found' : 'Unable to Load Course'}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          {error || 'The requested course does not exist or may have been unpublished.'}
        </p>
        <Link to="/" className="btn btn-outline">
          Back to Catalogue
        </Link>
      </div>
    );
  }

  const isFree = course.price === 0;
  const instructorDisplay =
    typeof course.instructor === 'object'
      ? course.instructor?.name || course.instructorName || 'Instructor'
      : course.instructorName || course.instructor || 'Instructor';

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <div className="container">
      <div className="details-layout">
        <div>
          <span className="badge badge-paid" style={{ marginBottom: '1rem' }}>{course.category}</span>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>{course.title}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem', marginBottom: '2rem' }}>
            {course.description}
          </p>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            <span>Instructor: <strong style={{ color: 'var(--color-text-main)' }}>{instructorDisplay}</strong></span>
            <span>Total Lessons: <strong style={{ color: 'var(--color-text-main)' }}>{course.totalLessons ?? (course.sections?.reduce((sum, s) => sum + (s.lessons?.length || 0), 0) || 0)}</strong></span>
          </div>

          <h2 style={{ fontSize: '1.375rem', fontWeight: 700 }}>Curriculum</h2>
          <div className="curriculum-accordion">
            {(course.sections || []).length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>Curriculum is currently being prepared.</p>
            ) : (
              course.sections.map((section) => {
                const sectionKey = section.id || section._id;
                const isOpen = openSections[sectionKey];
                return (
                  <div key={sectionKey} className="section-item">
                    <button className="section-header" onClick={() => toggleSection(sectionKey)}>
                      <span>{section.title}</span>
                      <span style={{ fontSize: '0.875rem' }}>{isOpen ? '▲ Collapse' : '▼ Expand'}</span>
                    </button>

                    {isOpen && (
                      <ul className="lesson-list">
                        {(section.lessons || []).map((lesson) => {
                          const lessonKey = lesson.id || lesson._id;
                          return (
                            <li key={lessonKey} className="lesson-row">
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '0.5rem' }}>{lesson.type === 'video' ? '🎬' : '📄'}</span>
                                <span>{lesson.title}</span>
                                {lesson.isPreview && (
                                  <button
                                    className="preview-btn"
                                    onClick={() => setPreviewLesson(lesson)}
                                  >
                                    Preview
                                  </button>
                                )}
                              </div>
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                {lesson.duration}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <aside className="course-sidebar-card">
          <img
            src={course.thumbnail}
            alt={course.title}
            style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}
          />
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-main)' }}>
            {isFree ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', marginBottom: '1rem' }}
            onClick={() => setShowCheckout(true)}
          >
            {isFree ? 'Enroll for Free' : 'Enroll Now'}
          </button>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', textAlign: 'center', lineHeight: 1.4 }}>
            Lifetime access &bull; Verified certificate &bull; Self-paced
          </div>
        </aside>
      </div>

      {showCheckout && (
        <CheckoutModal course={course} onClose={() => setShowCheckout(false)} />
      )}

      {previewLesson && (
        <LessonPreviewModal lesson={previewLesson} onClose={() => setPreviewLesson(null)} />
      )}
    </div>
  );
}
