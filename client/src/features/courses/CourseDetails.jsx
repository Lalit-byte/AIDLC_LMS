import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function CourseDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCourseById(id)
      .then((data) => setCourse(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading course details...</div>;
  if (!course) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Course not found.</div>;

  const isFree = course.price === 0;

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
        <div>
          <span className="badge badge-paid" style={{ marginBottom: '1rem' }}>{course.category}</span>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{course.title}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem', marginBottom: '2rem' }}>
            {course.description}
          </p>

          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Course Curriculum</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {course.sections.map((section) => (
              <div key={section.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{section.title}</h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0.5rem' }}>
                  {section.lessons.map((lesson) => (
                    <li key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span>🎬 {lesson.title}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{lesson.duration}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', height: 'fit-content', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-md)' }}>
          <img src={course.thumbnail} alt={course.title} style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }} />
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
            {isFree ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
            {isFree ? 'Enroll for Free' : 'Buy Now'}
          </button>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
            Full lifetime access & verified certificate upon completion
          </div>
        </div>
      </div>
    </div>
  );
}
