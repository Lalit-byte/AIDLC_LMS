import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import CourseCard from './CourseCard';
import './CourseList.css';

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCourses()
      .then((data) => setCourses(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <section className="catalogue-hero">
        <h1>Learn Without Limits</h1>
        <p>Explore practical courses taught by industry practitioners. Build real projects, master core skills.</p>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading catalogue...</div>
      ) : (
        <section className="course-grid">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </section>
      )}
    </div>
  );
}
