import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiLock,
  FiHome,
  FiPlusSquare,
  FiPlus,
  FiBook,
  FiBookOpen,
  FiUsers,
  FiTrendingUp,
  FiPlay,
  FiFileText,
  FiFolder,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../context/useAuth';
import { api, formatEmbedUrl } from '../../services/api';
import Pagination from '../../components/Pagination';
import { paginateItems } from '../../components/paginationUtils';
import './InstructorStudio.css';

const defaultCourse = () => ({
  id: '',
  title: '',
  description: '',
  category: 'Development',
  price: '',
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
  const [availableCategories, setAvailableCategories] = useState(['Development', 'Cloud', 'Design', 'Business']);
  const [courseSubTab, setCourseSubTab] = useState('published');
  const [selectedCourseEnrolled, setSelectedCourseEnrolled] = useState('all');
  const [enrolmentsPage, setEnrolmentsPage] = useState(1);
  const [myCoursesPage, setMyCoursesPage] = useState(1);
  const [rosterCoursePage, setRosterCoursePage] = useState(1);
  const [rosterStudentPages, setRosterStudentPages] = useState({});

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
      api.getCategories()
        .then((cats) => {
          const list = (cats || []).filter((c) => c && c !== 'All');
          if (list.length > 0) setAvailableCategories(list);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user?.role, loadDashboard]);

  if (authLoading) {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading studio...
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'instructor' && user?.role !== 'admin')) {
    return (
      <div className="container gate-card-wrap">
        <div className="gate-card">
          <div className="gate-icon-circle">
            <FiLock size={22} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '1.375rem', marginBottom: '0.5rem' }}>Instructor Access Only</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
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
  const isAdmin = user?.role === 'admin';
  const publishedCourses = (courses || []).filter((c) => c.status === 'published');
  const draftCourses = (courses || []).filter((c) => c.status !== 'published');
  const publishedCoursesCount = publishedCourses.length;

  const paginatedLatestEnrolments = paginateItems(latestEnrolments, enrolmentsPage, 10);
  const paginatedPublishedCourses = paginateItems(publishedCourses, myCoursesPage, 9);
  const paginatedDraftCourses = paginateItems(draftCourses, myCoursesPage, 9);
  const filteredRosterCourses =
    selectedCourseEnrolled === 'all'
      ? publishedCourses
      : publishedCourses.filter((c) => String(c._id || c.id) === String(selectedCourseEnrolled));
  const paginatedRosterCourses = paginateItems(filteredRosterCourses, rosterCoursePage, 5);

  const handleStartNewCourse = () => {
    setEditingCourse(defaultCourse());
    setActiveTab('add_course');
  };

  const handleEditCourse = (course) => {
    setEditingCourse({
      ...course,
      id: course._id || course.id,
      price: course.price !== undefined && course.price !== null ? String(course.price) : '0',
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
      const priceNum = editingCourse.price === '' ? 0 : Number(editingCourse.price);
      const payload = {
        ...editingCourse,
        price: isNaN(priceNum) || priceNum < 0 ? 0 : priceNum
      };
      const updated = await api.saveInstructorCourse(payload);
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
        return (
          <span className="status-dot-badge badge-published">
            <span className="status-dot-indicator dot-published" aria-hidden="true" />
            <span>Published</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="status-dot-badge badge-pending">
            <span className="status-dot-indicator dot-pending" aria-hidden="true" />
            <span>Under Review</span>
          </span>
        );
      default:
        return (
          <span className="status-dot-badge badge-draft">
            <span className="status-dot-indicator dot-draft" aria-hidden="true" />
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <div className="educator-container">
      {/* Left Sidebar Navigation */}
      <aside className="educator-sidebar" aria-label="Instructor studio navigation">
        <nav className="educator-nav">
          <button
            type="button"
            className={`educator-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FiHome size={18} className="educator-nav-icon" aria-hidden="true" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`educator-nav-item ${activeTab === 'add_course' ? 'active' : ''}`}
            onClick={handleStartNewCourse}
          >
            <FiPlusSquare size={18} className="educator-nav-icon" aria-hidden="true" />
            <span>Add Course</span>
          </button>

          <button
            type="button"
            className={`educator-nav-item ${activeTab === 'my_courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_courses')}
          >
            <FiBook size={18} className="educator-nav-icon" aria-hidden="true" />
            <span>My Courses</span>
          </button>

          <button
            type="button"
            className={`educator-nav-item ${activeTab === 'student_enrolled' ? 'active' : ''}`}
            onClick={() => setActiveTab('student_enrolled')}
          >
            <FiUsers size={18} className="educator-nav-icon" aria-hidden="true" />
            <span>Student Enrolled</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="educator-main">
        <div className="educator-main-inner">
          {notification && (
            <div className="studio-toast">
              <span>{notification}</span>
              <button
                type="button"
                className="studio-toast-close"
                onClick={() => setNotification('')}
                aria-label="Dismiss notification"
              >
                <FiX size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading educator workspace...
            </div>
          ) : activeTab === 'dashboard' ? (
            <div className="studio-stack">
              <header className="studio-page-header">
                <div>
                  <h1 className="studio-page-title">Dashboard</h1>
                  <p className="studio-page-subtitle">
                    Monitor course enrolments, published catalog inventory, and realized revenue.
                  </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleStartNewCourse}>
                  <FiPlus size={16} aria-hidden="true" />
                  <span>Add Course</span>
                </button>
              </header>

              {/* Editorial Hairline KPI Cards */}
              <section className="educator-stats-grid" aria-label="Instructor overview">
                <article className="educator-stat-card">
                  <header className="stat-card-header">
                    <span className="stat-label">Total Enrolments</span>
                    <FiUsers size={18} style={{ color: 'var(--color-secondary)' }} aria-hidden="true" />
                  </header>
                  <div>
                    <div className="stat-value tabular-nums">{stats.totalEnrolments}</div>
                    <div className="stat-subtext">Across all authored courses</div>
                  </div>
                </article>

                <article className="educator-stat-card">
                  <header className="stat-card-header">
                    <span className="stat-label">
                      {isAdmin ? 'Total Courses' : 'Published Courses'}
                    </span>
                    <FiBookOpen size={18} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                  </header>
                  <div>
                    <div className="stat-value tabular-nums">
                      {isAdmin ? stats.totalCourses : publishedCoursesCount}
                    </div>
                    <div className="stat-subtext">
                      {isAdmin ? 'Authored on platform' : 'Live in public catalogue'}
                    </div>
                  </div>
                </article>

                <article className="educator-stat-card">
                  <header className="stat-card-header">
                    <span className="stat-label">Total Revenue</span>
                    <FiTrendingUp size={18} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
                  </header>
                  <div>
                    <div className="stat-value stat-value-revenue tabular-nums">
                      ₹{(stats.totalEarnings || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="stat-subtext">Verified course sales</div>
                  </div>
                </article>
              </section>

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
                          <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                            No enrollments recorded yet.
                          </td>
                        </tr>
                      ) : (
                        paginatedLatestEnrolments.items.map((enrol, idx) => (
                          <tr key={enrol.id || idx}>
                            <td className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                              {enrol.index || (paginatedLatestEnrolments.currentPage - 1) * 10 + idx + 1}
                            </td>
                            <td style={{ fontWeight: 600 }}>{enrol.studentName}</td>
                            <td>{enrol.courseTitle}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <Pagination
                    currentPage={paginatedLatestEnrolments.currentPage}
                    totalItems={paginatedLatestEnrolments.totalItems}
                    pageSize={10}
                    onPageChange={setEnrolmentsPage}
                    itemLabel="enrolments"
                    className="pagination-embedded"
                  />
                </div>
              </section>
            </div>
          ) : activeTab === 'add_course' ? (
            <div className="studio-stack">
              <header className="studio-page-header">
                <div>
                  <h1 className="studio-page-title">
                    {editingCourse.id ? `Edit Course: ${editingCourse.title}` : 'Add New Course'}
                  </h1>
                  <p className="studio-page-subtitle">
                    Configure course metadata, pricing, and structured curriculum sections.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('my_courses')}
                >
                  Cancel
                </button>
              </header>

              <form onSubmit={handleSaveCourse} className="studio-form-card">
                <div className="form-group">
                  <label htmlFor="course-title">Course Title</label>
                  <input
                    id="course-title"
                    type="text"
                    required
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    placeholder="e.g. Master React and Node.js"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="course-desc">Short Description</label>
                  <textarea
                    id="course-desc"
                    rows="3"
                    required
                    value={editingCourse.description}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    placeholder="What will students learn?"
                  />
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label htmlFor="course-cat">Category</label>
                    <select
                      id="course-cat"
                      value={editingCourse.category}
                      onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    >
                      {Array.from(new Set([...availableCategories, editingCourse.category].filter(Boolean))).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="course-price">Course Price (₹ INR)</label>
                    <input
                      id="course-price"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 499 (0 for Free)"
                      value={editingCourse.price !== undefined && editingCourse.price !== null ? editingCourse.price : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setEditingCourse({ ...editingCourse, price: val });
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="course-thumb">Thumbnail Image URL</label>
                  <input
                    id="course-thumb"
                    type="url"
                    value={editingCourse.thumbnail}
                    onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                {/* Curriculum Builder */}
                <div className="curriculum-builder">
                  <h3 className="curriculum-builder-title">Curriculum Builder</h3>

                  <div className="curriculum-add-row">
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
                      className="studio-input"
                    />
                    <button type="button" className="btn btn-outline" onClick={handleAddSection}>
                      <FiPlus size={15} aria-hidden="true" />
                      <span>Add Section</span>
                    </button>
                  </div>

                  {(editingCourse.sections || []).length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      No sections added yet. Add your first section above.
                    </p>
                  ) : (
                    editingCourse.sections.map((section) => {
                      const secId = String(section.id || section._id);
                      return (
                        <div key={secId} className="section-builder-card">
                          <div className="section-builder-head">
                            <h4 className="section-builder-title">
                              <FiFolder size={15} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                              <span>
                                {section.title} ({section.lessons?.length || 0} lessons)
                              </span>
                            </h4>
                            <button
                              type="button"
                              className="btn btn-outline btn-remove-sm"
                              onClick={() => handleDeleteSection(secId)}
                              title="Remove section"
                            >
                              Remove
                            </button>
                          </div>

                          {(section.lessons || []).map((lsn) => {
                            const lsnId = String(lsn.id || lsn._id);
                            return (
                              <div key={lsnId} className="builder-lesson-row">
                                <span className="builder-lesson-label">
                                  {lsn.type === 'video' ? (
                                    <FiPlay size={13} style={{ color: 'var(--color-secondary)' }} aria-hidden="true" />
                                  ) : (
                                    <FiFileText size={13} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                                  )}
                                  <span>
                                    {lsn.title} ({lsn.duration || 'N/A'})
                                  </span>
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  {lsn.isPreview && (
                                    <span className="status-dot-badge badge-published">Preview</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLesson(secId, lsnId)}
                                    style={{ color: 'var(--color-text-subtle)', display: 'inline-flex', alignItems: 'center' }}
                                    title="Remove lesson"
                                    aria-label="Remove lesson"
                                  >
                                    <FiX size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {activeSectionId === secId ? (
                            <div className="lesson-inline-editor">
                              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
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

                              <div className="form-row-2col" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label style={{ fontSize: '0.8rem' }}>Type</label>
                                  <select
                                    value={newLesson.type}
                                    onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value })}
                                  >
                                    <option value="video">Video Embed</option>
                                    <option value="text">Text / Reading</option>
                                  </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label style={{ fontSize: '0.8rem' }}>Duration</label>
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
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
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
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
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
                              style={{ marginTop: '0.75rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
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
            <div className="studio-stack">
              <header className="studio-page-header">
                <div>
                  <h1 className="studio-page-title">My Courses</h1>
                  <p className="studio-page-subtitle">
                    Manage, edit, and review your authored courses.
                  </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleStartNewCourse}>
                  <FiPlus size={16} aria-hidden="true" />
                  <span>Add Course</span>
                </button>
              </header>

              {/* Filter Strip */}
              <div className="studio-filter-strip">
                <button
                  type="button"
                  className={`studio-filter-pill ${courseSubTab === 'published' ? 'active' : ''}`}
                  onClick={() => {
                    setCourseSubTab('published');
                    setMyCoursesPage(1);
                  }}
                >
                  Published Courses ({publishedCourses.length})
                </button>
                {draftCourses.length > 0 && (
                  <button
                    type="button"
                    className={`studio-filter-pill ${courseSubTab === 'drafts' ? 'active' : ''}`}
                    onClick={() => {
                      setCourseSubTab('drafts');
                      setMyCoursesPage(1);
                    }}
                  >
                    Drafts &amp; Under Review ({draftCourses.length})
                  </button>
                )}
              </div>

              {courseSubTab === 'published' ? (
                publishedCourses.length === 0 ? (
                  <div className="studio-empty-card">
                    <p style={{ color: 'var(--color-text-secondary)' }}>You have no published courses yet.</p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-primary" onClick={handleStartNewCourse}>
                        Create your first course
                      </button>
                      {draftCourses.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => {
                            setCourseSubTab('drafts');
                            setMyCoursesPage(1);
                          }}
                        >
                          View Drafts ({draftCourses.length})
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <section className="studio-grid" aria-label="Published courses">
                      {paginatedPublishedCourses.items.map((course) => {
                      const courseId = course._id || course.id;
                      const price = typeof course.price === 'number' ? course.price : 0;
                      const enrolledCount =
                        course.enrolledCount ||
                        allEnrolments.filter(
                          (e) => String(e.courseId) === String(courseId) || e.courseTitle === course.title
                        ).length;
                      const salesAmount = course.totalEarnings || 0;

                      return (
                        <article key={courseId} className="studio-card">
                          <header className="studio-card-top">
                            <div className="studio-card-meta-row">
                              <span className="studio-card-category">{course.category}</span>
                              {getStatusBadge(course.status)}
                            </div>
                            <h2 className="studio-card-title">{course.title}</h2>
                            <p className="studio-card-desc">
                              {course.description || 'No description provided.'}
                            </p>
                          </header>

                          <div className="studio-metrics-box">
                            <div className="studio-metric-item">
                              <span className="studio-metric-label">Sections</span>
                              <span className="studio-metric-val tabular-nums">{course.sections?.length || 0}</span>
                            </div>
                            <div className="studio-metric-item">
                              <span className="studio-metric-label">Price</span>
                              <span className="studio-metric-val tabular-nums">
                                {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                              </span>
                            </div>
                            <div className="studio-metric-item">
                              <span className="studio-metric-label">Students</span>
                              <span className="studio-metric-val tabular-nums">{enrolledCount}</span>
                            </div>
                            <div className="studio-metric-item">
                              <span className="studio-metric-label">Sales</span>
                              <span
                                className={`studio-metric-val tabular-nums ${
                                  salesAmount > 0 ? 'text-teal' : 'text-muted'
                                }`}
                              >
                                ₹{salesAmount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <footer className="studio-card-actions">
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => handleEditCourse(course)}
                            >
                              Edit / Curriculum
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                setSelectedCourseEnrolled(courseId);
                                setActiveTab('student_enrolled');
                              }}
                            >
                              View Students
                            </button>
                          </footer>
                        </article>
                      );
                    })}
                    </section>
                    <Pagination
                      currentPage={paginatedPublishedCourses.currentPage}
                      totalItems={paginatedPublishedCourses.totalItems}
                      pageSize={9}
                      onPageChange={setMyCoursesPage}
                      itemLabel="courses"
                    />
                  </>
                )
              ) : (
                <>
                  <section className="studio-grid" aria-label="Draft and pending courses">
                    {paginatedDraftCourses.items.map((course) => {
                    const courseId = course._id || course.id;
                    const price = typeof course.price === 'number' ? course.price : 0;
                    return (
                      <article key={courseId} className="studio-card">
                        <header className="studio-card-top">
                          <div className="studio-card-meta-row">
                            <span className="studio-card-category">{course.category}</span>
                            {getStatusBadge(course.status)}
                          </div>
                          <h2 className="studio-card-title">{course.title}</h2>
                          <p className="studio-card-desc">
                            {course.description || 'No description provided.'}
                          </p>
                        </header>

                        <div className="studio-metrics-box">
                          <div className="studio-metric-item">
                            <span className="studio-metric-label">Sections</span>
                            <span className="studio-metric-val tabular-nums">{course.sections?.length || 0}</span>
                          </div>
                          <div className="studio-metric-item">
                            <span className="studio-metric-label">Price</span>
                            <span className="studio-metric-val tabular-nums">
                              {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                            </span>
                          </div>
                        </div>

                        <footer className="studio-card-actions">
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleEditCourse(course)}
                          >
                            Edit / Curriculum
                          </button>
                          {course.status === 'draft' && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleSubmitForReview(courseId)}
                            >
                              Submit Review
                            </button>
                          )}
                        </footer>
                      </article>
                    );
                  })}
                  </section>
                  <Pagination
                    currentPage={paginatedDraftCourses.currentPage}
                    totalItems={paginatedDraftCourses.totalItems}
                    pageSize={9}
                    onPageChange={setMyCoursesPage}
                    itemLabel="courses"
                  />
                </>
              )}
            </div>
          ) : (
            /* Student Enrolled Section */
            <div className="studio-stack">
              <header className="studio-page-header studio-page-header-end">
                <div>
                  <h1 className="studio-page-title">Enrolled Students on Each Course</h1>
                  <p className="studio-page-subtitle">
                    Review enrolled learners, course progress, and enrolment dates across your published courses.
                  </p>
                </div>

                {publishedCourses.length > 0 && (
                  <div className="studio-course-filter">
                    <label htmlFor="course-select-filter">Filter by Course</label>
                    <select
                      id="course-select-filter"
                      value={selectedCourseEnrolled}
                      onChange={(e) => {
                        setSelectedCourseEnrolled(e.target.value);
                        setRosterCoursePage(1);
                      }}
                      className="studio-select"
                    >
                      <option value="all">All Courses ({allEnrolments.length} total students)</option>
                      {publishedCourses.map((c) => {
                        const cId = c._id || c.id;
                        const count = allEnrolments.filter(
                          (e) => String(e.courseId) === String(cId) || e.courseTitle === c.title
                        ).length;
                        return (
                          <option key={cId} value={cId}>
                            {c.title} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </header>

              {publishedCourses.length === 0 ? (
                <div className="studio-empty-card">
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    No published courses found. Once your courses are published and students enroll, they will appear here.
                  </p>
                  <button type="button" className="btn btn-primary" onClick={handleStartNewCourse}>
                    Create a Course
                  </button>
                </div>
              ) : (
                <>
                  {paginatedRosterCourses.items.map((course) => {
                    const courseId = course._id || course.id;
                    const courseEnrolments = allEnrolments.filter(
                      (e) => String(e.courseId) === String(courseId) || e.courseTitle === course.title
                    );
                    const paginatedStudents = paginateItems(
                      courseEnrolments,
                      rosterStudentPages[courseId] || 1,
                      10
                    );

                    return (
                      <section key={courseId} className="roster-section">
                        <header className="roster-header">
                          <div>
                            <span className="roster-category">{course.category}</span>
                            <h2 className="roster-title">{course.title}</h2>
                          </div>
                          <div className="roster-meta">
                            {courseEnrolments.length > 0 ? (
                              <span className="status-dot-badge badge-published tabular-nums">
                                <span className="status-dot-indicator dot-published" aria-hidden="true" />
                                <span>{courseEnrolments.length} Enrolled</span>
                              </span>
                            ) : (
                              <span className="status-dot-badge badge-draft tabular-nums">
                                <span>0 Enrolled</span>
                              </span>
                            )}
                            {course.price > 0 && (
                              <span
                                className={`roster-sales tabular-nums ${
                                  (course.totalEarnings || 0) > 0 ? 'text-teal' : 'text-muted'
                                }`}
                              >
                                Sales: ₹{(course.totalEarnings || 0).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </header>

                        {courseEnrolments.length === 0 ? (
                          <div className="roster-empty">
                            No students enrolled in this course yet.
                          </div>
                        ) : (
                          <div className="educator-table-container roster-table-wrap">
                            <table className="educator-table">
                              <thead>
                                <tr>
                                  <th style={{ width: '56px' }}>#</th>
                                  <th>Student Name</th>
                                  <th>Student Email</th>
                                  <th>Enrolled Date</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedStudents.items.map((enrol, idx) => (
                                  <tr key={enrol.id || idx}>
                                    <td className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                                      {(paginatedStudents.currentPage - 1) * 10 + idx + 1}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{enrol.studentName}</td>
                                    <td style={{ color: 'var(--color-text-secondary)' }}>{enrol.studentEmail || '-'}</td>
                                    <td className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                                      {enrol.enrolledAt ? new Date(enrol.enrolledAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td>
                                      <span className="status-dot-badge badge-published">
                                        <span className="status-dot-indicator dot-published" aria-hidden="true" />
                                        <span>{enrol.status || 'Active'}</span>
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <Pagination
                              currentPage={paginatedStudents.currentPage}
                              totalItems={paginatedStudents.totalItems}
                              pageSize={10}
                              onPageChange={(nextPage) =>
                                setRosterStudentPages((prev) => ({ ...prev, [courseId]: nextPage }))
                              }
                              itemLabel="students"
                              className="pagination-embedded"
                            />
                          </div>
                        )}
                      </section>
                    );
                  })}
                  <Pagination
                    currentPage={paginatedRosterCourses.currentPage}
                    totalItems={paginatedRosterCourses.totalItems}
                    pageSize={5}
                    onPageChange={setRosterCoursePage}
                    itemLabel="courses"
                  />
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
