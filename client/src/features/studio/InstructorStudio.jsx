import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { api, formatEmbedUrl } from '../../services/api';
import './InstructorStudio.css';

const defaultCourse = () => ({
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

export default function InstructorStudio() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    stats: { totalEnrolments: 0, totalCourses: 0, totalEarnings: 0 },
    courses: [],
    latestEnrolments: [],
    allEnrolments: []
  });
  const [loading, setLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState(defaultCourse);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newLesson, setNewLesson] = useState({
    title: '',
    duration: '10 min',
    type: 'video',
    embedUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
    content: '',
    isPreview: true
  });
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [notification, setNotification] = useState('');

  const loadDashboard = useCallback(() => {
    api.getInstructorDashboard()
      .then((data) => {
        if (data) {
          setDashboardData(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'instructor' || user?.role === 'admin')) {
      loadDashboard();
    }
  }, [isAuthenticated, user?.role, loadDashboard]);

  if (authLoading) {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        Loading studio...
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'instructor' && user?.role !== 'admin')) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Instructor Access Only</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9375rem', lineHeight: 1.5 }}>
            Instructor Studio is reserved for teachers and course instructors. Students do not have access to this area.
          </p>
          <Link to="/" className="btn btn-primary">
            Explore Courses
          </Link>
        </div>
      </div>
    );
  }

  const { stats, courses, latestEnrolments, allEnrolments } = dashboardData;

  const handleStartNewCourse = () => {
    setEditingCourse(defaultCourse());
    setActiveTab('add_course');
  };

  const handleEditCourse = (course) => {
    setEditingCourse({
      ...course,
      id: course._id || course.id,
      sections: course.sections || []
    });
    setActiveTab('add_course');
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse.title?.trim()) {
      alert('Please provide a course title.');
      return;
    }
    if (!editingCourse.description?.trim()) {
      alert('Please provide a course description.');
      return;
    }

    try {
      const updated = await api.saveInstructorCourse(editingCourse);
      if (updated) {
        setDashboardData(updated);
      }
      setNotification('Course saved successfully!');
      setTimeout(() => setNotification(''), 3500);
      setActiveTab('my_courses');
      setEditingCourse(defaultCourse());
    } catch (err) {
      alert(err.message || 'Failed to save course.');
    }
  };

  const handleSubmitForReview = async (courseId) => {
    try {
      const updated = await api.submitCourseForReview(courseId);
      if (updated) {
        setDashboardData(updated);
      }
      setNotification('Course submitted for review!');
      setTimeout(() => setNotification(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to submit course for review.');
    }
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

  const handleDeleteSection = (sectionId) => {
    setEditingCourse((prev) => ({
      ...prev,
      sections: (prev.sections || []).filter(
        (sec) => String(sec.id || sec._id) !== String(sectionId)
      )
    }));
  };

  const handleAddLesson = (sectionId) => {
    if (!newLesson.title.trim()) return;
    const lessonItem = {
      ...newLesson,
      embedUrl: formatEmbedUrl(newLesson.embedUrl),
      id: `lsn_${Date.now()}`
    };

    setEditingCourse((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((sec) =>
        String(sec.id || sec._id) === String(sectionId)
          ? { ...sec, lessons: [...(sec.lessons || []), lessonItem] }
          : sec
      )
    }));

    setNewLesson({
      title: '',
      duration: '10 min',
      type: 'video',
      embedUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
      content: '',
      isPreview: false
    });
    setActiveSectionId(null);
  };

  const handleDeleteLesson = (sectionId, lessonId) => {
    setEditingCourse((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((sec) => {
        if (String(sec.id || sec._id) === String(sectionId)) {
          return {
            ...sec,
            lessons: (sec.lessons || []).filter(
              (lsn) => String(lsn.id || lsn._id) !== String(lessonId)
            )
          };
        }
        return sec;
      })
    }));
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
    <div className="educator-container">
      {/* Left Sidebar Navigation */}
      <aside className="educator-sidebar">
        <div className="educator-nav">
          <button
            className={`educator-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="educator-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span>Dashboard</span>
          </button>

          <button
            className={`educator-nav-item ${activeTab === 'add_course' ? 'active' : ''}`}
            onClick={handleStartNewCourse}
          >
            <span className="educator-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </span>
            <span>Add Course</span>
          </button>

          <button
            className={`educator-nav-item ${activeTab === 'my_courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_courses')}
          >
            <span className="educator-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <span>My Courses</span>
          </button>

          <button
            className={`educator-nav-item ${activeTab === 'student_enrolled' ? 'active' : ''}`}
            onClick={() => setActiveTab('student_enrolled')}
          >
            <span className="educator-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span>Student Enrolled</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="educator-main">
        {notification && (
          <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500 }}>
            {notification}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading educator workspace...</div>
        ) : activeTab === 'dashboard' ? (
          <div>
            {/* Stat Cards */}
            <div className="educator-stats-grid">
              <div className="educator-stat-card">
                <div className="stat-icon-wrapper stat-icon-blue">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill="#3b82f6" />
                    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" fill="#60a5fa" />
                  </svg>
                </div>
                <div>
                  <div className="stat-value">{stats.totalEnrolments}</div>
                  <div className="stat-label">Total Enrolments</div>
                </div>
              </div>

              <div className="educator-stat-card">
                <div className="stat-icon-wrapper stat-icon-cyan">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <circle cx="11" cy="11" r="3" stroke="#f59e0b" fill="#fef3c7" />
                    <line x1="13.5" y1="13.5" x2="16" y2="16" stroke="#f59e0b" />
                  </svg>
                </div>
                <div>
                  <div className="stat-value">{stats.totalCourses}</div>
                  <div className="stat-label">Total Courses</div>
                </div>
              </div>

              <div className="educator-stat-card">
                <div className="stat-icon-wrapper stat-icon-money">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                    <path d="M19 14c0 3.3-3.1 6-7 6s-7-2.7-7-6c0-2.8 2.2-5.1 5.2-5.8L9 6h6l-1.2 2.2c3 0.7 5.2 3 5.2 5.8z" fill="#3b82f6" />
                    <circle cx="12" cy="14" r="3" fill="#ffffff" />
                    <text x="12" y="16.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#2563eb">₹</text>
                  </svg>
                </div>
                <div>
                  <div className="stat-value">₹{stats.totalEarnings.toLocaleString('en-IN')}</div>
                  <div className="stat-label">Total Earnings</div>
                </div>
              </div>
            </div>

            {/* Latest Enrolments Section */}
            <section className="educator-table-section">
              <h2 className="educator-section-title">Latest Enrolments</h2>
              <div className="educator-table-container">
                <table className="educator-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>Student Name</th>
                      <th>Course Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!latestEnrolments || latestEnrolments.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                          No enrollments recorded yet.
                        </td>
                      </tr>
                    ) : (
                      latestEnrolments.map((enrol, idx) => (
                        <tr key={enrol.id || idx}>
                          <td style={{ fontWeight: 600 }}>{enrol.index || idx + 1}</td>
                          <td style={{ fontWeight: 500 }}>{enrol.studentName}</td>
                          <td>{enrol.courseTitle}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : activeTab === 'add_course' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {editingCourse.id ? `Edit Course: ${editingCourse.title}` : 'Add New Course'}
              </h2>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveTab('my_courses')}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveCourse} style={{ maxWidth: '800px' }}>
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
                  required
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  placeholder="What will students learn?"
                />
              </div>

              <div className="form-row-2col">
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

              <div className="form-group">
                <label>Thumbnail Image URL</label>
                <input
                  type="url"
                  value={editingCourse.thumbnail}
                  onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                  placeholder="https://..."
                />
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSection();
                      }
                    }}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                  <button type="button" className="btn btn-outline" onClick={handleAddSection}>
                    + Add Section
                  </button>
                </div>

                {(editingCourse.sections || []).length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No sections added yet. Add your first section above.</p>
                ) : (
                  editingCourse.sections.map((section) => {
                    const secId = String(section.id || section._id);
                    return (
                      <div key={secId} className="section-builder-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>
                            📁 {section.title} ({section.lessons?.length || 0} lessons)
                          </h4>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleDeleteSection(secId)}
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fca5a5' }}
                            title="Remove section"
                          >
                            Remove
                          </button>
                        </div>

                        {(section.lessons || []).map((lsn) => {
                          const lsnId = String(lsn.id || lsn._id);
                          return (
                            <div key={lsnId} className="builder-lesson-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{lsn.type === 'video' ? '🎬' : '📄'} {lsn.title} ({lsn.duration || 'N/A'})</span>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {lsn.isPreview && <span className="badge badge-published" style={{ fontSize: '0.7rem' }}>Preview</span>}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLesson(secId, lsnId)}
                                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                                  title="Remove lesson"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {activeSectionId === secId ? (
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-sm)' }}>
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                              <label style={{ fontSize: '0.8rem' }}>Lesson Title</label>
                              <input
                                type="text"
                                value={newLesson.title}
                                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddLesson(secId);
                                  }
                                }}
                                placeholder="e.g. Architecture Overview"
                              />
                            </div>

                            <div className="form-row-2col" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
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
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddLesson(secId);
                                    }
                                  }}
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
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddLesson(secId);
                                    }
                                  }}
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
                                id={`previewCheck-${secId}`}
                                checked={newLesson.isPreview}
                                onChange={(e) => setNewLesson({ ...newLesson, isPreview: e.target.checked })}
                              />
                              <label htmlFor={`previewCheck-${secId}`} style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                                Allow Free Preview
                              </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => handleAddLesson(secId)}
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
                            onClick={() => setActiveSectionId(secId)}
                          >
                            + Add Lesson to Section
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setActiveTab('my_courses')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCourse.id ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        ) : activeTab === 'my_courses' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Courses</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>Manage, edit, and submit your courses for platform review.</p>
              </div>
              <button className="btn btn-primary" onClick={handleStartNewCourse}>
                + Add Course
              </button>
            </div>

            {courses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>You haven't authored any courses yet.</p>
                <button className="btn btn-primary" onClick={handleStartNewCourse}>
                  Create your first course
                </button>
              </div>
            ) : (
              <div className="studio-grid">
                {courses.map((course) => {
                  const courseId = course._id || course.id;
                  const price = typeof course.price === 'number' ? course.price : 0;
                  return (
                    <article key={courseId} className="studio-card">
                      <div className="studio-card-header">
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                            {course.category}
                          </span>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0' }}>{course.title}</h3>
                        </div>
                        {getStatusBadge(course.status)}
                      </div>

                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', flex: 1 }}>
                        {course.description || 'No description provided.'}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        <span>Sections: <strong>{course.sections?.length || 0}</strong></span>
                        <span>Price: <strong>{price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}</strong></span>
                      </div>

                      <div className="studio-card-actions">
                        <button
                          className="btn btn-outline"
                          style={{ flex: 1 }}
                          onClick={() => handleEditCourse(course)}
                        >
                          Edit / Curriculum
                        </button>
                        {course.status === 'draft' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleSubmitForReview(courseId)}
                          >
                            Submit Review
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Student Enrolled Section */
          <section className="educator-table-section">
            <h2 className="educator-section-title">All Enrolled Students</h2>
            <div className="educator-table-container">
              <table className="educator-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th>Student Name</th>
                    <th>Student Email</th>
                    <th>Course Title</th>
                    <th>Enrolled Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!allEnrolments || allEnrolments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        No students enrolled in your courses yet.
                      </td>
                    </tr>
                  ) : (
                    allEnrolments.map((enrol, idx) => (
                      <tr key={enrol.id || idx}>
                        <td style={{ fontWeight: 600 }}>{enrol.index || idx + 1}</td>
                        <td style={{ fontWeight: 500 }}>{enrol.studentName}</td>
                        <td style={{ color: '#64748b' }}>{enrol.studentEmail || '-'}</td>
                        <td>{enrol.courseTitle}</td>
                        <td style={{ color: '#64748b' }}>
                          {enrol.enrolledAt ? new Date(enrol.enrolledAt).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <span className="badge badge-published" style={{ textTransform: 'capitalize' }}>
                            {enrol.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
