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
  FiLock,
  FiArrowRight,
  FiPlus,
  FiCreditCard
} from 'react-icons/fi';
import { useAuth } from '../../context/useAuth';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import { paginateItems } from '../../components/paginationUtils';
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

  // Pagination state per section
  const [pendingPage, setPendingPage] = useState(1);
  const [coursesPage, setCoursesPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);

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
      setNotification(`"${courseTitle}" has been approved and published! It is now live in All Courses.`);
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
      setNotification(`"${rejectingCourse.title}" has been rejected.`);
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
        setNotification(`Category "${categoryModal.data.name.trim()}" created successfully.`);
      } else {
        await api.updateCategory(categoryModal.id, categoryModal.data);
        setNotification(`Category "${categoryModal.data.name.trim()}" updated successfully.`);
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
      setNotification(`Category "${cat.name}" has been deleted.`);
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
        `${newUserData.role === 'instructor' ? 'Instructor' : 'Student'} "${newUserData.name.trim()}" created successfully.`
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
        `${targetUser.role === 'instructor' ? 'Instructor' : 'Student'} "${targetUser.name}" deleted.`
      );
      setTimeout(() => setNotification(''), 4500);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

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

  if (!isAuthenticated) {
    return (
      <div className="container gate-card-wrap">
        <div className="gate-card">
          <div className="gate-icon-circle">
            <FiShield size={22} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Admin Authentication Required
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Please sign in with an Administrator account to view and manage platform courses.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
            Sign In as Admin
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container gate-card-wrap">
        <div className="gate-card">
          <div className="gate-icon-circle">
            <FiLock size={22} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Administrator Access Only
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
            You are currently logged in as a <strong>{user?.role || 'user'}</strong> ({user?.name}). The Admin Portal is restricted to platform administrators.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
              Browse Courses
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/login')}>
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingMetric = stats.pendingCount || pendingCourses.length;
  const publishedMetric = stats.publishedCount || 0;
  const totalCoursesMetric = stats.totalCourses || 0;
  const totalUsersMetric = users.length || stats.totalUsers || 0;

  const paginatedPending = paginateItems(pendingCourses, pendingPage, 6);
  const paginatedCourses = paginateItems(filteredCourses, coursesPage, 10);
  const paginatedCategories = paginateItems(filteredCategories, categoriesPage, 10);
  const paginatedUsers = paginateItems(filteredUsers, usersPage, 10);
  const paginatedPayments = paginateItems(filteredPayments, paymentsPage, 10);

  return (
    <div className="admin-container admin-layout">
      {/* Left Sidebar Navigation */}
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-header">
          <div className="admin-site-brand">
            <div className="admin-site-logo" aria-hidden="true">
              <FiLayers size={18} />
            </div>
            <div className="admin-site-info">
              <span className="admin-site-name">OpenLMS Platform</span>
              <span className="admin-badge">
                <span className="admin-badge-dot" aria-hidden="true" />
                <span>Platform Administrator</span>
              </span>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <span className="admin-sidebar-section-title">Admin Navigation</span>

          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <span className="admin-sidebar-btn-content">
              <FiClock size={17} aria-hidden="true" />
              <span>Pending Submissions</span>
            </span>
            <span className={`admin-tab-badge tabular-nums ${pendingCourses.length > 0 ? 'badge-highlight' : ''}`}>
              {pendingCourses.length}
            </span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'all_courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('all_courses')}
          >
            <span className="admin-sidebar-btn-content">
              <FiGrid size={17} aria-hidden="true" />
              <span>All Platform Courses</span>
            </span>
            <span className="admin-tab-badge tabular-nums">{allCourses.length}</span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <span className="admin-sidebar-btn-content">
              <FiTag size={17} aria-hidden="true" />
              <span>Categories</span>
            </span>
            <span className="admin-tab-badge tabular-nums">{categories.length}</span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="admin-sidebar-btn-content">
              <FiUsers size={17} aria-hidden="true" />
              <span>Users</span>
            </span>
            <span className="admin-tab-badge tabular-nums">{users.length}</span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <span className="admin-sidebar-btn-content">
              <FiDollarSign size={17} aria-hidden="true" />
              <span>Transactions &amp; Revenue</span>
            </span>
            <span className="admin-tab-badge tabular-nums">{payments.length}</span>
          </button>
        </nav>

        <nav className="admin-sidebar-nav admin-sidebar-switch">
          <span className="admin-sidebar-section-title">Switch Workspace</span>

          <Link to="/dashboard" className="admin-sidebar-link">
            <FiBookOpen size={17} aria-hidden="true" />
            <span>Student Workspace</span>
          </Link>
          <Link to="/studio" className="admin-sidebar-link">
            <FiEdit3 size={17} aria-hidden="true" />
            <span>Educator Studio</span>
          </Link>
          <Link to="/" className="admin-sidebar-link">
            <FiCompass size={17} aria-hidden="true" />
            <span>Home</span>
          </Link>
        </nav>
      </aside>

      {/* Main Right Content Area */}
      <main className="admin-main">
        <div className="admin-main-inner">
          <header className="admin-main-header">
            <h1 className="admin-page-title">Admin Dashboard</h1>
            <p className="admin-subtitle">
              Review educator course submissions, manage curriculum categories, and monitor platform operations.
            </p>
          </header>

          {notification && (
            <div className="admin-notification-toast" role="status">
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

          {/* Platform Overview Strip: Compact summary bar on Transactions tab, 4-col KPI strip otherwise */}
          {activeTab === 'payments' ? (
            <section aria-label="Platform summary" className="admin-compact-summary">
              <div className="compact-summary-item">
                <span className="compact-summary-label">Pending Reviews</span>
                <span className="compact-summary-val tabular-nums">{pendingMetric}</span>
              </div>
              <div className="compact-summary-item">
                <span className="compact-summary-label">Live Published</span>
                <span className="compact-summary-val tabular-nums">{publishedMetric}</span>
              </div>
              <div className="compact-summary-item">
                <span className="compact-summary-label">Total Authored</span>
                <span className="compact-summary-val tabular-nums">{totalCoursesMetric}</span>
              </div>
              <div className="compact-summary-item">
                <span className="compact-summary-label">Registered Users</span>
                <span className="compact-summary-val tabular-nums">{totalUsersMetric}</span>
              </div>
            </section>
          ) : (
            <section aria-label="Platform overview" className="admin-stats-grid">
              <article
                className="admin-stat-card admin-stat-clickable"
                onClick={() => setActiveTab('pending')}
              >
                <header className="admin-stat-head">
                  <span className="admin-stat-label">Pending Reviews</span>
                  <FiClock size={18} style={{ color: 'var(--color-warning)' }} aria-hidden="true" />
                </header>
                <div>
                  <div className="admin-stat-num tabular-nums">{pendingMetric}</div>
                  <div className="admin-stat-subtext">Awaiting admin review</div>
                </div>
              </article>

              <article
                className="admin-stat-card admin-stat-clickable"
                onClick={() => setActiveTab('all_courses')}
              >
                <header className="admin-stat-head">
                  <span className="admin-stat-label">Live Published Courses</span>
                  <FiCheckCircle size={18} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
                </header>
                <div>
                  <div className="admin-stat-num tabular-nums">{publishedMetric}</div>
                  <div className="admin-stat-subtext">Visible in public catalog</div>
                </div>
              </article>

              <article
                className="admin-stat-card admin-stat-clickable"
                onClick={() => setActiveTab('all_courses')}
              >
                <header className="admin-stat-head">
                  <span className="admin-stat-label">Total Authored Courses</span>
                  <FiBookOpen size={18} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                </header>
                <div>
                  <div className="admin-stat-num tabular-nums">{totalCoursesMetric}</div>
                  <div className="admin-stat-subtext">Across all instructors</div>
                </div>
              </article>

              <article
                className="admin-stat-card admin-stat-clickable"
                onClick={() => setActiveTab('users')}
              >
                <header className="admin-stat-head">
                  <span className="admin-stat-label">Registered Users</span>
                  <FiUsers size={18} style={{ color: 'var(--color-secondary)' }} aria-hidden="true" />
                </header>
                <div>
                  <div className="admin-stat-num tabular-nums">{totalUsersMetric}</div>
                  <div className="admin-stat-subtext">Students &amp; instructors</div>
                </div>
              </article>
            </section>
          )}

          {/* Tab 1: Pending Submissions */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-secondary)' }}>
              Loading platform administration data...
            </div>
          ) : activeTab === 'pending' ? (
            <div>
              {pendingCourses.length === 0 ? (
                <section aria-label="Pending submissions queue" className="admin-empty-state">
                  <div className="admin-empty-circle">
                    <FiCheckCircle size={24} aria-hidden="true" />
                  </div>
                  <div className="admin-empty-copy">
                    <h2 className="admin-empty-title">All Submissions Reviewed</h2>
                    <p className="admin-empty-desc">
                      There are no courses awaiting administrator approval. New instructor curriculum submissions will appear here for review and publication.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setActiveTab('all_courses')}
                  >
                    <span>Browse All Platform Courses</span>
                    <FiArrowRight size={16} aria-hidden="true" />
                  </button>
                </section>
              ) : (
                <div className="admin-pending-list">
                  {paginatedPending.items.map((course) => {
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
                                <span className="status-dot" aria-hidden="true" />
                                <span>Under Review</span>
                              </span>
                              <span className="status-pill status-active tabular-nums">
                                {price === 0 ? 'Free Course' : `₹${price.toLocaleString('en-IN')}`}
                              </span>
                            </div>

                            <h3 className="pending-title">{course.title}</h3>
                            <p className="pending-desc">
                              {course.description || 'No description provided.'}
                            </p>

                            <div className="pending-meta-grid">
                              <div className="pending-meta-item">
                                <FiUser size={14} aria-hidden="true" />
                                <span>
                                  Instructor:{' '}
                                  <strong>{course.instructor?.name || course.instructorName || 'Platform Instructor'}</strong>
                                  {course.instructor?.email ? ` (${course.instructor.email})` : ''}
                                </span>
                              </div>
                              <div className="pending-meta-item tabular-nums">
                                <FiBookOpen size={14} aria-hidden="true" />
                                <span>
                                  Curriculum: <strong>{course.sections?.length || 0} sections</strong> ({totalLessons} lessons)
                                </span>
                              </div>
                              <div className="pending-meta-item tabular-nums">
                                <FiCalendar size={14} aria-hidden="true" />
                                <span>
                                  Submitted:{' '}
                                  <strong>
                                    {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Recent'}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            <div style={{ marginTop: '0.65rem' }}>
                              <button
                                type="button"
                                className="curriculum-accordion-btn"
                                onClick={() => setExpandedCourseId(isExpanded ? null : courseId)}
                              >
                                {isExpanded ? 'Hide Curriculum Details' : 'Inspect Curriculum & Lessons'}
                              </button>

                              {isExpanded && (
                                <div className="curriculum-accordion">
                                  {!course.sections || course.sections.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                                      No sections configured yet.
                                    </p>
                                  ) : (
                                    course.sections.map((sec, secIdx) => (
                                      <div key={sec._id || secIdx} className="curriculum-section-row">
                                        <div className="curriculum-section-title">
                                          Section {secIdx + 1}: {sec.title}
                                        </div>
                                        {(sec.lessons || []).map((les, lesIdx) => (
                                          <div key={les._id || lesIdx} className="curriculum-lesson-item">
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                              {les.type === 'video' ? (
                                                <FiPlay size={13} style={{ color: 'var(--color-secondary)' }} aria-hidden="true" />
                                              ) : (
                                                <FiFileText size={13} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                                              )}
                                              <span>{les.title}</span>
                                              {les.isPreview && (
                                                <span className="status-pill status-published" style={{ marginLeft: '0.25rem' }}>
                                                  Free Preview
                                                </span>
                                              )}
                                            </span>
                                            <span className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
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

                            <div className="pending-actions">
                              <button
                                type="button"
                                className="btn-table-action btn-action-primary"
                                onClick={() => handleApprove(courseId, course.title)}
                              >
                                <FiCheck size={14} aria-hidden="true" />
                                <span>Approve &amp; Publish Course</span>
                              </button>
                              <button
                                type="button"
                                className="btn-table-action btn-action-danger"
                                onClick={() => handleOpenReject(course)}
                              >
                                <FiX size={14} aria-hidden="true" />
                                <span>Reject Course</span>
                              </button>
                              <Link to={`/courses/${course.slug || courseId}`} className="btn-table-action">
                                <span>Preview Course</span>
                                <FiExternalLink size={12} aria-hidden="true" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  <Pagination
                    currentPage={paginatedPending.currentPage}
                    totalItems={paginatedPending.totalItems}
                    pageSize={6}
                    onPageChange={setPendingPage}
                    itemLabel="submissions"
                  />
                </div>
              )}
            </div>
          ) : null}

          {/* Tab 2: All Platform Courses */}
          {!loading && activeTab === 'all_courses' && (
            <div className="admin-section-stack">
              <div className="admin-filter-bar">
                <div className="admin-filter-group">
                  <SearchBar
                    value={courseSearch}
                    onChange={(val) => {
                      setCourseSearch(val);
                      setCoursesPage(1);
                    }}
                    placeholder="Search by title, instructor, or category..."
                    ariaLabel="Search platform courses"
                  />
                  <select
                    value={courseStatusFilter}
                    onChange={(e) => {
                      setCourseStatusFilter(e.target.value);
                      setCoursesPage(1);
                    }}
                    className="admin-select-input"
                  >
                    <option value="all">All Statuses ({allCourses.length})</option>
                    <option value="published">Published</option>
                    <option value="pending_review">Under Review</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="admin-filter-count tabular-nums">
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
                        <th style={{ textAlign: 'right' }}>Price</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                            No courses match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedCourses.items.map((c) => {
                          const courseId = c._id || c.id;
                          const price = typeof c.price === 'number' ? c.price : 0;
                          return (
                            <tr key={courseId}>
                              <td>
                                <div className="table-course-item">
                                  <img
                                    src={
                                      c.thumbnail ||
                                      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                                    }
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
                                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                  {c.instructor?.name || c.instructorName || 'Platform Instructor'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                                  {c.instructor?.email || '—'}
                                </div>
                              </td>
                              <td>
                                <span className="status-pill status-draft">
                                  {c.category || 'General'}
                                </span>
                              </td>
                              <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600 }}>
                                <span style={{ color: price === 0 ? 'var(--color-success)' : 'var(--color-text-main)' }}>
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
                                  <span className="status-dot" aria-hidden="true" />
                                  <span>{c.status === 'pending_review' ? 'Under Review' : c.status}</span>
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
                                  <Link to={`/courses/${c.slug || courseId}`} className="btn-table-action">
                                    <span>View</span>
                                    <FiArrowRight size={13} aria-hidden="true" />
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
                <Pagination
                  currentPage={paginatedCourses.currentPage}
                  totalItems={paginatedCourses.totalItems}
                  pageSize={10}
                  onPageChange={setCoursesPage}
                  itemLabel="courses"
                  className="pagination-embedded"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Categories */}
          {!loading && activeTab === 'categories' && (
            <div className="admin-section-stack">
              <div className="admin-filter-bar">
                <div className="admin-filter-group">
                  <SearchBar
                    value={categorySearch}
                    onChange={(val) => {
                      setCategorySearch(val);
                      setCategoriesPage(1);
                    }}
                    placeholder="Search categories by name or slug..."
                    ariaLabel="Search categories"
                  />
                  <div className="admin-filter-count tabular-nums">
                    Showing <strong>{filteredCategories.length}</strong> of {categories.length} categories
                  </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleOpenCreateCategory}>
                  <FiPlus size={16} aria-hidden="true" />
                  <span>Add Category</span>
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
                          <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                            {categories.length === 0
                              ? 'No categories found. Click "Add Category" to create your first one.'
                              : 'No categories match your search.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedCategories.items.map((cat) => {
                          const catId = cat._id || cat.id;
                          const hasCourses = (cat.courseCount || 0) > 0;
                          return (
                            <tr key={catId}>
                              <td style={{ fontWeight: 600 }}>{cat.name}</td>
                              <td>
                                <code className="admin-code-chip">{cat.slug}</code>
                              </td>
                              <td style={{ color: 'var(--color-text-secondary)', maxWidth: '300px' }}>
                                {cat.description || '—'}
                              </td>
                              <td>
                                <span className="status-pill status-draft tabular-nums">
                                  {cat.courseCount || 0} course{cat.courseCount === 1 ? '' : 's'}
                                </span>
                              </td>
                              <td>
                                <span className={`status-pill ${cat.isActive !== false ? 'status-active' : 'status-inactive'}`}>
                                  <span className="status-dot" aria-hidden="true" />
                                  <span>{cat.isActive !== false ? 'Active' : 'Inactive'}</span>
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
                <Pagination
                  currentPage={paginatedCategories.currentPage}
                  totalItems={paginatedCategories.totalItems}
                  pageSize={10}
                  onPageChange={setCategoriesPage}
                  itemLabel="categories"
                  className="pagination-embedded"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Users */}
          {!loading && activeTab === 'users' && (
            <div className="admin-section-stack">
              <div className="admin-filter-bar">
                <div className="admin-filter-group">
                  <SearchBar
                    value={userSearch}
                    onChange={(val) => {
                      setUserSearch(val);
                      setUsersPage(1);
                    }}
                    placeholder="Search by name or email..."
                    ariaLabel="Search users"
                  />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setUsersPage(1);
                    }}
                    className="admin-select-input"
                  >
                    <option value="all">All Roles ({users.length})</option>
                    <option value="student">Students</option>
                    <option value="instructor">Teachers / Instructors</option>
                    <option value="admin">Administrators</option>
                  </select>
                  <div className="admin-filter-count tabular-nums">
                    Showing <strong>{filteredUsers.length}</strong> of {users.length} users
                  </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleOpenCreateUser}>
                  <FiPlus size={16} aria-hidden="true" />
                  <span>Add Student / Teacher</span>
                </button>
              </div>

              <div className="admin-table-card">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Activity &amp; Courses</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                            No users match your search criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.items.map((u) => {
                          const uId = u._id || u.id;
                          const isCurrentAdmin = user && (user.id === uId || user._id === uId);
                          const hasCourses = u.role === 'instructor' && (u.coursesAuthored || 0) > 0;

                          return (
                            <tr key={uId}>
                              <td>
                                <div className="user-cell">
                                  <div className={`user-avatar-circle role-${u.role || 'student'}`}>
                                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                      {u.name}
                                      {isCurrentAdmin && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginLeft: '0.4rem', fontWeight: 600 }}>
                                          (You)
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                                      {u.email}
                                    </div>
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
                                  <span className="status-dot" aria-hidden="true" />
                                  <span>
                                    {u.role === 'instructor'
                                      ? 'Teacher / Instructor'
                                      : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                  </span>
                                </span>
                              </td>
                              <td>
                                {u.role === 'instructor' ? (
                                  <span className="status-pill status-draft tabular-nums">
                                    {u.coursesAuthored || 0} course{u.coursesAuthored === 1 ? '' : 's'} authored
                                  </span>
                                ) : u.role === 'student' ? (
                                  <span className="status-pill status-draft tabular-nums">
                                    {u.coursesEnrolled || 0} course{u.coursesEnrolled === 1 ? '' : 's'} enrolled
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                                    Platform Administrator
                                  </span>
                                )}
                              </td>
                              <td className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                              </td>
                              <td>
                                <span className={`status-pill ${u.isActive !== false ? 'status-active' : 'status-inactive'}`}>
                                  <span className="status-dot" aria-hidden="true" />
                                  <span>{u.isActive !== false ? 'Active' : 'Inactive'}</span>
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
                <Pagination
                  currentPage={paginatedUsers.currentPage}
                  totalItems={paginatedUsers.totalItems}
                  pageSize={10}
                  onPageChange={setUsersPage}
                  itemLabel="users"
                  className="pagination-embedded"
                />
              </div>
            </div>
          )}

          {/* Tab 5: Transactions & Revenue Ledger */}
          {!loading && activeTab === 'payments' && (
            <div className="admin-section-stack">
              {/* Revenue KPI Cards */}
              <section aria-label="Revenue metrics" className="admin-stats-grid">
                <article className="admin-stat-card">
                  <header className="admin-stat-head">
                    <span className="admin-stat-label">Total Realized Revenue</span>
                    <FiDollarSign size={18} style={{ color: 'var(--color-secondary)' }} aria-hidden="true" />
                  </header>
                  <div>
                    <div className="admin-stat-num tabular-nums" style={{ color: 'var(--color-secondary)' }}>
                      ₹{(paymentSummary.totalRevenue || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="admin-stat-subtext">From successful course enrollments</div>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <header className="admin-stat-head">
                    <span className="admin-stat-label">Successful Payments</span>
                    <FiCheckCircle size={18} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
                  </header>
                  <div>
                    <div className="admin-stat-num tabular-nums">
                      {paymentSummary.successfulPayments || 0}
                    </div>
                    <div className="admin-stat-subtext">Verified gateway transactions</div>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <header className="admin-stat-head">
                    <span className="admin-stat-label">Created / In-Progress</span>
                    <FiClock size={18} style={{ color: 'var(--color-warning)' }} aria-hidden="true" />
                  </header>
                  <div>
                    <div className="admin-stat-num tabular-nums" style={{ color: 'var(--color-warning)' }}>
                      {paymentSummary.pendingPayments || 0}
                    </div>
                    <div className="admin-stat-subtext">Awaiting checkout completion</div>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <header className="admin-stat-head">
                    <span className="admin-stat-label">Failed / Declined</span>
                    <FiXCircle size={18} style={{ color: 'var(--color-danger)' }} aria-hidden="true" />
                  </header>
                  <div>
                    <div className="admin-stat-num tabular-nums" style={{ color: 'var(--color-danger)' }}>
                      {paymentSummary.failedPayments || 0}
                    </div>
                    <div className="admin-stat-subtext">Payment attempt failed or cancelled</div>
                  </div>
                </article>
              </section>

              {/* Filter Toolbar */}
              <section aria-label="Transaction filters" className="admin-filter-bar">
                <SearchBar
                  value={paymentSearch}
                  onChange={(val) => {
                    setPaymentSearch(val);
                    setPaymentsPage(1);
                  }}
                  placeholder="Search order ID, payment ID, or learner..."
                  ariaLabel="Search transactions"
                  className="admin-search-wide"
                />

                <div role="tablist" aria-label="Transaction status filter" className="admin-status-segmented">
                  {[
                    { key: 'all', label: `All (${payments.length})` },
                    { key: 'paid', label: `Paid (${paymentSummary.successfulPayments || 0})` },
                    { key: 'created', label: `Created (${paymentSummary.pendingPayments || 0})` },
                    { key: 'failed', label: `Failed (${paymentSummary.failedPayments || 0})` }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={paymentStatusFilter === tab.key}
                      className={`segmented-btn tabular-nums ${paymentStatusFilter === tab.key ? 'active' : ''}`}
                      onClick={() => {
                        setPaymentStatusFilter(tab.key);
                        setPaymentsPage(1);
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Transactions Table */}
              <div className="admin-table-card">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date &amp; Time</th>
                        <th>Learner</th>
                        <th>Course</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th>Order &amp; Payment IDs</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                              <div className="admin-empty-circle">
                                <FiCreditCard size={22} aria-hidden="true" />
                              </div>
                              <h4 className="admin-empty-title">No transactions found</h4>
                              <p className="admin-empty-desc">
                                {paymentSearch || paymentStatusFilter !== 'all'
                                  ? 'No payment records match your search or status filter.'
                                  : 'When students purchase paid courses via Razorpay, transaction receipts and revenue will appear here.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedPayments.items.map((p) => {
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
                              <td className="tabular-nums" style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Recent'}
                              </td>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{learnerName}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{learnerEmail}</div>
                              </td>
                              <td style={{ maxWidth: '240px' }}>
                                <div className="table-course-title" title={courseTitle}>
                                  {courseTitle}
                                </div>
                              </td>
                              <td className="tabular-nums" style={{ textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                ₹{(p.amount || 0).toLocaleString('en-IN')}
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span className="mono-code" style={{ color: 'var(--color-text-main)' }}>
                                    Ord: {p.orderId || 'N/A'}
                                  </span>
                                  {p.paymentId && (
                                    <span className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
                                      Pay: {p.paymentId}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className={`status-pill ${statusClass}`}>
                                  <span className="status-dot" aria-hidden="true" />
                                  <span>{p.status ? p.status.toUpperCase() : 'UNKNOWN'}</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={paginatedPayments.currentPage}
                  totalItems={paginatedPayments.totalItems}
                  pageSize={10}
                  onPageChange={setPaymentsPage}
                  itemLabel="transactions"
                  className="pagination-embedded"
                />
              </div>
            </div>
          )}

          {/* Category Modal */}
          {categoryModal && (
            <div className="admin-modal-overlay">
              <div className="admin-modal-card" role="dialog" aria-modal="true">
                <div className="admin-modal-header">
                  <h3 className="admin-modal-title">
                    {categoryModal.mode === 'create'
                      ? 'Create New Category'
                      : `Edit Category "${categoryModal.data.name}"`}
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
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
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
                      <label htmlFor="catIsActive" style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', cursor: 'pointer' }}>
                        Active (visible in public filter pills and instructor studio)
                      </label>
                    </div>
                  </div>

                  <div className="admin-modal-footer">
                    <button type="button" className="btn btn-outline" onClick={() => setCategoryModal(null)}>
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
              <div className="admin-modal-card" role="dialog" aria-modal="true">
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
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
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
                        <option value="student">Student (Learn courses &amp; track progress)</option>
                        <option value="instructor">Teacher / Instructor (Author &amp; manage courses)</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-modal-footer">
                    <button type="button" className="btn btn-outline" onClick={() => setUserModalOpen(false)}>
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
              <div className="admin-modal-card" role="dialog" aria-modal="true">
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
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      Please provide feedback explaining to the educator why &ldquo;<strong>{rejectingCourse.title}</strong>&rdquo; cannot be approved at this time:
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
                    <button type="button" className="btn btn-outline" onClick={() => setRejectingCourse(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-danger">
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
