import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen } from 'react-icons/fi';
import './CourseCard.css';

export default function CourseCard({ course, actionLabel, actionUrl }) {
  const price = typeof course.price === 'number' ? course.price : Number(course.price || 0);
  const isFree = price === 0;
  const courseId = course.id || course.slug || course._id;
  const targetUrl = actionUrl || `/courses/${courseId}`;
  const targetLabel = actionLabel || 'View Details';
  const categoryName = typeof course.category === 'object' ? course.category?.name : course.category;
  const instructor =
    typeof course.instructor === 'object'
      ? course.instructor?.name || course.instructorName || ''
      : course.instructorName || course.instructor || '';
  const lessonsCount =
    course.totalLessons ||
    (course.sections && Array.isArray(course.sections)
      ? course.sections.reduce((sum, s) => sum + (s.lessons ? s.lessons.length : 0), 0)
      : null);

  return (
    <article className="course-card">
      <div className="course-thumbnail-wrapper">
        <img
          src={course.thumbnail || '/hero.png'}
          alt={course.title}
          className="course-thumbnail"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/hero.png';
          }}
        />
        <span className={`badge ${isFree ? 'badge-free' : 'badge-paid'}`}>
          {isFree ? 'Free' : 'Paid'}
        </span>
      </div>

      <div className="course-body">
        <div className="course-meta">
          <span className="course-category">{categoryName || 'General'}</span>
          {lessonsCount ? (
            <span className="course-lessons-badge tabular-nums">
              <FiBookOpen size={12} style={{ marginRight: '0.25rem' }} aria-hidden="true" />
              {`${lessonsCount} lessons`}
            </span>
          ) : null}
        </div>

        <h3 className="course-title">{course.title}</h3>
        {instructor ? <div className="course-instructor">{`By ${instructor}`}</div> : null}
        <p className="course-description">{course.description}</p>

        <div className="course-footer">
          <div className="course-price tabular-nums">
            {isFree ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
          </div>
          <Link to={targetUrl} className="btn btn-primary">
            {targetLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
