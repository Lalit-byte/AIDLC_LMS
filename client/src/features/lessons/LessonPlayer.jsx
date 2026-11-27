import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPlay, FiFileText, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { api, formatEmbedUrl, isDirectVideo } from '../../services/api';
import './LessonPlayer.css';

export default function LessonPlayer() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([api.getCourseById(courseId), api.getCourseProgress(courseId)])
      .then(([courseData, progressData]) => {
        if (!active) return;
        setCourse(courseData);
        setCompletedLessonIds(Array.isArray(progressData) ? progressData : []);
        const firstLesson = courseData?.sections?.[0]?.lessons?.[0];
        if (firstLesson) {
          setActiveLesson(firstLesson);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Unable to load course classroom.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId]);

  const allLessons = useMemo(() => {
    if (!course?.sections) return [];
    return course.sections.flatMap((sec) =>
      (sec.lessons || []).map((l) => ({
        ...l,
        id: l.id || l._id
      }))
    );
  }, [course]);

  const activeLessonId = activeLesson?.id || activeLesson?._id;
  const currentIndex = allLessons.findIndex((l) => (l.id || l._id) === activeLessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = activeLessonId ? completedLessonIds.includes(activeLessonId) : false;

  const handleToggleComplete = () => {
    if (!activeLessonId) return;
    api.toggleLessonProgress(courseId, activeLessonId)
      .then((updated) => {
        setCompletedLessonIds(Array.isArray(updated) ? updated : []);
      })
      .catch(console.error);
  };

  const progressPercent = allLessons.length
    ? Math.round((completedLessonIds.length / allLessons.length) * 100)
    : 0;

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading classroom...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container gate-card-wrap">
        <div className="gate-card">
          <h2 style={{ marginBottom: '1rem' }}>{error || 'Course not found.'}</h2>
          <Link to="/dashboard" className="btn btn-outline">
            Back to My Learning
          </Link>
        </div>
      </div>
    );
  }

  const activeLessonVideoUrl = formatEmbedUrl(
    activeLesson?.embedUrl || activeLesson?.videoUrl || activeLesson?.url || ''
  );

  return (
    <div className="player-layout">
      <section className="player-main">
        <header className="player-header">
          <div>
            <Link to="/dashboard" className="player-back-link">
              <FiArrowLeft size={14} aria-hidden="true" />
              <span>Back to My Learning</span>
            </Link>
            <h1 className="player-lesson-title">
              {activeLesson?.title || 'Select a lesson'}
            </h1>
          </div>

          <div className="player-nav-btns">
            <button
              type="button"
              className={`btn ${isCompleted ? 'btn-outline' : 'btn-primary'}`}
              onClick={handleToggleComplete}
            >
              {isCompleted ? <FiCheck size={15} aria-hidden="true" /> : null}
              <span>{isCompleted ? 'Completed' : 'Mark as Complete'}</span>
            </button>

            <button
              type="button"
              className="btn btn-outline"
              disabled={!prevLesson}
              onClick={() => setActiveLesson(prevLesson)}
            >
              Previous
            </button>
            <button
              type="button"
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
            {isDirectVideo(activeLessonVideoUrl) ? (
              <video src={activeLessonVideoUrl} controls playsInline />
            ) : (
              <iframe
                src={activeLessonVideoUrl}
                title={activeLesson?.title || 'Lesson Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}
          </div>
        ) : (
          <article className="text-lesson-card">
            <h2 className="text-lesson-heading">Lesson Reading &amp; Instructions</h2>
            <p className="text-lesson-body">
              {activeLesson?.content || 'No text content available for this lesson.'}
            </p>
          </article>
        )}
      </section>

      <aside className="player-sidebar" aria-label="Course curriculum">
        <div className="sidebar-header">
          <h2 className="sidebar-course-title">{course.title}</h2>
          <div className="sidebar-progress-meta tabular-nums">
            <span>Progress</span>
            <span>{progressPercent}% completed</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="sidebar-content">
          {(course.sections || []).map((section) => {
            const secKey = section.id || section._id;
            return (
              <div key={secKey}>
                <div className="sidebar-section-title">{section.title}</div>
                {(section.lessons || []).map((lesson) => {
                  const lesKey = lesson.id || lesson._id;
                  const active = lesKey === activeLessonId;
                  const completed = completedLessonIds.includes(lesKey);
                  return (
                    <button
                      key={lesKey}
                      type="button"
                      className={`sidebar-lesson-item ${active ? 'active' : ''}`}
                      onClick={() => setActiveLesson(lesson)}
                    >
                      <span className="sidebar-lesson-label">
                        {lesson.type === 'video' ? (
                          <FiPlay size={13} className="lesson-icon-video" aria-hidden="true" />
                        ) : (
                          <FiFileText size={13} className="lesson-icon-text" aria-hidden="true" />
                        )}
                        <span>{lesson.title}</span>
                      </span>
                      {completed && (
                        <span className="completed-check" aria-label="Completed">
                          <FiCheck size={14} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
