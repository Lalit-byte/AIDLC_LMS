import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiLayers,
  FiClock,
  FiGrid,
  FiTag,
  FiUsers,
  FiDollarSign,
  FiBookOpen,
  FiEdit3,
  FiCompass,
  FiCheckCircle,
  FiUser,
  FiCalendar,
  FiPlay,
  FiFileText,
  FiCheck,
  FiX,
  FiExternalLink,
  FiXCircle,
  FiShield,
  FiLock
} from 'react-icons/fi';
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
  const [categories, setCategories] = useState([]);
  const [categoryModal, setCategoryModal] = useState(null);
  const [users, setUsers] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [notification, setNotification] = useState('');
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [rejectingCourse, setRejectingCourse] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Search & Filter states
  const [courseSearch, setCourseSearch] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Payment transactions state
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({
    totalRevenue: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0
  });
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const loadData = async () => {
    try {
      const [overviewData, pendingList, catList, userList, paymentData] = await Promise.all([
        api.getAdminOverview().catch(() => null),
        api.getPendingCourses().catch(() => []),
        api.getAdminCategories().catch(() => []),
        api.getAdminUsers().catch(() => []),
        api.getAdminPayments().catch(() => ({ summary: {}, payments: [] }))
      ]);

      if (overviewData?.stats) {
        setStats(overviewData.stats);
      }
      if (overviewData?.courses) {
        setAllCourses(overviewData.courses);
      }
      setPendingCourses(pendingList || []);
      setCategories(catList || []);
      setUsers(userList || []);
      setPayments(paymentData?.payments || []);
      if (paymentData?.summary) {
        setPaymentSummary(paymentData.summary);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    let active = true;
    if (isAuthenticated && user?.role === 'admin') {
      Promise.all([
        api.getAdminOverview().catch(() => null),
        api.getPendingCourses().catch(() => []),
        api.getAdminCategories().catch(() => []),
        api.getAdminUsers().catch(() => []),
        api.getAdminPayments().catch(() => ({ summary: {}, payments: [] }))
      ])
        .then(([overviewData, pendingList, catList, userList, paymentData]) => {
          if (!active) return;
          if (overviewData?.stats) setStats(overviewData.stats);
          if (overviewData?.courses) setAllCourses(overviewData.courses);
          setPendingCourses(pendingList || []);
          setCategories(catList || []);
          setUsers(userList || []);
          setPayments(paymentData?.payments || []);
          if (paymentData?.summary) {
            setPaymentSummary(paymentData.summary);
          }
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

  const handleOpenCreateCategory = () => {
    setCategoryModal({
      mode: 'create',
      data: { name: '', description: '', isActive: true }
    });
  };

  const handleOpenEditCategory = (cat) => {
    setCategoryModal({
      mode: 'edit',
      id: cat._id || cat.id,
      data: {
        name: cat.name,
        description: cat.description || '',
        isActive: cat.isActive !== false
      }
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryModal.data.name.trim()) {
      alert('Category name is required.');
      return;
    }

    try {
      if (categoryModal.mode === 'create') {
        await api.createCategory(categoryModal.data);
        setNotification(`✅ Category "${categoryModal.data.name.trim()}" created successfully.`);
      } else {
        await api.updateCategory(categoryModal.id, categoryModal.data);
        setNotification(`✅ Category "${categoryModal.data.name.trim()}" updated successfully.`);
      }
      setTimeout(() => setNotification(''), 4500);
      setCategoryModal(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save category.');
    }
  };

  const handleToggleCategoryActive = async (cat) => {
    try {
      const nextStatus = !(cat.isActive !== false);
      await api.updateCategory(cat._id || cat.id, { isActive: nextStatus });
      setNotification(`Category "${cat.name}" is now ${nextStatus ? 'active' : 'inactive'}.`);
      setTimeout(() => setNotification(''), 3500);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update category status.');
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (cat.courseCount > 0) {
      alert(`Cannot delete category "${cat.name}" because ${cat.courseCount} course(s) use it. Deactivate it instead.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteCategory(cat._id || cat.id);
      setNotification(`🗑️ Category "${cat.name}" has been deleted.`);
      setTimeout(() => setNotification(''), 4500);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete category.');
    }
  };

  const handleOpenCreateUser = () => {
    setNewUserData({ name: '', email: '', password: '', role: 'student' });
    setUserModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserData.name.trim()) {
      alert('User name is required.');
      return;
    }
    if (!newUserData.email.trim()) {
      alert('User email is required.');
      return;
    }
    if (!newUserData.password || newUserData.password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      await api.createAdminUser(newUserData);
      setNotification(
        `✅ ${newUserData.role === 'instructor' ? 'Instructor' : 'Student'} "${newUserData.name.trim()}" created successfully.`
      );
      setTimeout(() => setNotification(''), 4500);
      setUserModalOpen(false);
      setNewUserData({ name: '', email: '', password: '', role: 'student' });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create user.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const targetId = targetUser._id || targetUser.id;
    if (user && (user.id === targetId || user._id === targetId)) {
      alert('You cannot delete your own admin account.');
      return;
    }

    if (targetUser.role === 'instructor' && (targetUser.coursesAuthored || 0) > 0) {
      alert(
        `Cannot delete instructor "${targetUser.name}" because they have ${targetUser.coursesAuthored} course(s). Reassign or delete their courses first.`
      );
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${targetUser.role} "${targetUser.name}" (${targetUser.email})? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.deleteAdminUser(targetId);
      setNotification(
        `🗑️ ${targetUser.role === 'instructor' ? 'Instructor' : 'Student'} "${targetUser.name}" deleted.`
      );
      setTimeout(() => setNotification(''), 4500);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  // Filtered lists for course, category, and user tabs
  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      const matchesSearch =
        !courseSearch.trim() ||
        course.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.instructor?.name?.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.category?.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.slug?.toLowerCase().includes(courseSearch.toLowerCase());

      const matchesStatus =
        courseStatusFilter === 'all' || course.status === courseStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allCourses, courseSearch, courseStatusFilter]);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (!categorySearch.trim()) return true;
      const q = categorySearch.toLowerCase();
      return (
        cat.name?.toLowerCase().includes(q) ||
        cat.slug?.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q)
      );
    });
  }, [categories, categorySearch]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);

      const matchesRole =
        userRoleFilter === 'all' || u.role === userRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = paymentSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.orderId?.toLowerCase().includes(q) ||
        p.paymentId?.toLowerCase().includes(q) ||
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.course?.title?.toLowerCase().includes(q);

      const matchesStatus =
        paymentStatusFilter === 'all' || p.status === paymentStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, paymentSearch, paymentStatusFilter]);

  // Access check: Unauthenticated Guest
  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '460px', margin: '0 auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '2.5rem 1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: '1rem', color: '#2563eb' }}>
            <FiShield size={42} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>Admin Authentication Required</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Please sign in with an Administrator account to view and manage platform courses.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem 1rem' }}>
            Sign In as Admin
          </Link>
        </div>
      </div>
    );
  }

  // Access check: Non-Admin Role
  if (user?.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '2.5rem 1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: '1rem', color: '#2563eb' }}>
            <FiLock size={42} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>Administrator Access Only</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
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
    <div className="admin-container admin-layout">
      {/* Left Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-site-brand">
            <div className="admin-site-logo">
              <FiLayers size={22} />
            </div>
            <div className="admin-site-info">
              <span className="admin-site-name">OpenLMS Platform</span>
              <span className="admin-badge">
                <span className="admin-badge-dot"></span>
                Platform Administrator
              </span>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-sidebar-section-title">ADMIN NAVIGATION</div>

          <button
            type="button"
            className={`admin-sidebar-btn admin-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <span className="admin-sidebar-btn-content">
              <FiClock size={16} />
              <span>Pending Submissions</span>
            </span>
            <span className={`admin-tab-badge ${pendingCourses.length > 0 ? 'badge-highlight' : ''}`}>
              {pendingCourses.length}
            </span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn admin-tab-btn ${activeTab === 'all_courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('all_courses')}
          >
            <span className="admin-sidebar-btn-content">
              <FiGrid size={16} />
              <span>All Platform Courses</span>
            </span>
            <span className="admin-tab-badge">
              {allCourses.length}
            </span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <span className="admin-sidebar-btn-content">
              <FiTag size={16} />
              <span>Categories</span>
            </span>
            <span className="admin-tab-badge">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="admin-sidebar-btn-content">
              <FiUsers size={16} />
              <span>Users</span>
            </span>
            <span className="admin-tab-badge">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn admin-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <span className="admin-sidebar-btn-content">
              <FiDollarSign size={16} />
              <span>Transactions & Revenue</span>
            </span>
            <span className="admin-tab-badge">
              {payments.length}
            </span>
          </button>

          <div className="admin-sidebar-section-title" style={{ marginTop: '1.75rem' }}>SWITCH WORKSPACE</div>

          <Link to="/dashboard" className="admin-sidebar-link">
            <FiBookOpen size={15} />
            <span>Student Workspace</span>
          </Link>
          <Link to="/studio" className="admin-sidebar-link">
            <FiEdit3 size={15} />
            <span>Educator Studio</span>
          </Link>
          <Link to="/" className="admin-sidebar-link">
            <FiCompass size={15} />
            <span>Home</span>
          </Link>
        </nav>
      </aside>

      {/* Main Right Content Area */}
      <main className="admin-main">
        <header className="admin-main-header">
          <div className="admin-title-row">
            <div>
              <h1>Admin Dashboard</h1>
              <p className="admin-subtitle">
                Review educator course submissions, manage curriculum categories, and monitor platform operations.
              </p>
            </div>
          </div>
        </header>

        {/* Notification Toast */}
        {notification && (
          <div className="admin-notification-toast">
            <span>{notification}</span>
            <button
              type="button"
              className="admin-notification-close"
              onClick={() => setNotification('')}
              aria-label="Dismiss notification"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Metric Stats Cards */}
        <div className="admin-stats-grid">
          <div
            className="admin-stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('pending')}
          >
            <div>
              <div className="admin-stat-num">{stats.pendingCount || pendingCourses.length}</div>
              <div className="admin-stat-label">Pending Reviews</div>
              <div className="admin-stat-subtext">Awaiting admin review</div>
            </div>
            <div className="admin-stat-icon stat-icon-pending">
              <FiClock size={22} />
            </div>
          </div>

          <div
            className="admin-stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('all_courses')}
          >
            <div>
              <div className="admin-stat-num">{stats.publishedCount || 0}</div>
              <div className="admin-stat-label">Live Published Courses</div>
              <div className="admin-stat-subtext">Visible in public catalog</div>
            </div>
            <div className="admin-stat-icon stat-icon-published">
              <FiCheckCircle size={22} />
            </div>
          </div>

          <div
            className="admin-stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('all_courses')}
          >
            <div>
              <div className="admin-stat-num">{stats.totalCourses || 0}</div>
              <div className="admin-stat-label">Total Authored Courses</div>
              <div className="admin-stat-subtext">Across all instructors</div>
            </div>
            <div className="admin-stat-icon stat-icon-total">
              <FiBookOpen size={22} />
            </div>
          </div>

          <div
            className="admin-stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('users')}
          >
            <div>
              <div className="admin-stat-num">{users.length || stats.totalUsers || 0}</div>
              <div className="admin-stat-label">Registered Users</div>
              <div className="admin-stat-subtext">Students & instructors</div>
            </div>
            <div className="admin-stat-icon stat-icon-users">
              <FiUsers size={22} />
            </div>
          </div>
        </div>

      {/* Tab 1: Pending Submissions */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          Loading platform administration data...
        </div>
      ) : activeTab === 'pending' ? (
        <div>
          {pendingCourses.length === 0 ? (
            <div className="admin-empty-state">
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  border: '1px solid #bbf7d0'
                }}
              >
                <FiCheckCircle size={28} />
              </div>
              <h3 className="admin-empty-title">All Submissions Reviewed</h3>
              <p className="admin-empty-desc">
                There are no courses currently awaiting administrator approval. When instructors submit new curriculum, it will appear here for review and publication.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                onClick={() => setActiveTab('all_courses')}
              >
                Browse All Platform Courses →
              </button>
            </div>
          ) : (
            <div>
              {pendingCourses.map((course) => {
                const courseId = course._id || course.id;
                const isExpanded = expandedCourseId === courseId;
                const price = typeof course.price === 'number' ? course.price : 0;
                const totalLessons =
                  course.totalLessons ||
                  (course.sections || []).reduce((sum, s) => sum + (s.lessons?.length || 0), 0);

                return (
                  <article key={courseId} className="admin-pending-card">
                    <div className="pending-card-top">
                      <img
                        src={
                          course.thumbnail ||
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                        }
                        alt={course.title}
                        className="pending-thumbnail"
                      />

                      <div className="pending-card-main">
                        <div className="pending-badges">
                          <span className="status-pill status-draft">
                            {course.category || 'Development'}
                          </span>
                          <span className="status-pill status-pending">
                            <span className="status-dot"></span>
                            Under Review
                          </span>
                          <span className="status-pill status-active">
                            {price === 0 ? 'Free Course' : `₹${price.toLocaleString('en-IN')}`}
                          </span>
                        </div>

                        <h3 className="pending-title">{course.title}</h3>
                        <p className="pending-desc">
                          {course.description || 'No description provided.'}
                        </p>

                        <div className="pending-meta-grid">
                          <div className="pending-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FiUser size={14} style={{ color: '#64748b' }} />
                            <span>
                              Instructor: <strong>{course.instructor?.name || course.instructorName || 'Platform Instructor'}</strong>
                              {course.instructor?.email ? ` (${course.instructor.email})` : ''}
                            </span>
                          </div>
                          <div className="pending-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FiBookOpen size={14} style={{ color: '#64748b' }} />
                            <span>
                              Curriculum: <strong>{course.sections?.length || 0} sections</strong> ({totalLessons} lessons)
                            </span>
                          </div>
                          <div className="pending-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FiCalendar size={14} style={{ color: '#64748b' }} />
                            <span>
                              Submitted: <strong>{course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Recent'}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Curriculum Accordion Toggle */}
                        <div style={{ marginTop: '0.65rem' }}>
                          <button
                            type="button"
                            className="curriculum-accordion-btn"
                            onClick={() => setExpandedCourseId(isExpanded ? null : courseId)}
                          >
                            <span>{isExpanded ? '▲ Hide Curriculum Details' : '▼ Inspect Curriculum & Lessons'}</span>
                          </button>

                          {isExpanded && (
                            <div className="curriculum-accordion">
                              {!course.sections || course.sections.length === 0 ? (
                                <p style={{ color: '#94a3b8', margin: 0 }}>No sections configured yet.</p>
                              ) : (
                                course.sections.map((sec, secIdx) => (
                                  <div key={sec._id || secIdx} className="curriculum-section-row">
                                    <div className="curriculum-section-title">
                                      Section {secIdx + 1}: {sec.title}
                                    </div>
                                    {(sec.lessons || []).map((les, lesIdx) => (
                                      <div key={les._id || lesIdx} className="curriculum-lesson-item">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                          {les.type === 'video' ? (
                                            <FiPlay size={13} style={{ color: '#2563eb' }} />
                                          ) : (
                                            <FiFileText size={13} style={{ color: '#059669' }} />
                                          )}
                                          <span>{les.title}</span>
                                          {les.isPreview && (
                                            <span style={{ fontSize: '0.7rem', color: '#16a34a', marginLeft: '0.35rem', fontWeight: 600 }}>
                                              FREE PREVIEW
                                            </span>
                                          )}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                          {les.duration || '10 min'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pending-actions">
                          <button
                            type="button"
                            className="btn-table-action btn-action-primary"
                            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
                            onClick={() => handleApprove(courseId, course.title)}
                          >
                            <FiCheck size={14} style={{ marginRight: '0.35rem' }} />
                            <span>Approve & Publish Course</span>
                          </button>
                          <button
                            type="button"
                            className="btn-table-action btn-action-danger"
                            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
                            onClick={() => handleOpenReject(course)}
                          >
                            <FiX size={14} style={{ marginRight: '0.35rem' }} />
                            <span>Reject Course</span>
                          </button>
                          <Link
                            to={`/courses/${course.slug || courseId}`}
                            className="btn-table-action"
                            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
                          >
                            <span>Preview Course</span>
                            <FiExternalLink size={12} style={{ marginLeft: '0.35rem' }} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Tab 2: All Platform Courses */}
      {!loading && activeTab === 'all_courses' && (
        <div>
          {/* Filter Bar */}
          <div className="admin-filter-bar">
            <div className="admin-filter-group">
              <input
                type="text"
                placeholder="Search by title, instructor, or category..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="admin-search-input"
              />
              <select
                value={courseStatusFilter}
                onChange={(e) => setCourseStatusFilter(e.target.value)}
                className="admin-select-input"
              >
                <option value="all">All Statuses ({allCourses.length})</option>
                <option value="published">Published</option>
                <option value="pending_review">Under Review</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Showing <strong>{filteredCourses.length}</strong> of {allCourses.length} courses
            </div>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        No courses match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((c) => {
                      const courseId = c._id || c.id;
                      const price = typeof c.price === 'number' ? c.price : 0;
                      return (
                        <tr key={courseId}>
                          <td>
                            <div className="table-course-item">
                              <img
                                src={c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'}
                                alt={c.title}
                                className="table-course-thumb"
                              />
                              <div>
                                <div className="table-course-title" title={c.title}>
                                  {c.title}
                                </div>
                                <div className="table-course-slug">{c.slug || courseId}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, color: '#1e293b' }}>
                              {c.instructor?.name || c.instructorName || 'Platform Instructor'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {c.instructor?.email || '—'}
                            </div>
                          </td>
                          <td>
                            <span className="status-pill status-draft">
                              {c.category || 'General'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: price === 0 ? '#16a34a' : '#0f172a' }}>
                              {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${
                                c.status === 'published'
                                  ? 'status-published'
                                  : c.status === 'pending_review'
                                  ? 'status-pending'
                                  : c.status === 'rejected'
                                  ? 'status-rejected'
                                  : 'status-draft'
                              }`}
                            >
                              <span className="status-dot"></span>
                              {c.status === 'pending_review' ? 'Under Review' : c.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="admin-action-btn-group" style={{ justifyContent: 'flex-end' }}>
                              {c.status === 'pending_review' && (
                                <button
                                  type="button"
                                  className="btn-table-action btn-action-primary"
                                  onClick={() => handleApprove(courseId, c.title)}
                                >
                                  Approve
                                </button>
                              )}
                              <Link
                                to={`/courses/${c.slug || courseId}`}
                                className="btn-table-action"
                              >
                                View →
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
        </div>
      )}

      {/* Tab 3: Categories */}
      {!loading && activeTab === 'categories' && (
        <div>
          <div className="admin-filter-bar">
            <div className="admin-filter-group">
              <input
                type="text"
                placeholder="Search categories by name or slug..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="admin-search-input"
              />
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Showing <strong>{filteredCategories.length}</strong> of {categories.length} categories
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              onClick={handleOpenCreateCategory}
            >
              <span>＋</span> Add Category
            </button>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Assigned Courses</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        {categories.length === 0
                          ? 'No categories found. Click "Add Category" to create your first one.'
                          : 'No categories match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const catId = cat._id || cat.id;
                      const hasCourses = (cat.courseCount || 0) > 0;
                      return (
                        <tr key={catId}>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{cat.name}</td>
                          <td>
                            <code style={{ fontSize: '0.78rem', backgroundColor: '#f1f5f9', padding: '0.2rem 0.45rem', borderRadius: '4px', color: '#475569' }}>
                              {cat.slug}
                            </code>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '300px' }}>
                            {cat.description || '—'}
                          </td>
                          <td>
                            <span className="status-pill status-draft">
                              {cat.courseCount || 0} course{cat.courseCount === 1 ? '' : 's'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${cat.isActive !== false ? 'status-active' : 'status-inactive'}`}>
                              <span className="status-dot"></span>
                              {cat.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="admin-action-btn-group" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn-table-action"
                                onClick={() => handleOpenEditCategory(cat)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-table-action"
                                onClick={() => handleToggleCategoryActive(cat)}
                              >
                                {cat.isActive !== false ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                className="btn-table-action btn-action-danger"
                                disabled={hasCourses}
                                title={
                                  hasCourses
                                    ? `Cannot delete category assigned to ${cat.courseCount} course(s). Deactivate instead.`
                                    : 'Delete category'
                                }
                                onClick={() => handleDeleteCategory(cat)}
                              >
                                Delete
                              </button>
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
        </div>
      )}

      {/* Tab 4: Users (Students & Teachers/Instructors) */}
      {!loading && activeTab === 'users' && (
        <div>
          <div className="admin-filter-bar">
            <div className="admin-filter-group">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="admin-search-input"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="admin-select-input"
              >
                <option value="all">All Roles ({users.length})</option>
                <option value="student">Students</option>
                <option value="instructor">Teachers / Instructors</option>
                <option value="admin">Administrators</option>
              </select>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Showing <strong>{filteredUsers.length}</strong> of {users.length} users
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              onClick={handleOpenCreateUser}
            >
              <span>＋</span> Add Student / Teacher
            </button>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Activity & Courses</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        No users match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const uId = u._id || u.id;
                      const isCurrentAdmin = user && (user.id === uId || user._id === uId);
                      const hasCourses = u.role === 'instructor' && (u.coursesAuthored || 0) > 0;

                      return (
                        <tr key={uId}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor:
                                    u.role === 'instructor'
                                      ? '#ede9fe'
                                      : u.role === 'admin'
                                      ? '#fee2e2'
                                      : '#e0f2fe',
                                  color:
                                    u.role === 'instructor'
                                      ? '#6d28d9'
                                      : u.role === 'admin'
                                      ? '#b91c1c'
                                      : '#0369a1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  flexShrink: 0
                                }}
                              >
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                  {u.name}
                                  {isCurrentAdmin && (
                                    <span style={{ fontSize: '0.7rem', color: '#2563eb', marginLeft: '0.4rem', fontWeight: 500 }}>
                                      (You)
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${
                                u.role === 'instructor'
                                  ? 'status-pending'
                                  : u.role === 'admin'
                                  ? 'status-rejected'
                                  : 'status-published'
                              }`}
                            >
                              <span className="status-dot"></span>
                              {u.role === 'instructor' ? 'Teacher / Instructor' : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                            </span>
                          </td>
                          <td>
                            {u.role === 'instructor' ? (
                              <span className="status-pill status-draft">
                                🎓 {u.coursesAuthored || 0} course{u.coursesAuthored === 1 ? '' : 's'} authored
                              </span>
                            ) : u.role === 'student' ? (
                              <span className="status-pill status-draft">
                                📚 {u.coursesEnrolled || 0} course{u.coursesEnrolled === 1 ? '' : 's'} enrolled
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Platform Administrator</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.825rem', color: '#64748b' }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                          </td>
                          <td>
                            <span className={`status-pill ${u.isActive !== false ? 'status-active' : 'status-inactive'}`}>
                              <span className="status-dot"></span>
                              {u.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="admin-action-btn-group" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn-table-action btn-action-danger"
                                disabled={isCurrentAdmin || hasCourses}
                                title={
                                  isCurrentAdmin
                                    ? 'Cannot delete your own admin account'
                                    : hasCourses
                                    ? `Cannot delete instructor with ${u.coursesAuthored} active courses`
                                    : `Delete ${u.role}`
                                }
                                onClick={() => handleDeleteUser(u)}
                              >
                                Delete
                              </button>
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
        </div>
      )}

      {/* Tab 5: Transactions & Revenue Ledger */}
      {!loading && activeTab === 'payments' && (
        <div>
          {/* Revenue & Payment Summary Metrics */}
          <div className="admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="admin-stat-card">
              <div>
                <div className="admin-stat-num" style={{ color: '#16a34a' }}>
                  ₹{(paymentSummary.totalRevenue || 0).toLocaleString('en-IN')}
                </div>
                <div className="admin-stat-label">Total Realized Revenue</div>
                <div className="admin-stat-subtext">From successful course enrollments</div>
              </div>
              <div className="admin-stat-icon stat-icon-published">
                <FiDollarSign size={22} />
              </div>
            </div>

            <div className="admin-stat-card">
              <div>
                <div className="admin-stat-num">{paymentSummary.successfulPayments || 0}</div>
                <div className="admin-stat-label">Successful Payments</div>
                <div className="admin-stat-subtext">Verified gateway transactions</div>
              </div>
              <div className="admin-stat-icon stat-icon-total">
                <FiCheckCircle size={22} />
              </div>
            </div>

            <div className="admin-stat-card">
              <div>
                <div className="admin-stat-num" style={{ color: '#d97706' }}>
                  {paymentSummary.pendingPayments || 0}
                </div>
                <div className="admin-stat-label">Created / In-Progress</div>
                <div className="admin-stat-subtext">Awaiting checkout completion</div>
              </div>
              <div className="admin-stat-icon stat-icon-pending">
                <FiClock size={22} />
              </div>
            </div>

            <div className="admin-stat-card">
              <div>
                <div className="admin-stat-num" style={{ color: '#dc2626' }}>
                  {paymentSummary.failedPayments || 0}
                </div>
                <div className="admin-stat-label">Failed / Declined</div>
                <div className="admin-stat-subtext">Payment attempt failed or cancelled</div>
              </div>
              <div className="admin-stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                <FiXCircle size={22} />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="admin-filter-bar">
            <div className="admin-filter-group">
              <input
                type="text"
                placeholder="Search by order ID, payment ID, learner name, email, or course..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="admin-search-input"
                style={{ width: '420px' }}
              />
              {paymentSearch && (
                <button
                  type="button"
                  onClick={() => setPaymentSearch('')}
                  style={{
                    marginLeft: '-2.2rem',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                  title="Clear search"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className="admin-filter-group">
              <div className="admin-status-segmented">
                <button
                  type="button"
                  className={`segmented-btn ${paymentStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPaymentStatusFilter('all')}
                >
                  All ({payments.length})
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${paymentStatusFilter === 'paid' ? 'active' : ''}`}
                  onClick={() => setPaymentStatusFilter('paid')}
                >
                  Paid ({paymentSummary.successfulPayments || 0})
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${paymentStatusFilter === 'created' ? 'active' : ''}`}
                  onClick={() => setPaymentStatusFilter('created')}
                >
                  Created ({paymentSummary.pendingPayments || 0})
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${paymentStatusFilter === 'failed' ? 'active' : ''}`}
                  onClick={() => setPaymentStatusFilter('failed')}
                >
                  Failed ({paymentSummary.failedPayments || 0})
                </button>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="admin-table-container">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Learner</th>
                    <th>Course</th>
                    <th>Amount</th>
                    <th>Order & Payment IDs</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="admin-empty-state" style={{ padding: '3.5rem 1rem' }}>
                          <div className="empty-state-icon">💳</div>
                          <h4 className="empty-state-title">No transactions found</h4>
                          <p className="empty-state-subtitle">
                            {paymentSearch || paymentStatusFilter !== 'all'
                              ? 'No payment records match your search or status filter.'
                              : 'When students purchase paid courses via Razorpay, transaction receipts and revenue will appear here.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const statusClass =
                        p.status === 'paid'
                          ? 'status-active'
                          : p.status === 'failed'
                          ? 'status-rejected'
                          : 'status-pending';

                      const learnerName = p.user?.name || 'Learner';
                      const learnerEmail = p.user?.email || 'N/A';
                      const courseTitle = p.course?.title || 'Course';

                      return (
                        <tr key={p._id || p.orderId}>
                          <td style={{ fontSize: '0.825rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Recent'}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{learnerName}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{learnerEmail}</div>
                          </td>
                          <td style={{ maxWidth: '240px' }}>
                            <div style={{ fontWeight: 500, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {courseTitle}
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <strong style={{ color: p.status === 'paid' ? '#166534' : '#0f172a' }}>
                              ₹{(p.amount || 0).toLocaleString('en-IN')}
                            </strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569' }}>
                                Ord: <strong>{p.orderId || 'N/A'}</strong>
                              </span>
                              {p.paymentId && (
                                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#2563eb' }}>
                                  Pay: {p.paymentId}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${statusClass}`}>
                              <span className="status-dot"></span>
                              {p.status ? p.status.toUpperCase() : 'UNKNOWN'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal (Create / Edit) */}
      {categoryModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {categoryModal.mode === 'create' ? 'Create New Category' : `Edit Category "${categoryModal.data.name}"`}
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setCategoryModal(null)}
                aria-label="Close dialog"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="admin-modal-body">
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Categories organize curriculum in the public catalogue and instructor studio.
                </p>

                <div className="form-field-group">
                  <label className="form-field-label">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mobile Development"
                    value={categoryModal.data.name}
                    onChange={(e) =>
                      setCategoryModal({
                        ...categoryModal,
                        data: { ...categoryModal.data, name: e.target.value }
                      })
                    }
                    className="form-field-input"
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Brief description of courses in this category..."
                    value={categoryModal.data.description}
                    onChange={(e) =>
                      setCategoryModal({
                        ...categoryModal,
                        data: { ...categoryModal.data, description: e.target.value }
                      })
                    }
                    className="form-field-textarea"
                  />
                </div>

                <div className="form-checkbox-row">
                  <input
                    type="checkbox"
                    id="catIsActive"
                    checked={categoryModal.data.isActive}
                    onChange={(e) =>
                      setCategoryModal({
                        ...categoryModal,
                        data: { ...categoryModal.data, isActive: e.target.checked }
                      })
                    }
                  />
                  <label htmlFor="catIsActive" style={{ fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                    Active (visible in public filter pills and instructor studio)
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCategoryModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {categoryModal.mode === 'create' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {userModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Add Student or Teacher</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setUserModalOpen(false)}
                aria-label="Close dialog"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="admin-modal-body">
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Create an authenticated platform account for a student or teacher/instructor.
                </p>

                <div className="form-field-group">
                  <label className="form-field-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="form-field-input"
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. user@platform.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="form-field-input"
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">Password * (min 6 characters)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter secure password..."
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="form-field-input"
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">Account Role *</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="form-field-input"
                  >
                    <option value="student">Student (Learn courses & track progress)</option>
                    <option value="instructor">Teacher / Instructor (Author & manage courses)</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setUserModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Rejection Modal */}
      {rejectingCourse && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Reject Course Submission</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setRejectingCourse(null)}
                aria-label="Close dialog"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmReject}>
              <div className="admin-modal-body">
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Please provide feedback explaining to the educator why "<strong>{rejectingCourse.title}</strong>" cannot be approved at this time:
                </p>
                <div className="form-field-group">
                  <textarea
                    rows="4"
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Please add at least 3 lessons and provide a clearer course summary before re-submitting."
                    className="form-field-textarea"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
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
      </main>
    </div>
  );
}
