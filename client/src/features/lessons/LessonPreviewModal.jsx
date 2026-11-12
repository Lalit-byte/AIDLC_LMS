import React from 'react';
import './LessonPreviewModal.css';

export default function LessonPreviewModal({ lesson, onClose }) {
  if (!lesson) return null;

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="preview-video-container">
          {lesson.embedUrl ? (
            <iframe
              src={lesson.embedUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              Preview video not available for this text lesson.
            </div>
          )}
        </div>

        <div className="preview-body">
          <div className="preview-header">
            <div>
              <span className="badge badge-paid" style={{ marginBottom: '0.5rem' }}>Free Preview</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{lesson.title}</h3>
            </div>
            <button className="btn btn-outline" onClick={onClose} style={{ padding: '0.35rem 0.75rem' }}>
              Close
            </button>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Duration: {lesson.duration} &bull; Type: {lesson.type.toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
