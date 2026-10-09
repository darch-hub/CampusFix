# **CampusFix — Product Requirements Document**

---

## **1\. Overview**

CampusFix is a platform that lets students and staff report, track, and manage campus maintenance problems — faulty electrical systems, leaking pipes, damaged infrastructure, broken facilities, and similar issues. It replaces informal reporting (word of mouth, scattered emails, physical complaint forms) with a single, transparent system that shows everyone the status of campus issues from submission to resolution.

## **2\. Problem Statement**

Campus maintenance issues today are typically reported informally — a student tells a hostel warden, an email gets sent to a general office inbox, or nothing gets reported at all because it's unclear who to tell. This leads to:

* Issues going unreported or unresolved for long periods  
* No visibility into whether a reported issue is actually being handled  
* Duplicate reports of the same issue from different people  
* No institutional data on which buildings/systems need the most attention

CampusFix solves this by giving the campus community a single place to report problems and see them through to resolution, and giving administrators the data to prioritize and justify maintenance investment.

## **3\. Goals**

* Make reporting a campus issue as fast and frictionless as possible  
* Give reporters visibility into what's happening with their report  
* Give administrators a prioritized, organized view of all outstanding issues  
* Reduce duplicate reporting through shared visibility  
* Build a data trail that shows patterns (recurring problem areas, resolution speed) useful for institutional decision-making


## **4\. User Roles**

CampusFix supports two roles for its first version:

| Role | Description |
| :---- | :---- |
| Reporter | Any student or staff member. Can submit reports, view the public issue list, upvote/confirm existing reports, and track their own submissions. |
| Admin | Handles both triage and resolution. Can view, prioritize, update status, and resolve all reports; accesses the analytics dashboard. |

*(Note: a separate Maintenance Staff role was considered but deferred — Admins handle both triage and repair for now. This can be split later if the admin workload grows.)*

## **5\. Core Features**

### **5.1 Issue Reporting**

Reporters submit a new issue with:

* Category (Electrical, Plumbing, Structural, Furniture, Cleaning, Other, etc.)  
* Location — selected from a predefined list of buildings/rooms/areas (not free text), to keep locations consistent and searchable  
* Description — free text explaining the problem  
* Photo — optional but strongly encouraged upload of the issue  
* Suggested urgency — Low / Medium / High / Emergency (Reporter's own read on severity)  
* Anonymity toggle — Reporter can choose to submit anonymously; identity is then hidden even from Admins in the interface (only reporting metadata needed for accountability is retained separately)

Designed mobile-first, since most reports will be filed in the moment, on a phone, at the location of the problem.

### **5.2 Status Tracking**

Every report moves through four stages:  
**Reported → Acknowledged → In Progress → Resolved**

* Reported: submitted, not yet reviewed  
* Acknowledged: an Admin has seen it and confirmed it's valid — this alone builds trust, even before work starts  
* In Progress: actively being worked on  
* Resolved: fix completed

After a report is marked Resolved, the Reporter receives a prompt to confirm the fix actually worked:

* If confirmed → report stays closed  
* If not confirmed → report automatically reopens to In Progress


### **5.3 Priority & Urgency**

* Reporter suggests an urgency level when submitting  
* Admin can override/re-rate it during triage  
* Reports flagged Emergency or High are visually surfaced at the top of the Admin queue


### **5.4 Visibility & Duplicate Prevention**

* All logged-in users can see the list of open issues: category, location, status, and priority  
* Reporter identity is hidden from this public list (visible only to Admins, unless the report was submitted anonymously, in which case it's hidden from everyone)  
* Users can upvote / confirm ("I have this issue too") on an existing open report instead of filing a duplicate — upvote count is visible and factors into how Admins prioritize


### **5.5 Notifications**

Reporters are notified by in-app notification \+ email whenever their report's status changes (Acknowledged, In Progress, Resolved) or when a resolution confirmation is requested.

### **5.6 Overdue Flagging**

Each priority level has an expected time-in-stage. Reports that exceed this are visually flagged (e.g., highlighted red) in the Admin view so aging issues don't get lost in the queue.

### **5.7 Admin Dashboard**

Admins get a dashboard summarizing:

* Open vs. resolved counts  
* Average resolution time (overall and by category)  
* Breakdown of issues by category and by location/building  
* Overdue/flagged issue count

This data doubles as a case for institutional investment — e.g., surfacing that a particular hostel accounts for a disproportionate share of electrical complaints.

## **6\. User Flows**

**Reporter flow:**

1. Log in → tap "Report an Issue"  
2. Select category, location, describe the problem, attach a photo, set urgency, optionally mark anonymous  
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
   

## **7\. Success Metrics**

* Adoption: number of active reporters and reports filed per month  
* Resolution speed: average time from Reported → Resolved, by priority  
* Reopen rate: % of resolved issues reporters flag as not actually fixed  
* Duplicate reduction: upvotes vs. new reports on recurring issues  
* Coverage: % of campus buildings/areas with at least one report on file (signals real usage, not just isolated interest)


## **8\. Out of Scope (v1)**

* Separate Maintenance Staff role/workflow  
* Push notifications (in-app \+ email only for now)  
* In-app messaging/comments between reporter and admin  
* Automated routing of issues to specific departments  
* Public rating of how well an issue was resolved (beyond binary confirm/not confirmed)

These are reasonable candidates for a v2 once the core reporting/tracking loop is validated.

## **9\. Assumptions**

* All users (students and staff) have institutional login credentials to authenticate into CampusFix  
* The list of campus buildings/locations is maintained and kept up to date by Admins  
* Admins have sufficient bandwidth to triage and resolve reports without a dedicated maintenance staff tier, at least initially

