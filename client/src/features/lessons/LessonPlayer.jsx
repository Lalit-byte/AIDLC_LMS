import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import './LessonPlayer.css';

export default function LessonPlayer() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);

  useEffect(() => {
    Promise.all([api.getCourseById(courseId), api.getCourseProgress(courseId)])
      .then(([courseData, progressData]) => {
        setCourse(courseData);
        setCompletedLessonIds(progressData);
        // Default to first lesson in first section
        if (courseData?.sections?.length && courseData.sections[0].lessons?.length) {
          setActiveLesson(courseData.sections[0].lessons[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

  // Flattened list of all lessons for linear navigation
  const allLessons = useMemo(() => {
    if (!course?.sections) return [];
    return course.sections.flatMap((sec) => sec.lessons);
  }, [course]);

  const currentIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = activeLesson ? completedLessonIds.includes(activeLesson.id) : false;

  const handleToggleComplete = () => {
    if (!activeLesson) return;
    api.toggleLessonProgress(courseId, activeLesson.id)
      .then(setCompletedLessonIds)
      .catch(console.error);
  };

  const progressPercent = allLessons.length
    ? Math.round((completedLessonIds.length / allLessons.length) * 100)
    : 0;

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading classroom...</div>;
  if (!course) return <div style={{ padding: '4rem', textAlign: 'center' }}>Course not found.</div>;

  return (
    <div className="player-layout">
      {/* Main player area */}
      <section className="player-main">
        <header className="player-header">
          <div>
            <Link to="/dashboard" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              &larr; Back to My Learning
            </Link>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>
              {activeLesson?.title || 'Select a lesson'}
            </h1>
          </div>

          <div className="player-nav-btns">
            <button
              className={`btn ${isCompleted ? 'btn-outline' : 'btn-primary'}`}
              onClick={handleToggleComplete}
              style={{ gap: '0.35rem' }}
            >
              <span>{isCompleted ? '✓ Completed' : 'Mark as Complete'}</span>
            </button>

            <button
              className="btn btn-outline"
              disabled={!prevLesson}
              onClick={() => setActiveLesson(prevLesson)}
            >
              Previous
            </button>
            <button
              className="btn btn-primary"
              disabled={!nextLesson}
              onClick={() => setActiveLesson(nextLesson)}
            >
              Next
            </button>
          </div>
        </header>

        {activeLesson?.type === 'video' ? (
          <div className="video-frame-container">
            <iframe
              src={activeLesson.embedUrl}
              title={activeLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <article className="text-lesson-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
              Lesson Reading & Instructions
            </h2>
            <p>{activeLesson?.content || 'No text content available for this lesson.'}</p>
          </article>
        )}
      </section>

      {/* Curriculum & progress sidebar */}
      <aside className="player-sidebar">
        <div className="sidebar-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{course.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            <span>Progress</span>
            <span>{progressPercent}% completed</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="sidebar-content">
          {course.sections.map((section) => (
            <div key={section.id}>
              <div className="sidebar-section-title">{section.title}</div>
              {section.lessons.map((lesson) => {
                const active = lesson.id === activeLesson?.id;
                const completed = completedLessonIds.includes(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    className={`sidebar-lesson-item ${active ? 'active' : ''}`}
                    onClick={() => setActiveLesson(lesson)}
                  >
                    <span>
                      {lesson.type === 'video' ? '🎬' : '📄'} {lesson.title}
                    </span>
                    {completed && <span className="completed-check">✓</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
