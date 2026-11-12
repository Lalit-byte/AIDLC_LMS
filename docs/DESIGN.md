# LMS — Technical Design

**Status:** Initial design baseline; detailed schemas and API contracts require AIDLC design approval.

## 1. Design principles

- Use JavaScript consistently for the initial implementation unless the team explicitly approves TypeScript.
- Use feature/module boundaries.
- Keep business rules in backend services.
- Keep API request/response contracts explicit.
- Backend is authoritative for identity, roles, prices, payments, enrollments, and progress.
- Reuse shared UI and validation patterns.

## 2. Proposed MongoDB collections

These are proposed domain shapes. Review them during database design; do not blindly copy them over an existing schema.

### User
- `name`
- `email` (unique, normalized)
- `passwordHash`
- `role` (`student`, `instructor`, `admin`)
- `isActive`
- timestamps

### Course
- `title`, `slug`, `description`, `thumbnail`
- `categoryId`
- `instructorId`
- `price`, `currency`
- `status` (`draft`, `pending_review`, `published`, `rejected`, `archived`)
- `sections` or references to section documents, depending on scale
- timestamps

### Section / Lesson
- `courseId`, `title`, `order`
- Lesson: `sectionId`, `title`, `type`, `contentUrl` or `content`, `duration`, `order`, `isPreview`
- Do not store large video binaries directly in MongoDB; select a media-storage approach before implementation.

### Enrollment
- `studentId`, `courseId`
- `status` (`pending`, `active`, `cancelled`, `refunded`)
- `paymentId` where applicable
- timestamps
- Add a uniqueness strategy to prevent duplicate active enrollment for a student/course.

### Payment
- `studentId`, `courseId`
- `provider` (`razorpay`)
- `razorpayOrderId`, `razorpayPaymentId`
- `amount`, `currency`, `status`
- `verifiedAt`, `webhookEventId` or processed-event records
- timestamps
- Add unique indexes for provider identifiers and idempotency.

### LessonProgress
- `studentId`, `courseId`, `lessonId`
- `isCompleted`, `completedAt`
- timestamps
- Unique student/lesson combination.

## 3. API contract proposal

All routes below are candidates; confirm naming and exact response schema during AIDLC design.

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public, rate limited |
| POST | `/api/v1/auth/logout` | Authenticated |
| GET | `/api/v1/auth/me` | Authenticated |
| GET | `/api/v1/courses` | Public |
| GET | `/api/v1/courses/:courseId` | Public |
| POST | `/api/v1/courses` | Instructor/Admin |
| PATCH | `/api/v1/courses/:courseId` | Owner/Admin |
| POST | `/api/v1/courses/:courseId/submit` | Owner/Instructor |
| PATCH | `/api/v1/admin/courses/:courseId/review` | Admin |
| GET | `/api/v1/courses/:courseId/lessons` | Enrolled student/authorized staff |
| POST | `/api/v1/payments/orders` | Authenticated student |
| POST | `/api/v1/payments/verify` | Authenticated student; server verifies signature |
| POST | `/api/v1/payments/webhook` | Public network endpoint with Razorpay signature verification |
| GET | `/api/v1/enrollments/me` | Student |
| GET | `/api/v1/courses/:courseId/progress` | Enrolled student |
| PATCH | `/api/v1/lessons/:lessonId/progress` | Enrolled student |

## 4. Response format

Adopt one consistent format. Example:

Success:
```json
{
  "success": true,
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A safe user-facing message"
  }
}
```

Do not return stack traces, secrets, password hashes, or internal database errors.

## 5. Frontend feature design

- Public: home, course catalogue, course details, login, registration.
- Student: dashboard, enrolled courses, course player, progress, profile.
- Instructor: dashboard, course editor, section/lesson manager, course submissions.
- Admin: overview, user management, course review, category management, payment/enrollment views.

For every page, define loading, empty, success, and error states. Protect client routes for user experience, but repeat all permission checks on the backend.

## 6. Razorpay design checklist

- Use test mode during development.
- Keep Key Secret and webhook secret only on backend.
- Expose only the Razorpay Key ID to the frontend when required by Checkout.
- Backend calculates amount from the database; never accept trusted amount from browser.
- Store order before returning checkout details.
- Verify payment signature on backend.
- Verify webhook signature against raw body.
- Handle duplicate webhook events safely.
- Reconcile checkout verification and webhook updates without duplicate enrollment.
- Test payment success, failure, cancellation, invalid signature, duplicate event, delayed webhook, and refund state.
- Never use live credentials in development or commit secrets.

## 7. Testing plan

- Auth: valid/invalid registration, login, logout, token expiry, rate limiting.
- RBAC: student cannot use instructor/admin endpoints; instructor cannot edit another instructor's course.
- Courses: validation, draft/published visibility, ownership.
- Enrollment: duplicate prevention and access checks.
- Payments: amount tampering, invalid signature, webhook replay/duplicate, failed payment.
- Progress: only enrolled learners can update their own progress.
- UI: critical journeys and responsive layouts.
