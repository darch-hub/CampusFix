# CampusFix — PRD Implementation Decisions

Living log of implementation decisions taken against the source of truth
(`docs/CampusFix — Product Requirements Document (1).md`, which is never edited).
Newest phase first.

## Phase: Auth-first UI shell + role-aware landing (current)

**Problem observed:** the sign-in form shared a page with the report form, so
unauthenticated users saw app functionality before authenticating.

**Decisions:**
1. **Auth-first gating (PRD §4, §6 reporter flow step 1 "Log in").**
   Unauthenticated visitors see only a centered sign-in card (`#view-auth`).
   The report/browse/admin interface (`#view-app`) stays hidden until a
   valid session exists. A `401` from any API call drops back to sign-in.
   No anonymous browsing: PRD §5.4 scopes the public issue list to
   "all logged-in users".
2. **Role-aware landing (PRD §4).** After sign-in the header shows
   `name · role` with sign-out. Reporters get Report + Open Issues.
   Admins additionally get an Admin panel (urgency-sorted queue with
   advance-status + urgency-override controls, and dashboard stat cards),
   backed by the existing `GET /api/admin/issues`,
   `PATCH /api/admin/issues/:id`, `GET /api/admin/dashboard` endpoints.
   No backend changes were required for this phase.
3. **Visual hierarchy, dark palette kept (PRD §5.1 mobile-first).**
   Sticky-style top bar, card sections, structured issue cards
   (title → badges/status → description → photo → actions), filter row.
   Existing design tokens and the dark `prefers-color-scheme` palette are
   unchanged; only layout/hierarchy classes were added.

**Deferred to later phases (not in scope here):**
- Reporter fix-confirmation prompt UI (PRD §5.2 confirm/reopen — API exists).
- Admin location-management UI (PRD §9 — API exists).
- In-app notification inbox UI (PRD §5.5 — API exists).
