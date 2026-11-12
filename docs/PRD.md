# LMS — Product Requirements Document

**Status:** Initial baseline for a new project  
**Product:** Web-based Learning Management System  
**Stack decision:** React + Vite, Node.js + Express, MongoDB + Mongoose, JWT + bcrypt, Razorpay  
**Important:** No Strapi, Clerk, or Firebase.

## 1. Product vision

Build a responsive LMS where learners can discover courses, purchase or enroll in courses, consume structured lessons, track learning progress, and manage their learning. Administrators manage users, instructors, courses, categories, and platform operations. Instructors manage their own course content subject to approval and permissions.

## 2. User roles

- **Guest:** Browse public course catalogue and course details.
- **Student:** Register/login, purchase/enroll, access eligible courses, track progress, manage profile.
- **Instructor:** Create and manage own courses and lessons; view relevant learner/enrollment information where permitted.
- **Admin:** Manage users, instructors, courses, categories, enrollments, payments, and platform settings.

All role checks must be enforced by the backend, not only by hiding frontend controls.

## 3. MVP functional requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-01 | Authentication | Register, login, logout, password hashing with bcrypt, JWT-based protected APIs, validation and safe errors. |
| FR-02 | Role-based access | Student, instructor, and admin permissions enforced server-side. |
| FR-03 | Course catalogue | Public list with course cards, category/filter/search, pagination, and course details. |
| FR-04 | Course management | Authorized instructor/admin can create, edit, submit/publish according to approval rules, and manage courses. |
| FR-05 | Course content | Courses contain sections/modules and lessons with agreed content types. |
| FR-06 | Razorpay checkout | Backend creates Razorpay order using server-controlled course price and amount. |
| FR-07 | Payment verification | Backend verifies Razorpay payment signature and processes webhooks securely and idempotently. |
| FR-08 | Enrollment | Enrollment becomes active only after trusted server-side payment confirmation, or approved free-course enrollment. |
| FR-09 | Student dashboard | Student sees enrolled courses and learning progress. |
| FR-10 | Learning progress | Student can mark lessons complete; progress is stored server-side. |
| FR-11 | Instructor dashboard | Instructor can view and manage their own courses and relevant performance data. |
| FR-12 | Admin dashboard | Admin can manage users, courses, categories, enrollments, and payment records. |
| FR-13 | Responsive UI | Core journeys work on mobile, tablet, and desktop. |

## 4. MVP scope and assumptions

Recommended MVP:
- Course catalogue and details.
- Email/password registration and login.
- Three roles: student, instructor, admin.
- Instructor course and lesson management.
- Admin approval before a course becomes publicly available.
- Razorpay one-time course purchase.
- Student enrollment and lesson progress.

Confirm before implementation:
- Whether courses can be free as well as paid.
- Whether lesson content is video URL, uploaded video, PDF, text, or a combination.
- Whether video hosting is external or a managed storage provider.
- Whether instructor self-registration requires admin approval.
- Whether coupons, refunds, certificates, quizzes, assignments, and reviews are post-MVP.

## 5. Non-functional requirements

- Security: password hashing, input validation, rate limiting, secure cookies/token handling as selected, RBAC, payment signature verification, secret management.
- Reliability: idempotent payment webhook processing and safe retry behavior.
- Maintainability: modular frontend/backend, documented APIs, consistent naming.
- Performance: pagination, indexes, optimized assets, and efficient queries.
- Accessibility: semantic HTML, labels, keyboard navigation, focus visibility.
- Observability: structured logs without passwords, tokens, payment secrets, or unnecessary personal data.
- Testing: unit, API integration, payment-flow, and end-to-end tests for critical journeys.

## 6. Out of scope for MVP unless approved

Live classes, chat, subscriptions, coupons, automated refunds, certificates, quizzes, assignments/grading, mobile native apps, multi-tenant organizations, AI tutor, and recommendation engine.

## 7. Key journeys

### Student
1. Browse courses.
2. Open course details.
3. Register or log in.
4. Start checkout for a paid course or enroll in an approved free course.
5. Complete Razorpay checkout.
6. Backend verifies payment and activates enrollment.
7. Student accesses course lessons and tracks progress.

### Instructor
1. Log in with instructor role.
2. Create course and add sections/lessons.
3. Submit course for review.
4. Admin approves/publishes course.
5. Instructor manages course content and views permitted enrollment information.

### Admin
1. Log in with admin role.
2. Review instructor/course submissions.
3. Manage users, courses, categories, and enrollments.
4. Review payment records and operational reports.

## 8. Definition of release acceptance

- Agreed acceptance criteria pass.
- Authorization is tested on backend endpoints.
- Payment signature and webhook flows are tested, including invalid and duplicate events.
- No secrets are committed.
- Build, lint, and test commands pass.
- Critical student/instructor/admin journeys pass.
- PR review is complete and deployment/rollback notes exist.

## 9. Open product decisions

Record each decision in GitHub issue/ADR and update this document:
1. Course content types and media hosting.
2. Free vs paid course rules.
3. Instructor approval and course publishing workflow.
4. Currency and tax display requirements.
5. Refund/cancellation policy.
6. Email notifications provider.
7. Admin bootstrap process and protection of the first admin account.
