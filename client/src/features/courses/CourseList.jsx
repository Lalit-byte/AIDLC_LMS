import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiBookOpen, FiZap, FiUsers, FiAward, FiSearch, FiX, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/useAuth';
import { api } from '../../services/api';
import CourseCard from './CourseCard';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import { paginateItems } from '../../components/paginationUtils';
import './CourseList.css';

export default function CourseList({ showHero }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const shouldShowHero = showHero !== undefined ? showHero : location.pathname === '/';
  const [courses, setCourses] = useState([]);
  const [baselineCourses, setBaselineCourses] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [pricing, setPricing] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [cataloguePage, setCataloguePage] = useState(1);

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
          const list = Array.isArray(data) ? data : [];
          setCourses(list);
          if (!search.trim() && category === 'All' && pricing === 'all') {
            setBaselineCourses(list);
          }
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

  const displayedCourses = useMemo(
    () => (shouldShowHero ? sortedCourses.slice(0, 8) : sortedCourses),
    [shouldShowHero, sortedCourses]
  );

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setPricing('all');
    setSortBy('popular');
    setCataloguePage(1);
  };

  const hasActiveFilters = Boolean(search.trim()) || category !== 'All' || pricing !== 'all';
  const paginatedCatalogue = paginateItems(displayedCourses, cataloguePage, 12);

  const categoryCounts = useMemo(() => {
    const counts = { All: baselineCourses.length };
    baselineCourses.forEach((c) => {
      const name = typeof c.category === 'object' ? c.category?.name : c.category;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [baselineCourses]);

  const pricingCounts = useMemo(() => {
    let free = 0;
    let paid = 0;
    baselineCourses.forEach((c) => {
      const p = typeof c.price === 'number' ? c.price : Number(c.price || 0);
      if (p === 0) free += 1;
      else paid += 1;
    });
    return { all: baselineCourses.length, free, paid };
  }, [baselineCourses]);

  return (
    <div className="container catalogue-container">
      {shouldShowHero ? (
        <div className="homepage-hero-section">
          {/* Hero Section */}
          <section className="catalogue-hero">
            <img
              src="/hero-banner.jpg"
              alt="Online learning student"
              className="catalogue-hero-bg"
            />
            <div className="catalogue-hero-content">
              <h1>
                Master Tech Skills. <span className="highlight-text">Build Real Projects.</span>
              </h1>
              <p>
                Industry-curated courses designed by practicing engineers. Structured lesson paths, verified code exercises, and comprehensive skill progression.
              </p>
            </div>
          </section>

          {/* Feature Highlights */}
          <section className="catalogue-highlights" aria-label="Platform highlights">
            <div className="highlight-item">
              <div className="highlight-icon-box">
                <FiBookOpen size={22} aria-hidden="true" />
              </div>
              <div>
                <div className="highlight-title">Curated Curriculum</div>
                <div className="highlight-desc">Practical, real-world skill paths</div>
              </div>
            </div>

            <div className="highlight-item">
              <div className="highlight-icon-box">
                <FiZap size={22} aria-hidden="true" />
              </div>
              <div>
                <div className="highlight-title">Interactive Learning</div>
                <div className="highlight-desc">Self-paced video &amp; text lessons</div>
              </div>
            </div>

            <div className="highlight-item">
              <div className="highlight-icon-box">
                <FiUsers size={22} aria-hidden="true" />
              </div>
              <div>
                <div className="highlight-title">Expert Mentors</div>
                <div className="highlight-desc">Industry-active engineers &amp; authors</div>
              </div>
            </div>

            <div className="highlight-item">
              <div className="highlight-icon-box">
                <FiAward size={22} aria-hidden="true" />
              </div>
              <div>
                <div className="highlight-title">Lifetime Access</div>
                <div className="highlight-desc">Track lesson progress anytime</div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <header className="editorial-catalogue-header">
          <div className="editorial-header-copy">
            <h1 className="editorial-page-title">All Published Courses</h1>
            <p className="editorial-page-subtitle">
              Browse and explore verified published courses across all disciplines.
            </p>
          </div>
        </header>
      )}

      {shouldShowHero && (
        <div className="homepage-section-header">
          <div>
            <h2 className="homepage-section-title">Top Courses</h2>
            <p className="homepage-section-subtitle">
              Explore our most popular industry-curated courses and start learning today.
            </p>
          </div>
        </div>
      )}

      {shouldShowHero ? (
        <>
          {loading ? (
            <section className="course-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
            <div className="catalogue-empty-state catalogue-error-state">
              <div className="catalogue-empty-icon">
                <FiAlertTriangle size={28} />
              </div>
              <h3>Unable to Load Courses</h3>
              <p>{error}</p>
              <button type="button" className="btn btn-outline" onClick={fetchCourses}>
                Try Again
              </button>
            </div>
          ) : displayedCourses.length === 0 ? (
            <div className="catalogue-empty-state">
              <div className="catalogue-empty-icon">
                <FiSearch size={28} />
              </div>
              <h3>No Matching Courses Found</h3>
              <p>
                We couldn&apos;t find any courses matching your selected search or filter criteria. Try clearing your filters.
              </p>
              <button type="button" className="btn btn-outline" onClick={resetFilters}>
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <section className="course-grid">
                {displayedCourses.map((course) => (
                  <CourseCard key={course.id || course.slug || course._id} course={course} />
                ))}
              </section>

              <div className="show-more-courses-container">
                <Link to="/courses" className="show-more-courses-btn">
                  Show More Courses <FiArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </>
          )}

          {/* Bottom CTA Banner */}
          <section className="catalogue-cta-banner">
            <div className="cta-content">
              <h2>Transform Your Tech Career With OpenLMS</h2>
              <p>
                Start learning today with free lesson previews on every course, self-paced interactive curriculums, and verified certificates.
              </p>
              <div className="cta-actions">
                {!isAuthenticated && (
                  <Link to="/register" className="btn btn-primary cta-btn-primary">
                    Get Started for Free
                  </Link>
                )}
                <Link to="/courses" className="btn cta-btn-secondary">
                  Browse Free Courses &rarr;
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="editorial-catalogue-layout">
          {/* Left Sticky Filter Rail */}
          <aside aria-label="Course filters" className="editorial-filter-rail">
            <div className="filter-rail-summary">
              <span className="filter-rail-count">
                Showing <strong className="tabular-nums">{sortedCourses.length}</strong>{' '}
                {sortedCourses.length === 1 ? 'course' : 'courses'}
              </span>
              {hasActiveFilters && (
                <button type="button" className="filter-reset-link" onClick={resetFilters}>
                  Reset
                </button>
              )}
            </div>

            <div className="filter-rail-group">
              <span className="filter-rail-heading">Discipline</span>
              <div className="filter-rail-list">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-rail-btn ${category === cat ? 'active-discipline' : ''}`}
                    onClick={() => {
                      setCategory(cat);
                      setCataloguePage(1);
                    }}
                  >
                    <span>{cat === 'All' ? 'All Disciplines' : cat}</span>
                    {baselineCourses.length > 0 && categoryCounts[cat] !== undefined && (
                      <span className="filter-rail-num tabular-nums">{categoryCounts[cat]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-rail-group">
              <span className="filter-rail-heading">Pricing</span>
              <div className="filter-rail-list">
                {[
                  { value: 'all', label: 'All Prices' },
                  { value: 'free', label: 'Free' },
                  { value: 'paid', label: 'Paid' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`filter-rail-btn ${pricing === opt.value ? 'active-pricing' : ''}`}
                    onClick={() => {
                      setPricing(opt.value);
                      setCataloguePage(1);
                    }}
                  >
                    <span>{opt.label}</span>
                    {baselineCourses.length > 0 && (
                      <span className="filter-rail-num tabular-nums">{pricingCounts[opt.value]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Course Showcase */}
          <div className="editorial-showcase">
            <div className="editorial-sticky-toolbar">
              <div className="editorial-header-controls">
                <SearchBar
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCataloguePage(1);
                  }}
                  placeholder="Search courses by title, topic, or instructor..."
                  ariaLabel="Search published courses"
                  className="editorial-searchbar"
                />

                <select
                  aria-label="Sort courses"
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCataloguePage(1);
                  }}
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {hasActiveFilters && (
                <div className="active-filters-strip">
                  <span className="active-filter-indicator">
                    Filtered
                    {category !== 'All' ? ` · ${category}` : ''}
                    {pricing !== 'all' ? ` · ${pricing === 'free' ? 'Free' : 'Paid'}` : ''}
                    {search.trim() ? ` · "${search.trim()}"` : ''}
                    <button
                      type="button"
                      className="clear-filter-x"
                      onClick={resetFilters}
                      title="Reset all filters"
                      aria-label="Reset all filters"
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                </div>
              )}
            </div>

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
              <div className="catalogue-empty-state catalogue-error-state">
                <div className="catalogue-empty-icon">
                  <FiAlertTriangle size={28} />
                </div>
                <h3>Unable to Load Courses</h3>
                <p>{error}</p>
                <button type="button" className="btn btn-outline" onClick={fetchCourses}>
                  Try Again
                </button>
              </div>
            ) : displayedCourses.length === 0 ? (
              <div className="catalogue-empty-state">
                <div className="catalogue-empty-icon">
                  <FiSearch size={28} />
                </div>
                <h3>No Matching Courses Found</h3>
                <p>
                  We couldn&apos;t find any courses matching your selected search or filter criteria. Try clearing your filters.
                </p>
                <button type="button" className="btn btn-outline" onClick={resetFilters}>
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <section className="course-grid">
                  {paginatedCatalogue.items.map((course) => (
                    <CourseCard key={course.id || course.slug || course._id} course={course} />
                  ))}
                </section>
                <Pagination
                  currentPage={paginatedCatalogue.currentPage}
                  totalItems={paginatedCatalogue.totalItems}
                  pageSize={12}
                  onPageChange={setCataloguePage}
                  itemLabel="courses"
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
