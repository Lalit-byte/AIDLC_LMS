import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPlay, FiFileText, FiChevronUp, FiChevronDown, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
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
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading course details...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container gate-card-wrap">
        <div className="gate-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            {error?.includes('404') || !course ? 'Course Not Found' : 'Unable to Load Course'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error || 'The requested course does not exist or may have been unpublished.'}
          </p>
          <Link to="/courses" className="btn btn-outline">
            Back to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const price = typeof course.price === 'number' ? course.price : Number(course.price || 0);
  const isFree = price === 0;
  const categoryName = typeof course.category === 'object' ? course.category?.name : course.category;
  const instructorDisplay =
    typeof course.instructor === 'object'
      ? course.instructor?.name || course.instructorName || 'Instructor'
      : course.instructorName || course.instructor || 'Instructor';
  const totalLessonsCount =
    course.totalLessons ??
    (course.sections?.reduce((sum, s) => sum + (s.lessons?.length || 0), 0) || 0);

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <div className="container course-details-page">
      <Link to="/courses" className="details-back-link">
        <FiArrowLeft size={14} aria-hidden="true" />
        <span>All Published Courses</span>
      </Link>

      <div className="details-layout">
        <div>
          <span className="details-category-tag">{categoryName || 'General'}</span>
          <h1 className="details-title">{course.title}</h1>
          <p className="details-description">{course.description}</p>

          <div className="details-meta-row">
            <span>
              Instructor: <strong>{instructorDisplay}</strong>
            </span>
            <span className="tabular-nums">
              Total Lessons: <strong>{totalLessonsCount}</strong>
            </span>
          </div>

          <h2 className="details-section-heading">Curriculum</h2>
          <div className="curriculum-accordion">
            {(course.sections || []).length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', padding: '1rem 0' }}>
                Curriculum is currently being prepared.
              </p>
            ) : (
              course.sections.map((section) => {
                const sectionKey = section.id || section._id;
                const isOpen = openSections[sectionKey];
                return (
                  <div key={sectionKey} className="section-item">
                    <button
                      type="button"
                      className="section-header"
                      onClick={() => toggleSection(sectionKey)}
                      aria-expanded={Boolean(isOpen)}
                    >
                      <span>{section.title}</span>
                      <span className="section-toggle-label">
                        {isOpen ? (
                          <>
                            <FiChevronUp size={15} aria-hidden="true" /> Collapse
                          </>
                        ) : (
                          <>
                            <FiChevronDown size={15} aria-hidden="true" /> Expand
                          </>
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <ul className="lesson-list">
                        {(section.lessons || []).map((lesson) => {
                          const lessonKey = lesson.id || lesson._id;
                          return (
                            <li key={lessonKey} className="lesson-row">
                              <div className="lesson-row-left">
                                <span className="lesson-type-icon" aria-hidden="true">
                                  {lesson.type === 'video' ? (
                                    <FiPlay size={14} />
                                  ) : (
                                    <FiFileText size={14} />
                                  )}
                                </span>
                                <span>{lesson.title}</span>
                                {lesson.isPreview && (
                                  <button
                                    type="button"
                                    className="preview-btn"
                                    onClick={() => setPreviewLesson(lesson)}
                                  >
                                    Preview
                                  </button>
                                )}
                              </div>
                              <span className="lesson-duration tabular-nums">
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
          <div className="sidebar-thumb-wrap">
            <img
              src={course.thumbnail || '/hero.png'}
              alt={course.title}
              className="sidebar-thumb-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/hero.png';
              }}
            />
          </div>
          <div className="sidebar-card-body">
            <div className="sidebar-price tabular-nums">
              {isFree ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
            </div>
            {course.isEnrolled ? (
              <Link
                to={`/learn/${course.id || course.slug || course._id}`}
                className="btn btn-primary sidebar-cta-btn"
              >
                <span>Go to Classroom</span>
                <FiArrowRight size={15} aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-primary sidebar-cta-btn"
                onClick={() => setShowCheckout(true)}
              >
                {isFree ? 'Enroll for Free' : 'Enroll Now'}
              </button>
            )}
            <div className="sidebar-card-note">
              Lifetime access &bull; Verified certificate &bull; Self-paced
            </div>
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
