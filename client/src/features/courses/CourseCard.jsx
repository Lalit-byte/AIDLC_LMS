import React from 'react';
import { Link } from 'react-router-dom';
import './CourseCard.css';

export default function CourseCard({ course, actionLabel, actionUrl }) {
  const isFree = course.price === 0;
  const targetUrl = actionUrl || `/courses/${course.id}`;
  const targetLabel = actionLabel || 'View Details';

  return (
    <article className="course-card">
      <img src={course.thumbnail} alt={course.title} className="course-thumbnail" />
      <div className="course-body">
        <div className="course-meta">
          <span className="course-category">{course.category}</span>
          <span className={`badge ${isFree ? 'badge-free' : 'badge-paid'}`}>
            {isFree ? 'Free' : 'Paid'}
          </span>
        </div>
        <h3 className="course-title">{course.title}</h3>
        <p className="course-description">{course.description}</p>
        <div className="course-footer">
          <div className="course-price">
            {isFree ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}
          </div>
          <Link to={targetUrl} className="btn btn-outline">
            {targetLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
