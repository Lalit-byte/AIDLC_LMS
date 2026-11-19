import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiBookOpen, FiZap, FiUsers, FiAward, FiSearch, FiX, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../context/useAuth';
import { api } from '../../services/api';
import CourseCard from './CourseCard';
import './CourseList.css';

export default function CourseList({ showHero }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const shouldShowHero = showHero !== undefined ? showHero : location.pathname === '/';
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [pricing, setPricing] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  // Load available categories once on mount and deduplicate cleanly
  useEffect(() => {
    api.getCategories()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length) {
          const names = cats
            .map((c) => (typeof c === 'string' ? c : c?.name || c))
            .filter((name) => Boolean(name) && typeof name === 'string' && name.trim().toLowerCase() !== 'all')
            .map((name) => name.trim());

          setCategories(['All', ...new Set(names)]);
        }
      })
      .catch(() => {});
  }, []);

  const fetchCourses = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api.getCourses({ search, category, price: pricing })
      .then((data) => {
        if (active) {
          setCourses(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Unable to load courses. Please try again.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [search, category, pricing]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 200);

    return () => clearTimeout(timer);
  }, [fetchCourses]);

  const sortedCourses = useMemo(() => {
    if (!courses.length) return [];
    const list = [...courses];
    if (sortBy === 'price-low') {
      return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    }
    if (sortBy === 'price-high') {
      return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    if (sortBy === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  }, [courses, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setPricing('all');
    setSortBy('popular');
  };

  const hasActiveFilters = Boolean(search.trim()) || category !== 'All' || pricing !== 'all';

  return (
    <div className="container catalogue-container">
      {shouldShowHero ? (
        <>
          {/* Hero Section */}
          <section className="catalogue-hero">
            <div className="hero-pill-badge">
              <span className="hero-pill-dot" aria-hidden="true" />
              <span>Technical Curriculum & Real Projects</span>
            </div>
            <h1>
              Master Tech Skills. <span className="highlight-text">Build Real Projects.</span>
            </h1>
            <p>
              Industry-curated courses designed by practicing engineers. Structured lesson paths, verified code exercises, and comprehensive skill progression.
            </p>
          </section>

          {/* Feature Highlights */}
          <section className="catalogue-highlights">
            <div className="highlight-item">
              <div className="highlight-icon-box icon-box-blue">
                <FiBookOpen size={22} />
              </div>
              <div>
                <div className="highlight-title">Curated Curriculum</div>
                <div className="highlight-desc">Practical, real-world skill paths</div>
              </div>
            </div>

            <div className="highlight-item">
              <div className="highlight-icon-box icon-box-amber">
                <FiZap size={22} />
              </div>
              <div>
                <div className="highlight-title">Interactive Learning</div>
                <div className="highlight-desc">Self-paced video & text lessons</div>
              </div>
            </div>

            <div className="highlight-item">
              <div className="highlight-icon-box icon-box-emerald">
                <FiUsers size={22} />
              </div>
              <div>
                <div className="highlight-title">Expert Mentors</div>
                <div className="highlight-desc">Industry-active engineers & authors</div>
              </div>
            </div>

            <div className="highlight-item">
              <div className="highlight-icon-box icon-box-purple">
                <FiAward size={22} />
              </div>
              <div>
                <div className="highlight-title">Lifetime Access</div>
                <div className="highlight-desc">Track lesson progress anytime</div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div style={{ marginBottom: '1.75rem', paddingTop: '1.5rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
            All Published Courses
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', margin: 0 }}>
            Browse and explore verified published courses across all disciplines.
          </p>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <section className="catalogue-toolbar-card">
        {/* Search & Price Row */}
        <div className="toolbar-search-row">
          <div className="search-input-wrapper">
            <FiSearch className="search-input-icon" size={16} />
            <input
              type="search"
              className="catalogue-search"
              placeholder="Search courses by title, topic, or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Segmented Pricing Control */}
          <div className="pricing-segmented-group">
            <button
              type="button"
              className={`pricing-pill ${pricing === 'all' ? 'active' : ''}`}
              onClick={() => setPricing('all')}
            >
              All Prices
            </button>
            <button
              type="button"
              className={`pricing-pill ${pricing === 'free' ? 'active' : ''}`}
              onClick={() => setPricing('free')}
            >
              Free
            </button>
            <button
              type="button"
              className={`pricing-pill ${pricing === 'paid' ? 'active' : ''}`}
              onClick={() => setPricing('paid')}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Category Pills Bar (Guaranteed Single 'All') */}
        <div className="category-pills-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pill-btn ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Counter & Sort */}
        <div className="results-and-sort">
          <div className="results-meta">
            <span className="results-counter">
              Showing <strong>{sortedCourses.length}</strong> {sortedCourses.length === 1 ? 'course' : 'courses'}
            </span>
            {hasActiveFilters && (
              <span className="active-filter-indicator">
                Filtered
                {category !== 'All' ? ` · ${category}` : ''}
                {pricing !== 'all' ? ` · ${pricing === 'free' ? 'Free' : 'Paid'}` : ''}
                {search.trim() ? ` · "${search.trim()}"` : ''}
                <span className="clear-filter-x" onClick={resetFilters} title="Reset all filters">
                  <FiX size={12} />
                </span>
              </span>
            )}
          </div>

          <div className="sort-wrapper">
            <span className="sort-label">Sort by:</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Grid or Status States */}
      {loading ? (
        <section className="course-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="course-card skeleton-card">
              <div className="skeleton-thumb" />
              <div className="skeleton-body">
                <div className="skeleton-line skeleton-meta" />
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-desc" />
                <div className="skeleton-line skeleton-footer" />
              </div>
            </div>
          ))}
        </section>
      ) : error ? (
        <div className="catalogue-empty-state" style={{ borderColor: '#fca5a5' }}>
          <div className="catalogue-empty-icon">
            <FiAlertTriangle size={36} color="#d97706" />
          </div>
          <h3 style={{ color: '#dc2626' }}>Unable to Load Courses</h3>
          <p>{error}</p>
          <button className="btn btn-outline" onClick={fetchCourses}>
            Try Again
          </button>
        </div>
      ) : sortedCourses.length === 0 ? (
        <div className="catalogue-empty-state">
          <div className="catalogue-empty-icon">
            <FiSearch size={36} color="#2563eb" />
          </div>
          <h3>No Matching Courses Found</h3>
          <p>
            We couldn't find any courses matching your selected search or filter criteria. Try clearing your filters.
          </p>
          <button className="btn btn-outline" onClick={resetFilters}>
            Reset All Filters
          </button>
        </div>
      ) : (
        <section className="course-grid">
          {sortedCourses.map((course) => (
            <CourseCard key={course.id || course.slug || course._id} course={course} />
          ))}
        </section>
      )}

      {/* Bottom CTA Banner (Hidden on /courses, Get Started button hidden when logged in) */}
      {shouldShowHero && (
        <section className="catalogue-cta-banner">
          <div className="cta-content">
            <h2>Transform Your Tech Career With OpenLMS</h2>
            <p>
              Start learning today with free lesson previews on every course, self-paced interactive curriculums, and verified certificates.
            </p>
            <div className="cta-actions">
              {!isAuthenticated && (
                <Link to="/register" className="cta-btn-primary">
                  Get Started for Free
                </Link>
              )}
              <button
                type="button"
                className="cta-btn-secondary"
                onClick={() => {
                  setPricing('free');
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }}
              >
                Browse Free Courses →
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
