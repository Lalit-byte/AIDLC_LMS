import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './InstructorStudio.css';

export default function InstructorStudio() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newLesson, setNewLesson] = useState({
    title: '',
    duration: '10 min',
    type: 'video',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    content: '',
    isPreview: true
  });
  const [activeSectionId, setActiveSectionId] = useState(null);

  const loadCourses = () => {
    api.getInstructorCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleStartNewCourse = () => {
    setEditingCourse({
      id: '',
      title: '',
      description: '',
      category: 'Development',
      price: 0,
      currency: 'INR',
      instructor: 'You (Instructor)',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      status: 'draft',
      sections: []
    });
  };

  const handleSaveCourse = (e) => {
    e.preventDefault();
    if (!editingCourse.title) return alert('Please provide a course title.');

    api.saveInstructorCourse(editingCourse)
      .then((updatedList) => {
        setCourses(updatedList);
        setEditingCourse(null);
      })
      .catch(console.error);
  };

  const handleSubmitForReview = (courseId) => {
    api.submitCourseForReview(courseId)
      .then((updatedList) => {
        setCourses(updatedList);
      })
      .catch(console.error);
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSection = {
      id: `sec_${Date.now()}`,
      title: newSectionTitle.trim(),
      lessons: []
    };
    setEditingCourse((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
    setNewSectionTitle('');
  };

  const handleAddLesson = (sectionId) => {
    if (!newLesson.title.trim()) return;
    const lessonItem = {
      ...newLesson,
      id: `lsn_${Date.now()}`
    };

    setEditingCourse((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, lessons: [...sec.lessons, lessonItem] } : sec
      )
    }));

    setNewLesson({
      title: '',
      duration: '10 min',
      type: 'video',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      content: '',
      isPreview: false
    });
    setActiveSectionId(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="badge badge-published">Published</span>;
      case 'pending_review':
        return <span className="badge badge-pending">Under Review</span>;
      default:
        return <span className="badge badge-draft">Draft</span>;
    }
  };

  return (
    <div className="container">
      <header className="studio-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Instructor Studio</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Manage your courses, structure lessons, and submit for platform review.</p>
        </div>
        <button className="btn btn-primary" onClick={handleStartNewCourse}>
          + Create New Course
        </button>
      </header>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>You haven't authored any courses yet.</p>
          <button className="btn btn-primary" onClick={handleStartNewCourse}>Create your first course</button>
        </div>
      ) : (
        <div className="studio-grid">
          {courses.map((course) => (
            <article key={course.id} className="studio-card">
              <div className="studio-card-header">
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {course.category}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0' }}>{course.title}</h3>
                </div>
                {getStatusBadge(course.status)}
              </div>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                {course.description || 'No description provided.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                <span>Sections: <strong>{course.sections?.length || 0}</strong></span>
                <span>Price: <strong>{course.price === 0 ? 'Free' : `₹${course.price}`}</strong></span>
              </div>

              <div className="studio-card-actions">
                <button
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setEditingCourse({ ...course })}
                >
                  Edit / Curriculum
                </button>
                {course.status === 'draft' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSubmitForReview(course.id)}
                  >
                    Submit Review
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Course Editor Modal */}
      {editingCourse && (
        <div className="studio-modal-overlay" onClick={() => setEditingCourse(null)}>
          <div className="studio-modal" onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editingCourse.id ? `Edit Course: ${editingCourse.title}` : 'Create New Course'}
              </h2>
              <button className="modal-close-btn" onClick={() => setEditingCourse(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveCourse} className="studio-modal-body">
              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  required
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  placeholder="e.g. Master React and Node.js"
                />
              </div>

              <div className="form-group">
                <label>Short Description</label>
                <textarea
                  rows="3"
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  placeholder="What will students learn?"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={editingCourse.category}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                  >
                    <option value="Development">Development</option>
                    <option value="Cloud">Cloud</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Price (₹ INR, 0 = Free)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCourse.price}
                    onChange={(e) => setEditingCourse({ ...editingCourse, price: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Curriculum Builder */}
              <div className="curriculum-builder">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Curriculum Builder</h3>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="New section title (e.g. Introduction)"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                  <button type="button" className="btn btn-outline" onClick={handleAddSection}>
                    + Add Section
                  </button>
                </div>

                {editingCourse.sections?.map((section) => (
                  <div key={section.id} className="section-builder-card">
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      📁 {section.title} ({section.lessons?.length || 0} lessons)
                    </h4>

                    {section.lessons?.map((lsn) => (
                      <div key={lsn.id} className="builder-lesson-row">
                        <span>{lsn.type === 'video' ? '🎬' : '📄'} {lsn.title} ({lsn.duration})</span>
                        {lsn.isPreview && <span className="badge badge-paid" style={{ fontSize: '0.7rem' }}>Preview</span>}
                      </div>
                    ))}

                    {activeSectionId === section.id ? (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem' }}>Lesson Title</label>
                          <input
                            type="text"
                            value={newLesson.title}
                            onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                            placeholder="e.g. Architecture Overview"
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', display: 'block' }}>Type</label>
                            <select
                              value={newLesson.type}
                              onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value })}
                              style={{ width: '100%', padding: '0.4rem' }}
                            >
                              <option value="video">Video Embed</option>
                              <option value="text">Text / Reading</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', display: 'block' }}>Duration</label>
                            <input
                              type="text"
                              value={newLesson.duration}
                              onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })}
                            />
                          </div>
                        </div>

                        {newLesson.type === 'video' ? (
                          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem' }}>Embed Video URL (YouTube / Vimeo)</label>
                            <input
                              type="url"
                              value={newLesson.embedUrl}
                              onChange={(e) => setNewLesson({ ...newLesson, embedUrl: e.target.value })}
                            />
                          </div>
                        ) : (
                          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem' }}>Lesson Content</label>
                            <textarea
                              rows="2"
                              value={newLesson.content}
                              onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                            />
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <input
                            type="checkbox"
                            id="previewCheck"
                            checked={newLesson.isPreview}
                            onChange={(e) => setNewLesson({ ...newLesson, isPreview: e.target.checked })}
                          />
                          <label htmlFor="previewCheck" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                            Allow Free Preview
                          </label>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => handleAddLesson(section.id)}
                          >
                            Save Lesson
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => setActiveSectionId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ marginTop: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => setActiveSectionId(section.id)}
                      >
                        + Add Lesson to Section
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingCourse(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
