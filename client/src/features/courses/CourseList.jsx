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

  // Load available categories once on mount
  useEffect(() => {
    api.getCategories()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length) {
          const names = cats.map((c) => (typeof c === 'string' ? c : c?.name || c));
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

  return (
    <div className="container">
      <section className="catalogue-hero">
        <div className="hero-pill-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>Over 12,000+ Students Learning Today</span>
        </div>
        <h1>Learn Without Limits</h1>
        <p>Explore practical courses taught by industry practitioners. Build real projects, master core skills.</p>
      </section>

      {/* Highlights Bar */}
      <section className="catalogue-highlights">
        <div className="highlight-item">
          <span className="highlight-icon" aria-hidden="true">🎓</span>
          <div>
            <div className="highlight-title">50+ Courses</div>
            <div className="highlight-desc">Curated practical curricula</div>
          </div>
        </div>
        <div className="highlight-item">
          <span className="highlight-icon" aria-hidden="true">⚡</span>
          <div>
            <div className="highlight-title">Hands-on Projects</div>
            <div className="highlight-desc">Real code, real experience</div>
          </div>
        </div>
        <div className="highlight-item">
          <span className="highlight-icon" aria-hidden="true">💼</span>
          <div>
            <div className="highlight-title">Expert Mentors</div>
            <div className="highlight-desc">Taught by tech practitioners</div>
          </div>
        </div>
        <div className="highlight-item">
          <span className="highlight-icon" aria-hidden="true">🏆</span>
          <div>
            <div className="highlight-title">Verified Certificate</div>
            <div className="highlight-desc">Boost your portfolio</div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="catalogue-toolbar">
        <div className="search-and-pricing">
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
          </div>
          <select
            className="catalogue-select"
            value={pricing}
            onChange={(e) => setPricing(e.target.value)}
          >
            <option value="all">All Prices</option>
            <option value="free">Free Courses</option>
            <option value="paid">Paid Courses</option>
          </select>
        </div>

        <div className="category-pills">
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

        <div className="results-and-sort">
          <span className="results-counter">
            Showing {sortedCourses.length} {sortedCourses.length === 1 ? 'course' : 'courses'}
          </span>
          <div className="sort-wrapper">
            <span className="sort-label">Sort by:</span>
            <select
              className="catalogue-select sort-select"
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
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
          Loading catalogue...
        </div>
      ) : error ? (
        <div className="empty-state" style={{ color: 'var(--color-danger, #ef4444)' }}>
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>{error}</p>
          <button className="btn btn-outline" onClick={fetchCourses}>
            Try Again
          </button>
        </div>
      ) : sortedCourses.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>No courses match your active filters.</p>
          <button className="btn btn-outline" onClick={resetFilters}>
            Reset Filters
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
            <Link to="/register" className="btn btn-primary cta-btn">
              Get Started for Free
            </Link>
            <button
              type="button"
              className="btn btn-outline cta-btn"
              onClick={() => {
                setPricing('free');
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
            >
              Browse Free Courses
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
