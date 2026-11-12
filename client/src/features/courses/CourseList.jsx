import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import CourseCard from './CourseCard';
import './CourseList.css';

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [pricing, setPricing] = useState('all');

  useEffect(() => {
    api.getCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const list = Array.from(new Set(courses.map((c) => c.category))).filter(Boolean);
    return ['All', ...list];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchCat = category === 'All' || course.category === category;
      const matchPricing =
        pricing === 'all' ||
        (pricing === 'free' && course.price === 0) ||
        (pricing === 'paid' && course.price > 0);
      const query = search.toLowerCase().trim();
      const matchSearch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query);
      return matchCat && matchPricing && matchSearch;
    });
  }, [courses, category, pricing, search]);

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
      ) : filteredCourses.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>No courses match your active filters.</p>
          <button className="btn btn-outline" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      ) : (
        <section className="course-grid">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </section>
      )}
    </div>
  );
}
