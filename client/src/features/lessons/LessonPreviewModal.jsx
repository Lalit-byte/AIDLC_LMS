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
            <h4 className="preview-reading-heading">Lesson Reading</h4>
            <div className="preview-reading-body">
              {lesson.content || 'No text content available for this preview.'}
            </div>
          </div>
        )}

        <div className="preview-body">
          <div className="preview-header">
            <div>
              <span className="badge badge-paid" style={{ marginBottom: '0.5rem' }}>Free Preview</span>
              <h3 className="preview-title">{lesson.title}</h3>
            </div>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ padding: '0.35rem 0.75rem' }}>
              Close
            </button>
          </div>
          <p className="preview-meta tabular-nums">
            Duration: {lesson.duration || 'N/A'} &bull; Type: {(lesson.type || 'video').toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
