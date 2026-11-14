import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { api } from '../../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pendingCount: 0,
    publishedCount: 0,
    totalCourses: 0,
    totalUsers: 0
  });
  const [pendingCourses, setPendingCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [notification, setNotification] = useState('');
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [rejectingCourse, setRejectingCourse] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = async () => {
    try {
      const [overviewData, pendingList] = await Promise.all([
        api.getAdminOverview().catch(() => null),
        api.getPendingCourses().catch(() => [])
      ]);

      if (overviewData?.stats) {
        setStats(overviewData.stats);
      }
      if (overviewData?.courses) {
        setAllCourses(overviewData.courses);
      }
      setPendingCourses(pendingList || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    let active = true;
    if (isAuthenticated && user?.role === 'admin') {
      Promise.all([
        api.getAdminOverview().catch(() => null),
        api.getPendingCourses().catch(() => [])
      ])
        .then(([overviewData, pendingList]) => {
          if (!active) return;
          if (overviewData?.stats) setStats(overviewData.stats);
          if (overviewData?.courses) setAllCourses(overviewData.courses);
          setPendingCourses(pendingList || []);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [isAuthenticated, user]);

  const handleApprove = async (courseId, courseTitle) => {
    try {
      await api.approveCourse(courseId);
      setNotification(`✅ "${courseTitle}" has been approved and published! It is now live in All Courses.`);
      setTimeout(() => setNotification(''), 4500);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to approve course.');
    }
  };

  const handleOpenReject = (course) => {
    setRejectingCourse(course);
    setRejectReason('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejecting the course.');
      return;
    }

    try {
      await api.rejectCourse(rejectingCourse._id || rejectingCourse.id, rejectReason.trim());
      setNotification(`⚠️ "${rejectingCourse.title}" has been rejected.`);
      setTimeout(() => setNotification(''), 4500);
      setRejectingCourse(null);
      setRejectReason('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to reject course.');
    }
  };

  // Access check: Only Admin role can access
  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '460px', margin: '0 auto', backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Admin Authentication Required</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Please sign in with an Administrator account to view and manage platform courses.
          </p>
          <Link to="/login" className="btn btn-primary">
            Sign In as Admin
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Administrator Access Only</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
            You are currently logged in as a <strong>{user?.role || 'user'}</strong> ({user?.name}). The Admin Portal is restricted to platform administrators.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Browse Courses
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/login')}>
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <span className="admin-badge">🛡️ Platform Administrator</span>
        <div className="admin-title-row">
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0.25rem 0' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Review educator course submissions, approve courses for publication, and manage platform resources.
            </p>
          </div>
        </div>
      </header>

      {/* Admin Full Access Privileges Banner */}
      <section className="admin-privileges-banner">
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡</span> Unrestricted Admin Privileges Active
          </div>
          <div style={{ fontSize: '0.85rem', color: '#0c4a6e', marginTop: '0.25rem' }}>
            As an administrator, you have full access to student learning, educator course authoring, and platform moderation.
          </div>
        </div>
        <div className="admin-privilege-links">
          <Link to="/dashboard" className="btn btn-outline" style={{ fontSize: '0.825rem', padding: '0.4rem 0.8rem', backgroundColor: '#fff' }}>
            🎓 Student Workspace
          </Link>
          <Link to="/studio" className="btn btn-outline" style={{ fontSize: '0.825rem', padding: '0.4rem 0.8rem', backgroundColor: '#fff' }}>
            ✏️ Educator Studio
          </Link>
          <Link to="/" className="btn btn-outline" style={{ fontSize: '0.825rem', padding: '0.4rem 0.8rem', backgroundColor: '#fff' }}>
            📚 All Courses Catalog
          </Link>
        </div>
      </section>

      {/* Notification Banner */}
      {notification && (
        <div style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.875rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500 }}>
          {notification}
        </div>
      )}

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-pending">⏳</div>
          <div>
            <div className="admin-stat-num">{stats.pendingCount || pendingCourses.length}</div>
            <div className="admin-stat-label">Pending Reviews</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-published">✅</div>
          <div>
            <div className="admin-stat-num">{stats.publishedCount || 0}</div>
            <div className="admin-stat-label">Live Published Courses</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-total">📖</div>
          <div>
            <div className="admin-stat-num">{stats.totalCourses || 0}</div>
            <div className="admin-stat-label">Total Authored Courses</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-users">👥</div>
          <div>
            <div className="admin-stat-num">{stats.totalUsers || 0}</div>
            <div className="admin-stat-label">Registered Users</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <span>⏳ Pending Submissions</span>
          <span className="badge" style={{ backgroundColor: pendingCourses.length > 0 ? '#ef4444' : '#94a3b8', color: '#fff', fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
            {pendingCourses.length}
          </span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'all_courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('all_courses')}
        >
          <span>📋 All Platform Courses</span>
          <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
            {allCourses.length}
          </span>
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>Loading platform administration...</div>
      ) : activeTab === 'pending' ? (
        <div>
          {pendingCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', backgroundColor: '#fff', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Courses Awaiting Review</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                All educator submissions have been reviewed. When an educator submits a course, it will appear here for approval.
              </p>
            </div>
          ) : (
            <div>
              {pendingCourses.map((course) => {
                const courseId = course._id || course.id;
                const isExpanded = expandedCourseId === courseId;
                const price = typeof course.price === 'number' ? course.price : 0;
                const totalLessons = course.totalLessons || (course.sections || []).reduce((sum, s) => sum + (s.lessons?.length || 0), 0);

                return (
                  <article key={courseId} className="admin-pending-card">
                    <div className="pending-card-top">
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'}
                        alt={course.title}
                        className="pending-thumbnail"
                      />

                      <div className="pending-card-main">
                        <div className="pending-badges">
                          <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem' }}>
                            {course.category || 'Development'}
                          </span>
                          <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 600 }}>
                            Under Review
                          </span>
                          <span className="badge" style={{ backgroundColor: price === 0 ? '#dcfce7' : '#e0f2fe', color: price === 0 ? '#15803d' : '#0369a1', fontSize: '0.75rem', fontWeight: 600 }}>
                            {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0 0.5rem' }}>
                          {course.title}
                        </h3>

                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                          {course.description || 'No description provided.'}
                        </p>

                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.825rem', color: '#64748b' }}>
                          <div>
                            👤 Instructor: <strong>{course.instructor?.name || course.instructorName || 'Platform Instructor'}</strong> ({course.instructor?.email || 'N/A'})
                          </div>
                          <div>
                            📁 Curriculum: <strong>{course.sections?.length || 0} sections</strong> ({totalLessons} lessons)
                          </div>
                          <div>
                            📅 Submitted: <strong>{course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Recent'}</strong>
                          </div>
                        </div>

                        {/* Curriculum Accordion Toggle */}
                        <div style={{ marginTop: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedCourseId(isExpanded ? null : courseId)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600, padding: 0 }}
                          >
                            {isExpanded ? '▲ Hide Curriculum Details' : '▼ Inspect Curriculum (' + (course.sections?.length || 0) + ' sections)'}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="curriculum-accordion">
                            {(course.sections || []).length === 0 ? (
                              <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No sections defined in this course.</p>
                            ) : (
                              (course.sections || []).map((sec, secIdx) => (
                                <div key={sec._id || sec.id || secIdx} className="curriculum-section-row">
                                  <div className="curriculum-section-title">
                                    Section {secIdx + 1}: {sec.title} ({sec.lessons?.length || 0} lessons)
                                  </div>
                                  {(sec.lessons || []).map((lsn, lsnIdx) => (
                                    <div key={lsn._id || lsn.id || lsnIdx} className="curriculum-lesson-item">
                                      <span>{lsn.type === 'video' ? '🎬' : '📄'} {lsn.title}</span>
                                      <span>{lsn.duration || 'N/A'} {lsn.isPreview ? '(Free Preview)' : ''}</span>
                                    </div>
                                  ))}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pending-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleApprove(courseId, course.title)}
                        style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', padding: '0.5rem 1.25rem' }}
                      >
                        ✓ Approve & Publish to All Courses
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleOpenReject(course)}
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                      >
                        ✕ Reject with Reason
                      </button>

                      <Link
                        to={`/courses/${course.slug || courseId}`}
                        className="btn btn-outline"
                        style={{ marginLeft: 'auto' }}
                      >
                        Preview Course Page ↗
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* All Platform Courses Tab */
        <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="educator-table">
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Instructor</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allCourses.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No courses found on the platform.
                    </td>
                  </tr>
                ) : (
                  allCourses.map((c) => {
                    const price = typeof c.price === 'number' ? c.price : 0;
                    return (
                      <tr key={c._id || c.id}>
                        <td style={{ fontWeight: 600 }}>{c.title}</td>
                        <td style={{ color: '#64748b' }}>{c.instructor?.name || c.instructorName || 'Platform Instructor'}</td>
                        <td>{c.category}</td>
                        <td>{price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor:
                                c.status === 'published'
                                  ? '#dcfce7'
                                  : c.status === 'pending_review'
                                  ? '#fef3c7'
                                  : '#f1f5f9',
                              color:
                                c.status === 'published'
                                  ? '#15803d'
                                  : c.status === 'pending_review'
                                  ? '#92400e'
                                  : '#475569',
                              textTransform: 'capitalize'
                            }}
                          >
                            {c.status === 'pending_review' ? 'Under Review' : c.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {c.status === 'pending_review' && (
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#16a34a' }}
                                onClick={() => handleApprove(c._id || c.id, c.title)}
                              >
                                Approve
                              </button>
                            )}
                            <Link
                              to={`/courses/${c.slug || c._id || c.id}`}
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingCourse && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.75rem', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Reject Course Submission
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Please provide feedback explaining to the educator why "{rejectingCourse.title}" cannot be approved at this time:
            </p>
            <form onSubmit={handleConfirmReject}>
              <textarea
                rows="4"
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Please add at least 3 lessons and provide a clearer course summary before re-submitting."
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRejectingCourse(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
