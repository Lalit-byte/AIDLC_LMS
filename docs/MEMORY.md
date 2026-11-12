# LMS — Shared Project Memory

**Project type:** New greenfield LMS.  
**Status:** Documentation and AIDLC preparation. No implementation should be assumed complete.

## 1. Approved starting direction

- Build a new Learning Management System from scratch.
- Do not use Strapi.
- Frontend: React + Vite.
- Backend: Node.js + Express.
- Database: MongoDB + Mongoose.
- Authentication: JWT + bcrypt.
- Payment gateway: Razorpay.
- Git hosting/task coordination: GitHub.
- AI-assisted IDE: Google Antigravity.
- Lifecycle: AIDLC.
- AI-to-GitHub integration: GitHub MCP Server.

## 2. Proposed roles

Guest, Student, Instructor, Admin. Backend enforces permissions. Product owner must confirm role details and instructor approval workflow.

## 3. Proposed MVP

Course catalogue/details, authentication, role-based access, instructor course/lesson management, admin review, Razorpay one-time checkout, verified enrollment, student dashboard, lesson progress.

## 4. Not selected / prohibited for this project baseline

- Strapi
- Clerk
- Firebase

Do not introduce these without an explicit project-owner decision.

## 5. Confirmed decisions (Inception Phase)

- **Lesson content types:** External video embed URLs (YouTube, Vimeo unlisted) and Markdown text.
- **Media/video hosting:** External embed URLs; no raw video binaries stored in MongoDB; dedicated S3/R2 storage deferred post-MVP.
- **Free vs. paid courses:** Both supported. Paid courses use server-authoritative Razorpay flow; free (₹0) courses bypass Razorpay order creation and activate enrollment directly via the backend.
- **Instructor onboarding:** Registered users can apply or be assigned instructor role by Admin. Courses created by instructors require Admin review before publishing.
- **Language & Styling:** JavaScript (ES Modules, no TypeScript initially) and modular CSS (no Tailwind initially).
- **Lifecycle execution:** AIDLC manual workflow aligned with Google Antigravity and repository docs.

## 6. Decisions still open / deferred

- Email notification provider (e.g. Resend, SendGrid, or nodemailer SMTP) — to be chosen in Milestone 1/2.
- Production hosting/deployment providers (e.g. Render/Railway/AWS for backend, Vercel/Netlify for frontend, Atlas for MongoDB).
- Automated refund and cancellation workflows (post-MVP).

## 7. Collaboration rules

- GitHub Issues and Projects are the shared task source.
- One accountable developer per issue.
- Each developer uses a separate feature branch and PR.
- Every developer reads committed docs; do not rely on private Antigravity chat memory.
- GitHub MCP access is permission-scoped and does not automatically observe local coding activity.
- Keep this file updated when an approved decision changes.
