# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance; contradictions with broader policy
> are rejected. Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

<!-- Project-specific specialisation. -->

## Guard Policy

<!-- Project-specific. Mode: strict, relaxed, or off. Strict here holds for every intent, whatever one person asks in chat; relaxed or off here applies to every intent whose policy came from its scope, unless the person sets another; changing this line changes it. A section under the retired Change Control heading, written by an earlier release, is still read. -->

## Deployment

<!-- Project-specific specialisation. -->

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

- Frontend: React + Vite + vanilla JavaScript (ES modules)
- Backend: Node.js + Express REST API
- Database: MongoDB + Mongoose ODM
- Authentication: JWT + bcrypt password hashing
- Payments: Razorpay (server-side orders & signature/webhook verification)
- Version Control & Tasks: Git, GitHub Issues & Projects
- Prohibited: Strapi, Clerk, Firebase, Stripe

## Decided

- DECIDED: Lesson content format is external embed URLs (YouTube/Vimeo) + Markdown text (Stage inception, 2026-11-12)
- DECIDED: Free (₹0) courses are supported with direct server-side enrollment activation bypassing Razorpay (Stage inception, 2026-11-12)
- DECIDED: Instructor onboarding requires admin approval/role assignment; instructor courses require admin review before publishing (Stage inception, 2026-11-12)
- DECIDED: Two-phase execution sequence: Frontend-First (Phase 1) with mock service layer, followed by Backend Server (Phase 2) (Stage inception, 2026-11-12)
- DECIDED: Always ask project owner for explicit confirmation before pushing any branch to remote (Stage inception, 2026-11-12)
- DECIDED: Development lifecycle follows manual AIDLC workflow structured with Antigravity and repository docs (Stage inception, 2026-11-12)

## Scope Overrides

<!-- Custom scope rules for this project. -->

## Forbidden

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: NEVER [behavior] (affirmed [date]) -->
<!-- Example: NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
