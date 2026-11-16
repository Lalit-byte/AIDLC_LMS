import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import CourseCard from './CourseCard';
import './CourseList.css';

export default function CourseList() {
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
      {/* Hero Section */}
      <section className="catalogue-hero">
        <div className="hero-pill-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>Over 12,000+ Students Learning Today</span>
        </div>
        <h1>
          Master Tech Skills. <span className="highlight-text">Build Real Projects.</span>
        </h1>
        <p>
          Explore industry-curated courses taught by tech practitioners. Learn at your own pace with hands-on exercises, structured curriculum, and verified certificates.
        </p>
      </section>

      {/* Feature Highlights */}
      <section className="catalogue-highlights">
        <div className="highlight-item">
          <div className="highlight-icon-box icon-box-blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/>
              <path d="M6 10h10"/>
            </svg>
          </div>
          <div>
            <div className="highlight-title">Curated Curriculum</div>
            <div className="highlight-desc">Practical, real-world skill paths</div>
          </div>
        </div>

        <div className="highlight-item">
          <div className="highlight-icon-box icon-box-amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <div className="highlight-title">Interactive Learning</div>
            <div className="highlight-desc">Self-paced video & text lessons</div>
          </div>
        </div>

        <div className="highlight-item">
          <div className="highlight-icon-box icon-box-emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <div className="highlight-title">Expert Mentors</div>
            <div className="highlight-desc">Industry-active engineers & authors</div>
          </div>
        </div>

        <div className="highlight-item">
          <div className="highlight-icon-box icon-box-purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6"/>
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
          </div>
          <div>
            <div className="highlight-title">Lifetime Access</div>
            <div className="highlight-desc">Track lesson progress anytime</div>
          </div>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="catalogue-toolbar-card">
        {/* Search & Price Row */}
        <div className="toolbar-search-row">
          <div className="search-input-wrapper">
            <svg className="search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
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
                ✕
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
                  ✕
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
          <div className="catalogue-empty-icon">⚠️</div>
          <h3 style={{ color: '#dc2626' }}>Unable to Load Courses</h3>
          <p>{error}</p>
          <button className="btn btn-outline" onClick={fetchCourses}>
            Try Again
          </button>
        </div>
      ) : sortedCourses.length === 0 ? (
        <div className="catalogue-empty-state">
          <div className="catalogue-empty-icon">🔍</div>
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

      {/* Bottom CTA Banner */}
      <section className="catalogue-cta-banner">
        <div className="cta-content">
          <h2>Transform Your Tech Career With OpenLMS</h2>
          <p>
            Start learning today with free lesson previews on every course, self-paced interactive curriculums, and verified certificates.
          </p>
          <div className="cta-actions">
            <Link to="/register" className="cta-btn-primary">
              Get Started for Free
            </Link>
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
    </div>
  );
}
