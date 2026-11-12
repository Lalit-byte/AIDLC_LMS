# LMS — AIDLC Delivery Plan and Backlog

**Status:** Proposed plan. Create GitHub Issues from these tasks after project setup and AIDLC review.

## 1. AIDLC execution approach

Use these documents as pre-work to reduce repeated discovery. Do not skip required AIDLC approvals or validation gates. The team should:
1. Inspect and confirm scope.
2. Review requirements and record open decisions.
3. Validate architecture and technical design.
4. Break approved work into issues.
5. Implement in parallel only after interface contracts are stable.
6. Integrate, test, deploy, and update docs.

Follow the exact phase names and artifact requirements of the AIDLC version/harness configured in the repository.

## 2. Milestone 0 — Project bootstrap

- [x] M0-01 Connect GitHub repository (https://github.com/Lalit-byte/AIDLC_LMS.git) and push `main`.
- [x] M0-02 Create project folder and initial README.
- [x] M0-03 Add this `docs/` package.
- [x] M0-04 Confirm product decisions in PRD.
- [x] M0-05 Approve architecture and design.
- [x] M0-06 Configure AIDLC for the chosen supported harness; run its doctor/validation command. (aidlc configured and validated)
- [x] M0-07 Configure GitHub MCP for each developer using individual GitHub authentication and least privilege. (Official Go github-mcp-server v2.1.0 installed & configured)
- [ ] M0-08 Create GitHub Project board, labels, milestones, and issue templates.
- [ ] M0-09 Agree branch protection, PR review, CI, and coding conventions.

## 3. Milestone 1 — Foundation

- [x] M1-01 Initialize React + Vite client. ([#1](https://github.com/Lalit-byte/AIDLC_LMS/issues/1))
- [x] M1-02 Initialize Express server. ([#2](https://github.com/Lalit-byte/AIDLC_LMS/issues/2))
- [x] M1-03 Configure MongoDB connection and environment validation. ([#3](https://github.com/Lalit-byte/AIDLC_LMS/issues/3))
- [x] M1-04 Configure shared error handling, logging, and request validation. ([#4](https://github.com/Lalit-byte/AIDLC_LMS/issues/4))
- [x] M1-05 Implement registration/login/password hashing/JWT lifecycle. ([#5](https://github.com/Lalit-byte/AIDLC_LMS/issues/5))
- [x] M1-06 Implement role and ownership middleware. ([#6](https://github.com/Lalit-byte/AIDLC_LMS/issues/6))
- [x] M1-07 Add automated test and build/lint workflows. ([#7](https://github.com/Lalit-byte/AIDLC_LMS/issues/7))

## 4. Milestone 2 — Course management

- [ ] M2-01 Design and implement course/category data models.
- [ ] M2-02 Implement public course list, filtering, pagination, and details.
- [ ] M2-03 Implement instructor course create/update.
- [ ] M2-04 Implement sections and lessons.
- [ ] M2-05 Implement course submission and admin review/publishing.
- [ ] M2-06 Build public catalogue and course detail UI.
- [ ] M2-07 Build instructor course-management UI.
- [ ] M2-08 Build admin course-review UI.

## 5. Milestone 3 — Payments and enrollment

- [ ] M3-01 Confirm Razorpay account, test-mode credentials, and webhook setup.
- [ ] M3-02 Implement server-side Razorpay order creation using database price.
- [ ] M3-03 Implement backend checkout signature verification.
- [ ] M3-04 Implement webhook signature verification and idempotent event processing.
- [ ] M3-05 Implement payment state and enrollment activation rules.
- [ ] M3-06 Build checkout UI and payment result states.
- [ ] M3-07 Test success, failure, cancel, invalid signature, duplicate webhook, and delayed webhook.

## 6. Milestone 4 — Learning experience

- [ ] M4-01 Implement student enrollment list.
- [ ] M4-02 Implement protected lesson/content access.
- [ ] M4-03 Implement lesson completion and progress persistence.
- [ ] M4-04 Build student dashboard and course player.
- [ ] M4-05 Add instructor dashboard basics.
- [ ] M4-06 Add admin user/category/enrollment views.

## 7. Milestone 5 — QA and release

- [ ] M5-01 Unit and API integration tests.
- [ ] M5-02 Frontend component and journey tests.
- [ ] M5-03 RBAC and ownership security tests.
- [ ] M5-04 Payment/webhook regression tests.
- [ ] M5-05 Responsive and accessibility checks.
- [ ] M5-06 Configure production environment and secrets.
- [ ] M5-07 Deploy and verify health checks and critical journeys.
- [ ] M5-08 Document rollback, support, and release procedure.

## 8. Suggested parallel workstreams

Start parallel work only after foundation contracts and shared data models are approved.

| Workstream | Primary owner | Dependencies |
|---|---|---|
| Auth and user/RBAC | Backend developer A | User model and security design |
| Course/catalogue APIs | Backend developer B | Course schema and API contract |
| Public/student frontend | Frontend developer A | API contract and agreed UI design |
| Instructor/admin frontend | Frontend developer B | Roles and course workflow contract |
| Razorpay/payment | Backend developer C | Course pricing and enrollment state model |
| QA/automation | QA developer | Acceptance criteria and stable test environment |

For a smaller team, combine workstreams. Keep one accountable owner per issue. Assign a project lead/integrator to review cross-module changes.

## 9. GitHub Project workflow

Statuses: `Backlog` → `Ready` → `In Progress` → `In Review` → `Blocked` (as needed) → `Done`.

Suggested fields: Assignee, Status, Priority, Milestone, Area, Estimate, Target date, Linked PR.

Issue template:
- Goal and context.
- Requirements/design references.
- Acceptance criteria.
- One accountable assignee.
- Dependencies.
- Likely modules/files (confirm after inspection).
- Test plan.
- Definition of Done.

## 10. Integration rules

- One issue per branch and PR.
- Agree API contracts before frontend/backend parallel work.
- Avoid concurrent edits to shared models, route registries, package files, and global configuration.
- Merge small PRs frequently after review.
- Never equate a GitHub issue's status with verified implementation; use code, PR, and test evidence.
