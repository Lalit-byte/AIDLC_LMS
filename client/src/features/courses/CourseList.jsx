import React, { useEffect, useState, useCallback } from 'react';
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

  // Load available categories once on mount
  useEffect(() => {
    api.getCategories()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length) {
          setCategories(cats);
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
          setCourses(data);
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

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setPricing('all');
  };

  return (
    <div className="container">
      <section className="catalogue-hero">
        <h1>Learn Without Limits</h1>
        <p>Explore practical courses taught by industry practitioners. Build real projects, master core skills.</p>
      </section>

      <section className="catalogue-toolbar">
        <div className="search-and-pricing">
          <input
            type="search"
            className="catalogue-search"
            placeholder="Search courses by title, topic, or instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading catalogue...</div>
      ) : error ? (
        <div className="empty-state" style={{ color: 'var(--color-danger, #ef4444)' }}>
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>{error}</p>
          <button className="btn btn-outline" onClick={fetchCourses}>
            Try Again
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>No courses match your active filters.</p>
          <button className="btn btn-outline" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      ) : (
        <section className="course-grid">
          {courses.map((course) => (
            <CourseCard key={course.id || course.slug || course._id} course={course} />
          ))}
        </section>
      )}
    </div>
  );
}
