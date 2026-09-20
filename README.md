# CampusFix

CampusFix is a platform that lets students and staff report, track, and manage campus maintenance problems — faulty electrical systems, leaking pipes, damaged infrastructure, broken facilities, and similar issues.

It replaces informal reporting (word of mouth, scattered emails, physical complaint forms) with a single, transparent system that shows everyone the status of campus issues from submission to resolution.

Source of truth: `docs/CampusFix — Product Requirements Document (1).md` (do not modify or delete).

## Problem It Solves

Today campus maintenance issues are typically reported informally — a student tells a hostel warden, an email gets sent to a general office inbox, or nothing gets reported at all because it's unclear who to tell. This leads to:

- Issues going unreported or unresolved for long periods
- No visibility into whether a reported issue is actually being handled
- Duplicate reports of the same issue from different people
- No institutional data on which buildings/systems need the most attention

CampusFix solves this by giving the campus community a single place to report problems and see them through to resolution, and giving administrators the data to prioritize and justify maintenance investment.

## Target Users and User Roles

Target users: students and staff (reporters), and campus administrators.

| Role | Description |
| ---- | ----------- |
| Reporter | Any student or staff member. Can submit reports, view the public issue list, upvote/confirm existing reports, and track their own submissions. |
| Admin | Handles both triage and resolution. Can view, prioritize, update status, and resolve all reports; accesses the analytics dashboard. |

Note: a separate Maintenance Staff role was considered but deferred for v1 — Admins handle both triage and repair for now.

## Core Features (per PRD)

1. **Issue Reporting** — category (Electrical, Plumbing, Structural, Furniture, Cleaning, Other), location from a predefined building/room/area list (not free text), free-text description, optional photo, suggested urgency (Low / Medium / High / Emergency), anonymity toggle. Mobile-first.
2. **Status Tracking** — `Reported → Acknowledged → In Progress → Resolved`. On `Resolved`, the reporter is prompted to confirm the fix; if not confirmed, the report reopens to `In Progress`.
3. **Priority & Urgency** — reporter suggests urgency, admin can override. Emergency/High surfaced at top of admin queue.
4. **Visibility & Duplicate Prevention** — all logged-in users see open issues (category, location, status, priority). Reporter identity hidden from public list (visible only to admins, unless anonymous). Users can upvote/confirm instead of filing duplicates.
5. **Notifications** — in-app + email on status change (Acknowledged, In Progress, Resolved) and on resolution-confirmation request.
6. **Overdue Flagging** — expected time-in-stage per priority; overdue reports visually flagged in admin view.
7. **Admin Dashboard** — open vs. resolved counts, average resolution time (overall and by category), breakdown by category and location/building, overdue/flagged count.

## Main User Flows

**Reporter flow:**
1. Log in → tap "Report an Issue"
2. Select category, location, describe problem, attach photo, set urgency, optionally mark anonymous
3. Submit → receive confirmation
4. Get notified as status changes
5. On resolution, confirm the fix worked (or flag that it's still broken)

**Browsing flow (any user):**
1. View the public list of open issues
2. Filter by category/location/status
3. Upvote/confirm an issue instead of filing a duplicate

**Admin flow:**
1. View incoming reports, sorted by priority/age
2. Acknowledge a report (triggers reporter notification)
3. Update status as work progresses
4. Mark Resolved → reporter is prompted to confirm
5. Review dashboard for trends and overdue items

## Goals

- Make reporting a campus issue as fast and frictionless as possible
- Give reporters visibility into what's happening with their report
- Give administrators a prioritized, organized view of all outstanding issues
- Reduce duplicate reporting through shared visibility
- Build a data trail that shows patterns (recurring problem areas, resolution speed) useful for institutional decision-making

## What Is Included in v1

Per PRD: reporting, 4-stage status tracking with confirm/reopen, admin urgency override, public list + filters + upvotes, in-app + email notifications, overdue flagging, admin dashboard, predefined locations, institutional login, anonymity toggle.

Out of scope for v1: separate Maintenance Staff role/workflow, push notifications, in-app messaging/comments, automated routing to departments, public rating beyond binary confirm/not-confirmed.

Assumptions: all users have institutional login; building/location list is maintained by admins; admins have bandwidth to triage without a dedicated maintenance tier initially.

## What Is Currently Implemented (Initial Scaffold)

This is an initial scaffold only. No PRD feature is fully implemented yet.

Implemented:
- Express server serving static frontend and stub API routes (`GET /api/health` works; other endpoints return `501 Not Implemented` with TODOs)
- Domain models as documented schemas (`Issue`, `User`) matching PRD fields
- Predefined location list placeholder (`src/config/locations.js`)
- Static mobile-first frontend placeholder (`public/`) with report form fields and issue list/filter UI matching PRD, wired to stub APIs
- Project structure, `.gitignore`, `package.json`, `data/` placeholder for future storage/uploads

Not implemented yet:
- Auth (institutional login), database persistence, photo upload storage
- Full issue CRUD, status transitions, confirm/reopen logic, upvotes
- Notifications (in-app + email), overdue calculation, admin dashboard queries
- Admin location management

## Project Structure

```text
Qubators_project/
├── README.md
├── package.json
├── .gitignore
├── docs/
│   └── CampusFix — Product Requirements Document (1).md  # source of truth, do not edit
├── src/
│   ├── server.js              # Express scaffold, static + API stubs
│   ├── config/
│   │   └── locations.js       # predefined building/area list placeholder
│   ├── models/
│   │   ├── Issue.js           # PRD §5.1–5.4 schema documentation
│   │   └── User.js            # Reporter/Admin roles documentation
│   └── routes/
│       ├── issues.js          # report/list/upvote/confirm stubs
│       └── admin.js           # triage/status/dashboard stubs
├── public/
│   ├── index.html             # mobile-first report + list UI scaffold
│   ├── styles.css
│   └── app.js                 # fetch stubs to API
└── data/
    └── .gitkeep               # placeholder for future DB/uploads
```

## Getting Started

Requirements: Node.js 18+.

```powershell
npm install
npm start
# open http://localhost:3000
# check http://localhost:3000/api/health
```

This scaffold is intentionally minimal to allow iterative implementation of the PRD in later versions.
