import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import CheckoutModal from '../checkout/CheckoutModal';
import LessonPreviewModal from '../lessons/LessonPreviewModal';
import './CourseDetails.css';

export default function CourseDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [previewLesson, setPreviewLesson] = useState(null);

  useEffect(() => {
    api.getCourseById(id)
      .then((data) => {
        setCourse(data);
        // Default first section open
        if (data?.sections?.length) {
          setOpenSections({ [data.sections[0].id]: true });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading course details...</div>;
  if (!course) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Course not found.</div>;

  const isFree = course.price === 0;

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
            <span>Instructor: <strong style={{ color: 'var(--color-text-main)' }}>{course.instructor}</strong></span>
            <span>Total Lessons: <strong style={{ color: 'var(--color-text-main)' }}>{course.totalLessons}</strong></span>
          </div>

          <h2 style={{ fontSize: '1.375rem', fontWeight: 700 }}>Curriculum</h2>
          <div className="curriculum-accordion">
            {course.sections.map((section) => {
              const isOpen = openSections[section.id];
              return (
                <div key={section.id} className="section-item">
                  <button className="section-header" onClick={() => toggleSection(section.id)}>
                    <span>{section.title}</span>
                    <span style={{ fontSize: '0.875rem' }}>{isOpen ? '▲ Collapse' : '▼ Expand'}</span>
                  </button>

                  {isOpen && (
                    <ul className="lesson-list">
                      {section.lessons.map((lesson) => (
                        <li key={lesson.id} className="lesson-row">
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
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
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
