import React, { useEffect } from 'react';
import { formatEmbedUrl, isDirectVideo } from '../../services/api';
import './LessonPreviewModal.css';

export default function LessonPreviewModal({ lesson, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!lesson) return null;

  const rawUrl = lesson.embedUrl || lesson.videoUrl || lesson.url || '';
  const isVideo = lesson.type === 'video' || (!lesson.type && Boolean(rawUrl));
  const formattedUrl = formatEmbedUrl(rawUrl);

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <div className="preview-video-container">
            {isDirectVideo(formattedUrl) ? (
              <video
                src={formattedUrl}
                controls
                autoPlay
                playsInline
                className="preview-media"
              />
            ) : formattedUrl ? (
              <iframe
                src={formattedUrl}
                title={lesson.title || 'Preview Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="preview-media"
              />
            ) : (
              <div className="preview-empty-state">
                Preview video not available for this lesson.
              </div>
            )}
          </div>
        ) : (
          <div className="preview-text-container">
            <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Lesson Reading</h4>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--color-text-main)' }}>
              {lesson.content || 'No text content available for this preview.'}
            </div>
          </div>
        )}

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
            Duration: {lesson.duration || 'N/A'} &bull; Type: {(lesson.type || 'video').toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
