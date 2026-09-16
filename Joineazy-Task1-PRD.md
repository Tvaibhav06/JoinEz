# Product Requirements Document
## Student, Group & Assignment Management System
### Joineazy — Full Stack Intern Technical Task (Task 1)

---

## 1. Document Overview

**Product Name:** Student, Group & Assignment Management System

**Document Purpose:** This PRD translates the Joineazy Full Stack Intern Technical Task Assignment (Task 1) into a structured, implementation-ready specification that a developer or an AI coding agent can use to build the complete application without needing to re-read the original assignment.

**Source of Requirements:** The Joineazy Technical Task Assignment ("Student, Group & Assignment Management System"), dated with a submission deadline of Thursday, 17th September 2026, 11:30 PM.

**Scope of this PRD:** Covers functional requirements, data model, API surface, frontend/backend/database/Docker requirements, security, non-functional requirements, workflows, acceptance criteria, and traceability for the application described in the assignment. It does not cover the hiring/interview process itself beyond the technical-interview discussion points explicitly requested by the assignment.

**Intended Audience:** The developer implementing the task, any AI coding agent used to assist implementation, and technical interviewers assessing the submission.

**Source-of-Truth Statement:** This PRD is derived **exclusively** from the Joineazy Task 1 assignment text reproduced in this exercise. No feature, technology, workflow, validation rule, or non-functional requirement has been added beyond what is explicitly stated or is a direct, unavoidable logical consequence of an explicit statement. Every such logical consequence is labeled "Logical Derivation." Every unresolved gap is labeled "Open Question / Ambiguity in Source Assignment." Every necessary but unstated decision is labeled "Assumption."

---

## 2. Product Overview

The system is a role-based web application used by **Students** and **Admins (Professors)** at Joineazy to coordinate group-based assignment work.

**Problem being solved:** Professors post assignments and share an external OneDrive link where the actual work must be uploaded. Students do the uploading themselves, outside the application. The application's job is to let students organize into groups, let professors publish and target assignments, and let both sides see — via a simple in-app confirmation step — whether a group's members have finished uploading their work externally.

**Overall workflow:**
1. A student registers and logs in.
2. The student creates a group and adds members by email or ID.
3. An admin creates an assignment (title, description, due date, OneDrive link) and assigns it to all students or to specific groups.
4. Students view assignments visible to them and open the OneDrive link to do the actual submission externally.
5. Once a student has uploaded their work on OneDrive, they return to the application and confirm the submission using a two-step in-app action ("Yes, I have submitted" → confirm).
6. The group's progress is shown visually (progress bars or completion badges) based on confirmations.
7. Admins monitor confirmations group-wise and student-wise, and view basic analytics/summary counts on completion and group performance.

**The two primary roles:**
- **Student** — forms/joins groups, views assignments, accesses OneDrive links, confirms submission, views group progress.
- **Admin (Professor)** — creates/edits/views assignments, targets assignments to all students or specific groups, monitors confirmations, views analytics.

**Relationship between students, groups, assignments, and submission confirmations:** A Student can create/belong to a Group. An Assignment is created by an Admin and targeted to either all Students or to specific Groups. A Submission Confirmation is an internal record, created by a Student through the two-step in-app flow, that indicates the student has finished uploading their work externally for a given assignment. Group progress is a visual aggregation of the submission confirmations belonging to the members of that group for a given assignment.

No additional use case (e.g., grading, file upload into the app, chat, notifications) is introduced.

---

## 3. Goals and Success Criteria

| Goal | What "Complete" Means (per assignment) |
|---|---|
| Role-based access | Student and Admin see and can perform only the actions listed under their respective role in the assignment; enforced via JWT-based auth. |
| Group formation and member management | Students can create a group and add/invite members using student email or ID. |
| Assignment management | Admins can create, edit, and view assignments with title, description, due date, and OneDrive link, and target them to all students or specific groups. |
| Submission confirmation | Students can confirm submission through a two-step verification ("Yes, I have submitted" → confirm), recorded internally, distinct from the external OneDrive upload. |
| Group progress tracking | Students can visually track their group's progress via progress bars or completion badges. |
| Professor monitoring | Admins can track group-wise and student-wise submission confirmations. |
| Basic analytics | Admins can view submission completion and group performance via basic charts or summary counts. |
| Secure APIs | APIs are protected using JWT authentication and role-based authorization, as the assignment explicitly asks for "secure APIs." |
| Responsive UI | The React + Tailwind frontend works across screen sizes ("user-friendly, responsive interface"). |
| Modular codebase | Codebase is clean, modular, with separate frontend and backend folders and clear commit history. |
| Working demo | A working demo of the application exists and a demo video link is submitted. |
| Documentation | A README.md exists covering implementation overview, setup/run instructions, API endpoint details, DB schema/relationships (ER diagram preferred), architecture overview, and key design/deployment decisions. |

No numerical KPIs (e.g., load times, uptime percentages) are defined in the assignment, so none are introduced here.

---

## 4. User Roles and Permissions

### 4.1 Student Permissions

| # | Capability | Source |
|---|---|---|
| S1 | Register an account | Explicit |
| S2 | Log in | Explicit |
| S3 | Create a new group | Explicit |
| S4 | Add/invite group members via student email or ID | Explicit |
| S5 | View all assignments posted by professors | Explicit |
| S6 | Access the OneDrive submission link for each assignment | Explicit |
| S7 | Confirm submission via two-step verification | Explicit |
| S8 | Track group progress visually (progress bars/completion badges) | Explicit |
| S9 | View own group's membership list | Logical Derivation (needed to "manage members" and to show who has/hasn't confirmed) |

### 4.2 Admin (Professor) Permissions

| # | Capability | Source |
|---|---|---|
| A1 | Create assignments (title, description, due date, OneDrive link) | Explicit |
| A2 | Edit assignments | Explicit |
| A3 | View assignments | Explicit |
| A4 | Assign work to all students | Explicit |
| A5 | Assign work to specific groups | Explicit |
| A6 | Track group-wise submission confirmations | Explicit |
| A7 | Track student-wise submission confirmations | Explicit |
| A8 | View submission completion analytics | Explicit |
| A9 | View group performance analytics | Explicit |
| A10 | View basic charts or summary counts | Explicit |

No permission beyond this list is granted to either role. Whether an Admin can also log in (as opposed to only registering) is addressed in Section 6 as it is not spelled out symmetrically with the Student role.

---

## 5. Functional Requirements

Each requirement below traces directly to an explicit bullet in the assignment, or is marked as a Logical Derivation where an explicit requirement cannot function without it.

#### FR-AUTH-001 — Student Registration
- **Description:** A student can create an account.
- **Actor:** Student
- **Preconditions:** None (first-time user).
- **Main Flow:** 1) Student submits registration details. 2) System creates a Student account. 3) System confirms account creation.
- **Alternative/Error Flow:** Duplicate email/ID → registration rejected (Logical Derivation — needed for unique identification since members are later added "via student email or ID").
- **Expected Result:** A new Student user record exists.
- **Acceptance Criteria:** Given valid registration details, when the student submits them, then a Student account is created and can subsequently log in.

#### FR-AUTH-002 — Student Login
- **Description:** A registered student can log in.
- **Actor:** Student
- **Preconditions:** Student account exists.
- **Main Flow:** 1) Student submits credentials. 2) System validates credentials. 3) System issues a JWT.
- **Alternative/Error Flow:** Invalid credentials → login rejected.
- **Expected Result:** Student receives a JWT identifying them with the Student role.
- **Acceptance Criteria:** Given correct credentials, when the student logs in, then a JWT is issued and grants access to Student-role endpoints.

#### FR-AUTH-003 — Admin Access to the System
- **Description:** An Admin (Professor) can authenticate into the system with the Admin role.
- **Actor:** Admin
- **Preconditions:** An Admin account exists (see Section 6 for how — Open Question).
- **Main Flow:** 1) Admin submits credentials. 2) System validates credentials. 3) System issues a JWT with the Admin role.
- **Expected Result:** Admin receives a JWT identifying them with the Admin role.
- **Acceptance Criteria:** Given correct Admin credentials, when the Admin logs in, then a JWT is issued and grants access to Admin-role endpoints.
- **Note:** The assignment states authentication is "JWT-based (Student/Admin roles)" but only explicitly lists "Register and log in" under the Student role. Admin login is a Logical Derivation from the technical requirement; Admin *registration* mechanics are an Open Question (see Section 6).

#### FR-GROUP-001 — Create Group
- **Description:** A student can create a new group.
- **Actor:** Student
- **Preconditions:** Student is logged in.
- **Main Flow:** 1) Student initiates group creation. 2) System creates the Group with the student as a member. 3) Group is available for adding members.
- **Expected Result:** A new Group record exists, containing the creating student.
- **Acceptance Criteria:** Given a logged-in student, when they create a group, then the group exists and the student is a member of it.

#### FR-GROUP-002 — Add/Invite Group Member
- **Description:** A student can add or invite another student to their group using the target student's email or ID.
- **Actor:** Student (acting on their own group)
- **Preconditions:** Group exists; student performing the action belongs to it (Assumption — see Section 7).
- **Main Flow:** 1) Student enters a target student's email or ID. 2) System locates the matching Student account. 3) System adds the student to the group's membership.
- **Alternative/Error Flow:** Target email/ID does not match any registered student → error (see Section 24). Target student already a member → duplicate-membership error (see Section 24).
- **Expected Result:** The identified student becomes a member of the group.
- **Acceptance Criteria:** Given a valid, registered student email or ID, when an existing group member submits it to add a member, then that student appears in the group's membership list.

#### FR-GROUP-003 — View Group Membership
- **Description:** A student can view the members of their own group(s).
- **Actor:** Student
- **Preconditions:** Student belongs to at least one group.
- **Expected Result:** List of group members is displayed.
- **Acceptance Criteria:** Given a student in a group, when they open the group view, then all current members are listed.
- **Source:** Logical Derivation (required to support "invite/add members" and progress visibility per member).

#### FR-ASSIGN-001 — Create Assignment
- **Description:** An Admin can create an assignment with title, description, due date, and OneDrive link.
- **Actor:** Admin
- **Preconditions:** Admin is authenticated.
- **Main Flow:** 1) Admin enters title, description, due date, OneDrive link. 2) System stores the Assignment.
- **Alternative/Error Flow:** Missing required field → validation error.
- **Expected Result:** A new Assignment record exists.
- **Acceptance Criteria:** Given valid assignment fields, when the Admin submits them, then the assignment is created and stored.

#### FR-ASSIGN-002 — Edit Assignment
- **Description:** An Admin can edit an existing assignment's details.
- **Actor:** Admin
- **Preconditions:** Assignment exists.
- **Expected Result:** Assignment fields are updated.
- **Acceptance Criteria:** Given an existing assignment, when the Admin edits and saves it, then the updated values are persisted and reflected to students.

#### FR-ASSIGN-003 — View Assignments (Admin)
- **Description:** An Admin can view assignments they (or the system) have created.
- **Actor:** Admin
- **Expected Result:** List/detail view of assignments is available to the Admin.
- **Acceptance Criteria:** Given assignments exist, when the Admin opens the assignments view, then all assignments are listed with their details.

#### FR-ASSIGN-004 — View Assignments (Student)
- **Description:** A student can view all assignments posted by professors that are visible to them.
- **Actor:** Student
- **Expected Result:** Student sees a list of applicable assignments with title, description, due date, and OneDrive link.
- **Acceptance Criteria:** Given assignments targeted to the student (directly or via their group, or targeted to all students), when the student opens the assignments view, then those assignments are listed.

#### FR-ASSIGN-005 — Target Assignment to All Students
- **Description:** An Admin can assign an assignment to all students.
- **Actor:** Admin
- **Expected Result:** Assignment becomes visible to every student.
- **Acceptance Criteria:** Given an assignment targeted to "all students," when any student opens their assignments view, then the assignment appears.

#### FR-ASSIGN-006 — Target Assignment to Specific Groups
- **Description:** An Admin can assign an assignment to one or more specific groups.
- **Actor:** Admin
- **Expected Result:** Assignment becomes visible only to members of the targeted group(s).
- **Acceptance Criteria:** Given an assignment targeted to Group X, when a member of Group X opens their assignments view, then the assignment appears; when a student outside Group X opens their assignments view, the assignment does not appear (Logical Derivation from "specific groups" implying exclusivity — flagged also in Section 25 as it is not explicitly restated).

#### FR-SUBMIT-001 — Access OneDrive Submission Link
- **Description:** A student can access the OneDrive submission link associated with an assignment.
- **Actor:** Student
- **Expected Result:** Student is able to open/copy the OneDrive link to upload their work externally.
- **Acceptance Criteria:** Given an assignment visible to the student, when they select the OneDrive link, then it opens/is accessible in a new context outside the application.

#### FR-SUBMIT-002 — Two-Step Submission Confirmation
- **Description:** A student confirms, within the app, that they have uploaded their work externally, via a two-step action.
- **Actor:** Student
- **Preconditions:** Assignment is visible to the student; student has (presumably) already uploaded work to OneDrive.
- **Main Flow:** 1) Student selects "Yes, I have submitted." 2) Student confirms the action. 3) System records a Submission Confirmation linked to the student and the assignment.
- **Alternative/Error Flow:** Student cancels at step 2 → no confirmation recorded. Student repeats the action after already confirming → see Section 24/25 (Open Question on reconfirmation).
- **Expected Result:** A Submission Confirmation record exists for the student and assignment.
- **Acceptance Criteria:** Given the student has selected "Yes, I have submitted" and then confirmed, then the system records the confirmation and it is reflected in group progress and admin monitoring views.

#### FR-PROGRESS-001 — Group Progress Visualization
- **Description:** A student can see their group's progress toward assignment completion, shown as a progress bar or completion badge.
- **Actor:** Student
- **Expected Result:** A visual indicator reflects how many of the group's members have confirmed submission for a given assignment.
- **Acceptance Criteria:** Given a group with N members and M confirmed submissions for an assignment, when the student views group progress, then a progress bar or badge reflecting that state is shown. (Exact formula is an Open Question — see Section 10.)

#### FR-ADMIN-001 — Track Group-Wise Submission Confirmations
- **Description:** An Admin can see, per group, which members have confirmed submission for a given assignment.
- **Actor:** Admin
- **Acceptance Criteria:** Given confirmations exist, when the Admin views group-wise tracking, then each group's confirmed/unconfirmed member breakdown is shown per assignment.

#### FR-ADMIN-002 — Track Student-Wise Submission Confirmations
- **Description:** An Admin can see, per student, whether they have confirmed submission for a given assignment.
- **Actor:** Admin
- **Acceptance Criteria:** Given confirmations exist, when the Admin views student-wise tracking, then each student's confirmation status per assignment is shown.

#### FR-ANALYTICS-001 — Submission Completion Analytics
- **Description:** An Admin can view analytics on submission completion (basic charts or summary counts).
- **Actor:** Admin
- **Acceptance Criteria:** Given confirmation data exists, when the Admin opens the analytics view, then aggregate completion figures (e.g., counts/proportions) are displayed via chart(s) or summary counts.

#### FR-ANALYTICS-002 — Group Performance Analytics
- **Description:** An Admin can view analytics on group performance (basic charts or summary counts).
- **Actor:** Admin
- **Acceptance Criteria:** Given confirmation data exists per group, when the Admin opens the analytics view, then group-level performance figures are displayed via chart(s) or summary counts. (Exact definition of "performance" is an Open Question — see Section 12/25.)

---

## 6. Authentication and Authorization Requirements

**Registration:** Explicitly required for Students (FR-AUTH-001). Admin registration mechanics are not stated.

**Login:** Explicitly required for Students. Admin login is a Logical Derivation from "JWT-based (Student/Admin roles)" authentication.

**JWT-based authentication:** The assignment explicitly requires JWT-based authentication distinguishing Student and Admin roles. On successful login, the system issues a JWT encoding at minimum the user's identity and role.

**Role-based access control:** Endpoints must be protected such that:
- Student-only actions (group creation, adding members, confirming submission, viewing own assignments/progress) require a valid JWT with the Student role.
- Admin-only actions (creating/editing assignments, targeting, monitoring, analytics) require a valid JWT with the Admin role.
- Unauthenticated requests to any protected endpoint are rejected.

**Explicitly NOT specified (not invented here):** token expiration policy, refresh-token mechanism, password-reset flow, social login, multi-factor authentication, session management beyond JWT issuance/validation.

**Open Question / Ambiguity in Source Assignment:**
- How an Admin account is created (self-registration with a role selector, a separate admin-only registration path, or manually seeded/provisioned). The assignment only explicitly states "Register and log in" under the Student role; it does not describe an Admin registration flow.
- Password strength/format rules are not specified.
- Token expiry duration is not specified.

---

## 7. Group Management Requirements

**Creating a group:** Explicit — a student can create a new group (FR-GROUP-001).

**Adding/inviting members:** Explicit — via student email or ID (FR-GROUP-002).

**Identifying members by email or ID:** Explicit. This implies the Student entity must have a unique, lookup-able email and/or ID field.

**Group membership:** A join relationship between Students and Groups (Group Membership entity — see Section 15).

**Relationship between students and groups:** A student can create a group; students (including the creator) become members through the add/invite action. The assignment does not state whether a student may belong to more than one group, whether every student must belong to a group, or who besides the creator may add members — these are addressed in Section 25 as Open Questions rather than assumed.

**Group progress:** Explicit — students track group progress visually (see Section 10).

**Not invented (per instructions), and flagged as Open Questions in Section 31 where relevant:**
- Maximum group size — not specified.
- Approval workflow for joining a group (e.g., invited student must accept) — not specified; the assignment's wording ("invite/add members") suggests either could apply, but does not confirm an acceptance step.
- Invitation expiration — not specified.
- Automatic removal of members — not specified.
- Group deletion — not specified.
- Group ownership transfer — not specified.

---

## 8. Assignment Management Requirements

**Assignment entity fields (explicit only):** title, description, due date, OneDrive link.

**Create:** Admin creates an assignment with the above fields (FR-ASSIGN-001).

**Edit:** Admin edits an existing assignment (FR-ASSIGN-002).

**View:** Both Admin (FR-ASSIGN-003) and Student (FR-ASSIGN-004) can view assignments, scoped appropriately (Admin sees all; Student sees those visible to them).

**Assign to all students:** Explicit (FR-ASSIGN-005).

**Assign to specific groups:** Explicit (FR-ASSIGN-006).

**Visibility:** A student sees an assignment if it was targeted to "all students," or if it was targeted to a group the student belongs to. This is the minimal logical reading of "assign work to all students or specific groups" combined with "students… view all assignments posted by professors." No further visibility rule (e.g., visibility expiring after due date) is stated — flagged as an Open Question in Sections 24/25.

**Not invented:** whether an assignment can target both "all students" and "specific groups" simultaneously (Open Question, Section 25); whether assignments can be deleted (not mentioned at all, treated as out of scope/not specified).

---

## 9. Submission Confirmation Workflow

The assignment explicitly requires a **two-step** in-app confirmation, distinct from the actual (external) submission of work.

**Step 1:** Student selects "Yes, I have submitted."
**Step 2:** Student confirms the action.
**Result:** The system records a Submission Confirmation for that student and that assignment.

**Who can perform the action:** A Student, for an assignment visible to them, for their own submission (not on behalf of another student — Logical Derivation, since the assignment always refers to the student confirming their own work).

**What constitutes a confirmation:** Completion of both steps. Step 1 alone (selecting "Yes, I have submitted") does not constitute a confirmation; only the follow-up confirmation action (Step 2) causes the system to record it. This models the assignment's explicit requirement for a two-step verification rather than a single click.

**How confirmation is reflected in progress:** Each recorded Submission Confirmation contributes to the visual group progress indicator for that assignment (Section 10) and to Admin monitoring/analytics (Sections 11–12).

**How admins observe confirmation:** Via group-wise and student-wise tracking (FR-ADMIN-001, FR-ADMIN-002) and via analytics (FR-ANALYTICS-001/002).

**External vs. internal distinction (explicit in problem context):**
- **External submission to OneDrive** — the actual upload of work, performed by the student outside the application, using the OneDrive link the Admin shared. The application does not receive, store, or verify the uploaded file.
- **Internal confirmation within the application** — a self-reported, two-step acknowledgment by the student that the external upload has been done. The application only stores this acknowledgment, not the underlying work.

**Open Question / Ambiguity in Source Assignment:**
- Whether a submission confirmation can be reversed/changed once made ("un-confirm" or reconfirm).
- Whether the confirmation is scored/validated in any way against the actual OneDrive content (assignment implies no — it is self-reported).

---

## 10. Group Progress Requirements

**Explicit requirement:** Students track "the group's progress visually using progress bars or completion badges." Progress bars and completion badges are presented as alternative, equally acceptable presentation choices (see Section 30).

**Group-level progress:** Progress is scoped to a group's performance on a given assignment (and, in aggregate, across assignments) — derived from how many of the group's members have a recorded Submission Confirmation for that assignment relative to the group's total membership.

**Relationship between confirmations and visible progress:** Each member confirmation increases the visible completion indicator for the group on that assignment.

**Open Question:** Exact progress calculation formula is not specified in the assignment.

**Optional Implementation Suggestion (not a requirement):** A common, minimal interpretation would be `confirmed_members / total_members` for a given assignment, shown as a percentage or fraction on a progress bar, with a "badge" (e.g., "Complete") once the ratio reaches 100%. This is offered purely as a non-binding implementation suggestion; the developer may choose any presentation consistent with "progress bars or completion badges."

---

## 11. Admin Dashboard Requirements

**Mandatory capabilities (explicit):**
- Group-wise submission monitoring (FR-ADMIN-001).
- Student-wise submission monitoring (FR-ADMIN-002).
- Submission completion analytics (FR-ANALYTICS-001).
- Group performance analytics (FR-ANALYTICS-002).
- Presentation via basic charts or summary counts.

**Overall progress monitoring** is a Logical Derivation of combining group-wise and student-wise tracking with analytics — i.e., the dashboard is the Admin's single place to see assignment-by-assignment and group-by-group status, consistent with the problem context's "unified dashboard."

**Optional / Presentation choices (explicitly allowed by the assignment):**
- Charts **or** summary counts — either satisfies the requirement; both is not mandated.

**Not invented:** drill-down analytics beyond completion/performance, export functionality, filtering/sorting beyond what is needed to view group-wise/student-wise data, scheduled reports.

---

## 12. Analytics Requirements

| Analytics Item | Data Source | Intended Interpretation | User | Expected UI Representation |
|---|---|---|---|---|
| Submission completion analytics | Submission Confirmation records across assignments/students | How much of the required submission work has been confirmed, in aggregate | Admin | Basic chart (e.g., bar/pie) or summary count(s) |
| Group performance analytics | Submission Confirmation records aggregated per group | How each group is doing relative to its assignments | Admin | Basic chart or summary count(s) per group |

**Open Question / Ambiguity in Source Assignment:** The assignment does not define the exact metric behind "group performance" (e.g., percentage of assignments fully confirmed, average member-confirmation rate, on-time vs. late confirmation, etc.), nor the exact chart types required. No advanced BI functionality (drill-downs, custom filters, exports, trend forecasting) is implied and none is introduced.

---

## 13. UI / UX Requirements

**Explicit UI expectations:** user-friendly, responsive, role-based experience, progress bars or completion badges, basic charts or summary counts.

**Required screens** (directly implied by an explicit feature):
- Login screen
- Registration screen (Student)
- Assignment list view (Student)
- Assignment creation/edit view (Admin)
- Assignment list/detail view (Admin)
- Group creation / member management view (Student)
- Group progress view (Student)
- Admin monitoring view (group-wise and student-wise confirmation status)
- Admin analytics view (charts/summary counts)

**Logical screens inferred from a stated feature:**
- Group membership list view (needed to show who is/isn't in a group and who has/hasn't confirmed) — inferred from "add/invite members" and progress tracking.
- Submission confirmation interaction surface (the two-step "Yes, I have submitted" → confirm control), likely presented within the assignment view rather than as a separate page.

No unrelated pages (e.g., messaging, notifications, file manager) are introduced.

---

## 14. Information Architecture

Proposed screen grouping, strictly reflecting the functional scope:

```
Authentication
 ├─ Login
 └─ Register (Student)

Student Experience
 ├─ Assignments
 │   ├─ Assignment List (with OneDrive link access)
 │   └─ Submission Confirmation (two-step control, per assignment)
 └─ My Group
     ├─ Create Group
     ├─ Add/Invite Members
     ├─ Member List
     └─ Group Progress (progress bar / badge)

Admin Experience
 ├─ Assignments
 │   ├─ Create Assignment
 │   ├─ Edit Assignment
 │   └─ Assignment List/Detail (incl. targeting: all students / specific groups)
 └─ Monitoring & Analytics
     ├─ Group-wise Confirmation Status
     ├─ Student-wise Confirmation Status
     └─ Analytics (completion + group performance — charts/summary counts)
```

No screens for notifications, chat, file upload, search, or profile management are included, as none are specified.

---

## 15. Data Model Requirements

| Entity | Purpose | Key Attributes | Relationships | Status |
|---|---|---|---|---|
| **User (Student / Admin)** | Represents any person who authenticates into the system, with a role. | id, email, password (hashed), role (student/admin) | A Student can belong to Group(s); an Admin creates Assignment(s) | id/email/password/role: Logical Derivation from registration+login+JWT roles. A distinguishing "name" field is an Assumption (not explicitly stated, but practically necessary to identify students in UI beyond raw email/ID). |
| **Group** | Represents a student-formed team collaborating on assignments. | id, name/identifier, created_by (creator student), created_at | Has many Students via Group Membership; targeted by Assignment(s) | Explicit that groups exist and are created by students; "name" field and "created_by" are Logical Derivations/Assumptions (see Section 32). |
| **Group Membership** | Join entity linking Students to Groups. | group_id, student_id, joined_at | Belongs to one Group and one Student | Logical Derivation — required to represent "add/invite members." |
| **Assignment** | Represents work posted by an Admin. | id, title, description, due_date, onedrive_link, created_by (admin), created_at, updated_at | Created by one Admin; targeted to All Students or specific Group(s) via Assignment Target; has many Submission Confirmations | Explicit fields per assignment text. |
| **Assignment Target** | Represents which students/groups an assignment is visible to. | assignment_id, target_type (ALL_STUDENTS / GROUP), group_id (nullable, set when target_type = GROUP) | Belongs to one Assignment; optionally references one Group | Logical Derivation — required to implement "assign work to all students or specific groups." |
| **Submission Confirmation** | Represents a student's internal, two-step acknowledgment that they submitted externally. | id, assignment_id, student_id, step1_selected_at, confirmed_at, status | Belongs to one Assignment and one Student | Logical Derivation — required to implement the two-step confirmation and all monitoring/progress/analytics features. |

**Explicitly mentioned data:** Assignment fields (title, description, due date, OneDrive link); Student identification via email or ID; the two confirmation steps.

**Logically necessary data:** User role field; Group Membership join table; Assignment Target relationship; Submission Confirmation record and its timestamps/status.

**Open Questions:** Exact set of registration fields for a Student (only email/ID implied); whether Group has a name field or is otherwise identified in UI; whether a "leader"/"role within group" concept exists for members.

---

## 16. Entity Relationships

- **Users and Groups:** A Student (a User with role=student) can create a Group and can be a member of Group(s) through Group Membership. Cardinality (one student → many groups, or one student → one group) is not defined by the assignment — **Open Question.**
- **Groups and Members:** A Group has many members via Group Membership; a member is a Student. The minimum is one member (the creator).
- **Assignments and Students/Groups:** An Assignment is targeted either to "all students" (no Group Membership needed to determine visibility) or to specific Group(s) (via Assignment Target referencing Group id). Whether an assignment may simultaneously target "all students" and "specific groups" is not stated — **Open Question** (see Section 25).
- **Assignments and Submission Confirmations:** An Assignment has many Submission Confirmations, one potentially per Student who confirms against it.
- **Students and Submission Confirmations:** A Student has many Submission Confirmations, one per Assignment they have confirmed (assuming confirmation is not repeatable per assignment — see Open Question in Section 25 on reconfirmation).

An ER diagram (as required in the README deliverable) should visualize: `User (1)──(M) GroupMembership (M)──(1) Group`; `Group (1)──(M) AssignmentTarget (M)──(1) Assignment`; `User (1)──(M) Assignment [created_by, admin only]`; `User (1)──(M) SubmissionConfirmation (M)──(1) Assignment`.

---

## 17. API Requirements

All endpoints below are PRD-level requirements (purpose and contract shape), not implementation code. All endpoints other than registration/login require a valid JWT; role restrictions are noted.

### 17.1 Authentication

| Method | Endpoint | Purpose | Actor | Request Data | Response Data (conceptual) | Auth |
|---|---|---|---|---|---|---|
| POST | /api/auth/register | Register a new Student account | Student | email/ID, password, (name) | Created user summary | None |
| POST | /api/auth/login | Authenticate and receive a JWT | Student or Admin | email/ID, password | JWT, role, user summary | None |

*(Admin account provisioning endpoint, if any, is an Open Question per Section 6 and is not specified here.)*

### 17.2 Groups

| Method | Endpoint | Purpose | Actor | Request Data | Response Data | Auth |
|---|---|---|---|---|---|---|
| POST | /api/groups | Create a new group | Student | group name/identifier | Created group | Student JWT |
| GET | /api/groups/:id | View a group's details and members | Student (member) | — | Group + member list | Student JWT |
| POST | /api/groups/:id/members | Add/invite a member by email or ID | Student (member) | target student email or ID | Updated member list | Student JWT |
| GET | /api/groups/:id/progress | View group's progress for assignment(s) | Student (member) | assignment_id (optional filter) | Progress indicator data | Student JWT |

### 17.3 Assignments

| Method | Endpoint | Purpose | Actor | Request Data | Response Data | Auth |
|---|---|---|---|---|---|---|
| POST | /api/assignments | Create an assignment | Admin | title, description, due_date, onedrive_link, target (all/groups) | Created assignment | Admin JWT |
| PUT | /api/assignments/:id | Edit an assignment | Admin | any of the above fields | Updated assignment | Admin JWT |
| GET | /api/assignments | List assignments (Admin: all; Student: visible-to-them) | Admin or Student | — | List of assignments | Admin or Student JWT |
| GET | /api/assignments/:id | View a single assignment's details | Admin or Student (if visible) | — | Assignment detail incl. OneDrive link | Admin or Student JWT |

### 17.4 Submission Confirmations

| Method | Endpoint | Purpose | Actor | Request Data | Response Data | Auth |
|---|---|---|---|---|---|---|
| POST | /api/assignments/:id/submission/step1 | Record Step 1 ("Yes, I have submitted") | Student | — | Step-1 acknowledgment state | Student JWT |
| POST | /api/assignments/:id/submission/confirm | Record Step 2 (final confirmation) | Student | — | Confirmed Submission Confirmation | Student JWT |
| GET | /api/assignments/:id/submission | View own confirmation status for an assignment | Student | — | Confirmation status | Student JWT |

### 17.5 Admin Monitoring

| Method | Endpoint | Purpose | Actor | Request Data | Response Data | Auth |
|---|---|---|---|---|---|---|
| GET | /api/admin/assignments/:id/groups | Group-wise confirmation status for an assignment | Admin | — | Per-group confirmed/unconfirmed breakdown | Admin JWT |
| GET | /api/admin/assignments/:id/students | Student-wise confirmation status for an assignment | Admin | — | Per-student confirmation status | Admin JWT |

### 17.6 Analytics

| Method | Endpoint | Purpose | Actor | Request Data | Response Data | Auth |
|---|---|---|---|---|---|---|
| GET | /api/admin/analytics/completion | Submission completion analytics | Admin | optional assignment_id filter | Aggregate completion counts/percentages | Admin JWT |
| GET | /api/admin/analytics/group-performance | Group performance analytics | Admin | optional assignment_id filter | Per-group performance figures | Admin JWT |

No endpoints for file upload, notifications, chat, search, or password reset are included, as none are specified.

---

## 18. Frontend Requirements (React.js + Tailwind CSS)

- **Role-based routing/access:** Routes/views differ for Student vs. Admin; unauthorized routes are inaccessible based on the JWT role.
- **Authentication flow:** Login screen (Student and Admin); Registration screen (Student, per explicit requirement).
- **Student workflows:** Create group, add/invite members, view members, view assignments, open OneDrive link, two-step submission confirmation, view group progress.
- **Admin workflows:** Create/edit/view assignments, target assignments (all students / specific groups), view group-wise and student-wise confirmation tracking, view analytics.
- **Assignment interfaces:** Forms for create/edit (title, description, due date, OneDrive link, target); list/detail views.
- **Group interfaces:** Group creation form; add-member-by-email-or-ID form; member list.
- **Submission confirmation interaction:** Two-step UI control ("Yes, I have submitted" → confirm), reflecting the explicit two-step requirement.
- **Progress visualization:** Progress bar or completion badge component per group/assignment.
- **Analytics visualization:** Basic chart component(s) or summary-count display for Admin.
- **Responsive layout:** UI must work across common screen sizes, per "user-friendly, responsive interface."
- **Tailwind CSS usage:** All styling implemented with Tailwind CSS, per the specified stack.

No additional frontend libraries (e.g., specific chart libraries, state-management frameworks) are named in the assignment; choice of any such supporting library is an implementation detail left to the developer, not a PRD requirement.

---

## 19. Backend Requirements (Node.js + Express)

- **API layer:** Express-based REST API implementing all endpoints in Section 17.
- **Authentication:** Registration and login endpoints; password handling (hashing, conceptually — not specifying an algorithm since none is stated).
- **JWT:** Issuance on login; verification middleware for protected routes.
- **Role-based authorization:** Middleware distinguishing Student vs. Admin permissions per endpoint, matching Section 4's permission matrix.
- **Group management:** CRUD-appropriate operations for group creation and membership per FR-GROUP-*.
- **Assignment management:** CRUD-appropriate operations for assignment create/edit/view and targeting per FR-ASSIGN-*.
- **Submission confirmations:** Endpoints and logic for the two-step confirmation flow per FR-SUBMIT-002.
- **Monitoring:** Aggregation logic for group-wise/student-wise confirmation status (FR-ADMIN-001/002).
- **Analytics:** Aggregation logic for completion and group-performance figures (FR-ANALYTICS-001/002).
- **PostgreSQL integration:** Backend persists and queries all entities in Section 15 via PostgreSQL.

---

## 20. Database Requirements (PostgreSQL)

PostgreSQL is the system of record for all persistent data: Users (Students/Admins), Groups, Group Memberships, Assignments, Assignment Targets, and Submission Confirmations.

Because the assignment explicitly states the task "evaluates the ability to... manage data relationships," the schema must clearly express:
- One-to-many: Admin → Assignments (creator).
- Many-to-many: Students ↔ Groups (via Group Membership).
- One-to-many / conditional one-to-one-per-group: Assignment → Assignment Target(s) → Group(s).
- One-to-many: Assignment → Submission Confirmations; Student → Submission Confirmations.

Referential integrity (foreign keys) should be enforced between these entities so that, e.g., a Submission Confirmation cannot exist without a valid Assignment and Student, and a Group Membership cannot exist without a valid Group and Student.

**No ORM is mandated** — the assignment does not specify one, so the choice of raw SQL, a query builder, or an ORM is an implementation detail, not a requirement.

---

## 21. Docker Requirements

The assignment's explicit technical requirement lists Docker as part of the stack. Accordingly:
- The application (frontend, backend, and database) must be containerized.
- Setup for frontend, backend, and PostgreSQL should be reproducible via Docker where appropriate, supporting the "Setup & run instructions" required in the README.

No production infrastructure, container orchestration (e.g., Kubernetes), CI/CD pipeline, or multi-environment deployment topology is specified, so none is required here.

---

## 22. Security Requirements

Directly justified by the assignment's explicit call to "build secure APIs" and its JWT/Student-Admin role requirement:
- **Authentication:** All non-registration/login endpoints require a valid JWT.
- **Authorization:** Endpoints enforce role checks matching Section 4 (e.g., only Admin can create/edit assignments; only Student can create groups, add members, or confirm submissions; only the confirming student can submit their own confirmation).
- **Protection of role-specific APIs:** Admin-only and Student-only endpoints reject requests from the wrong role or an unauthenticated caller.
- **Secure handling of passwords (conceptual):** Passwords are not stored or transmitted in plain text; hashed at rest.
- **Validation of protected operations:** Input validation on create/edit operations (e.g., required Assignment fields; valid email/ID format for adding a member) to prevent malformed or unauthorized state changes.

**Not invented:** a named security standard/compliance framework, a specific encryption algorithm, penetration-testing requirements, or a formal threat model — none of these are stated in the assignment.

---

## 23. Non-Functional Requirements

| NFR | Basis in Assignment |
|---|---|
| Responsive UI | Explicit ("user-friendly, responsive interface"). |
| User-friendly | Explicit. |
| Secure APIs | Explicit ("build secure APIs"). |
| Modular codebase | Explicit ("modular systems," "clean, modular codebase"). |
| Documented / easy to understand | Explicit ("well-documented and easy to understand," README requirements). |
| Working demo | Explicit deliverable. |
| Clear commit history | Explicit deliverable requirement. |

**Not invented:** uptime/SLA targets, specific response-time budgets, scalability targets, load-testing requirements, a named accessibility compliance level. Where such qualities matter to an implementer, they should be treated as Open Questions rather than requirements (see Section 31).

---

## 24. Error and Edge Cases

| Edge Case | Handling Explicitly Required? | Notes |
|---|---|---|
| Invalid login | Logical Derivation — implied by "log in" needing valid-credential handling | Reject with an error; no specific message format specified. |
| Accessing role-restricted functionality without permission | Logical Derivation — implied by "secure APIs" and role-based auth | Request should be rejected (e.g., unauthorized); exact status code/UX not specified — **Open Question.** |
| Student adding a nonexistent student (no matching email/ID) | Logical Derivation — implied by identifying members "via student email or ID" | Add action should fail with an error; exact message not specified — **Open Question.** |
| Duplicate group membership (adding an existing member again) | Logical Derivation | Should not create a duplicate entry; exact UX (silent no-op vs. error) not specified — **Open Question.** |
| Assignment not available to a student/group (student outside target scope viewing/opening it) | Logical Derivation from targeting logic | Assignment should not be visible/accessible to non-targeted students — **Open Question** on exact enforcement (hidden from list vs. blocked on direct access). |
| Repeated submission confirmation (confirming twice) | Not defined | **Open Question** — assignment does not state whether reconfirmation is allowed, blocked, or simply idempotent. |

No additional edge cases (e.g., payment failures, file-upload errors) are introduced, since the corresponding features do not exist in this system.

---

## 25. Business Rules

### Explicit Business Rules
- Students can create groups and add/invite members via email or ID.
- Admins can target assignments to all students or to specific groups.
- Submission confirmation requires two steps.
- Submission to OneDrive happens outside the application; the application only records confirmation.

### Derived Rules
- A student can only confirm submission for themselves (not on behalf of another student).
- An assignment is visible to a student if it targets "all students" or targets a group the student belongs to.
- A group's progress is computed from its members' Submission Confirmations for a given assignment.
- Only Admins can create/edit assignments; only Students can create groups, add members, and confirm submissions.

### Open Questions
- Whether a student may belong to multiple groups.
- Whether all students must belong to a group before assignments are usable to them.
- Whether a group can be edited (e.g., renamed, members removed) after creation.
- Whether an assignment can target both "all students" and "specific groups" simultaneously.
- What exactly defines "group performance" for analytics purposes.
- How the progress percentage/badge threshold is calculated.
- Whether submissions can be reconfirmed or un-confirmed.
- Whether assignments remain visible to students after their due date has passed.

---

## 26. End-to-End User Workflows

#### Student Registration/Login
- **Trigger:** New student wants access to the system.
- **Preconditions:** None (registration) / account exists (login).
- **Steps:** Submit registration details → account created → submit login credentials → JWT issued.
- **Result:** Authenticated Student session.
- **Role:** Student.

#### Student Group Creation
- **Trigger:** Student wants to start a group.
- **Preconditions:** Student is authenticated.
- **Steps:** Open group creation → submit group details → group created with student as member.
- **Result:** New Group exists.
- **Role:** Student.

#### Student Adding Members
- **Trigger:** Student wants to grow their group.
- **Preconditions:** Student belongs to a group.
- **Steps:** Enter target student's email or ID → system matches an existing student → student added to group.
- **Result:** Group membership updated.
- **Role:** Student.

#### Student Viewing Assignments
- **Trigger:** Student wants to see posted work.
- **Preconditions:** Student is authenticated.
- **Steps:** Open assignments view → system lists assignments visible to the student (targeted to all students or to their group(s)).
- **Result:** Assignment list displayed.
- **Role:** Student.

#### Student Opening OneDrive Submission Link
- **Trigger:** Student wants to upload work.
- **Preconditions:** Assignment visible to student.
- **Steps:** Select assignment → select OneDrive link → link opens/becomes accessible.
- **Result:** Student uploads work externally (outside the application).
- **Role:** Student.

#### Student Submission Confirmation
- **Trigger:** Student has finished the external upload.
- **Preconditions:** Assignment visible to student.
- **Steps:** Select "Yes, I have submitted" (Step 1) → confirm the action (Step 2) → system records Submission Confirmation.
- **Result:** Confirmation recorded; reflected in group progress and admin views.
- **Role:** Student.

#### Student Viewing Group Progress
- **Trigger:** Student wants to check the group's status.
- **Preconditions:** Student belongs to a group.
- **Steps:** Open group progress view → system computes and displays progress (bar/badge) from member confirmations.
- **Result:** Progress indicator displayed.
- **Role:** Student.

#### Professor/Admin Login
- **Trigger:** Admin wants access.
- **Preconditions:** Admin account exists.
- **Steps:** Submit credentials → JWT issued with Admin role.
- **Result:** Authenticated Admin session.
- **Role:** Admin.

#### Professor Creating Assignment
- **Trigger:** Admin wants to post new work.
- **Preconditions:** Admin authenticated.
- **Steps:** Enter title/description/due date/OneDrive link → choose target (all students/specific groups) → submit → assignment created.
- **Result:** New Assignment exists and becomes visible to targeted students.
- **Role:** Admin.

#### Professor Editing Assignment
- **Trigger:** Admin needs to update assignment details.
- **Preconditions:** Assignment exists.
- **Steps:** Open assignment → edit fields → save.
- **Result:** Assignment updated.
- **Role:** Admin.

#### Professor Assigning Work
- **Trigger:** Admin wants to define who sees an assignment.
- **Preconditions:** Assignment exists or is being created.
- **Steps:** Choose "all students" or select specific group(s) → save targeting.
- **Result:** Assignment visibility scoped accordingly.
- **Role:** Admin.

#### Professor Monitoring Submission Status
- **Trigger:** Admin wants to check progress.
- **Preconditions:** Assignment(s) and confirmations exist.
- **Steps:** Open monitoring view → view group-wise and/or student-wise confirmation status.
- **Result:** Confirmation status displayed.
- **Role:** Admin.

#### Professor Viewing Analytics
- **Trigger:** Admin wants an aggregate view.
- **Preconditions:** Confirmation data exists.
- **Steps:** Open analytics view → view completion and group-performance charts/summary counts.
- **Result:** Analytics displayed.
- **Role:** Admin.

---

## 27. Acceptance Criteria

**AC-AUTH-001**
Given a new student submits valid registration details, when the registration request is processed, then a Student account is created.

**AC-AUTH-002**
Given a registered student submits correct credentials, when they log in, then a JWT with the Student role is issued.

**AC-AUTH-003**
Given an Admin submits correct credentials, when they log in, then a JWT with the Admin role is issued.

**AC-AUTH-004**
Given an unauthenticated request to a protected endpoint, when the request is made, then it is rejected.

**AC-STUDENT-001**
Given a logged-in student, when they view assignments, then only assignments visible to them (all-students or their group's targeted assignments) are shown.

**AC-GROUP-001**
Given a logged-in student, when they create a group, then the group is created with the student as its first member.

**AC-GROUP-002**
Given an existing group and a valid target student email or ID, when a member adds that student, then the target student appears in the group's member list.

**AC-GROUP-003**
Given an invalid (non-existent) student email or ID, when a member attempts to add them, then the add action fails.

**AC-ASSIGN-001**
Given valid title, description, due date, and OneDrive link, when an Admin creates an assignment, then the assignment is stored and retrievable.

**AC-ASSIGN-002**
Given an existing assignment, when an Admin edits any of its fields and saves, then the updated values are persisted.

**AC-ASSIGN-003**
Given an assignment targeted to "all students," when any student views assignments, then it appears in their list.

**AC-ASSIGN-004**
Given an assignment targeted to Group X only, when a member of Group X views assignments, then it appears; when a non-member views assignments, it does not appear.

**AC-SUBMIT-001**
Given a student selects "Yes, I have submitted" and then confirms, when both steps complete, then a Submission Confirmation is recorded for that student and assignment.

**AC-SUBMIT-002**
Given a student has only completed Step 1 without confirming Step 2, when the process is checked, then no Submission Confirmation is recorded.

**AC-PROGRESS-001**
Given a group with confirmed and unconfirmed members for an assignment, when a member views group progress, then a progress bar or completion badge reflects that state.

**AC-ADMIN-001**
Given confirmations exist across groups, when an Admin views group-wise tracking, then each group's confirmed/unconfirmed breakdown is shown.

**AC-ADMIN-002**
Given confirmations exist across students, when an Admin views student-wise tracking, then each student's confirmation status is shown.

**AC-ANALYTICS-001**
Given confirmation data exists, when an Admin views the analytics screen, then submission completion figures are displayed via chart(s) or summary counts.

**AC-ANALYTICS-002**
Given confirmation data exists per group, when an Admin views the analytics screen, then group performance figures are displayed via chart(s) or summary counts.

**AC-STACK-001**
Given the technical requirements, when the codebase is reviewed, then the frontend uses React.js + Tailwind CSS and the backend uses Node.js + Express + PostgreSQL.

**AC-DOCKER-001**
Given the Docker requirement, when the project is run via its Docker setup, then the application (frontend, backend, database) starts as containerized services.

**AC-REPO-001**
Given the GitHub repository, when it is reviewed, then it has separate folders for frontend and backend, a clean/modular structure, and a clear commit history.

**AC-DOC-001**
Given the README.md, when it is reviewed, then it contains an implementation overview, setup/run instructions, API endpoint details, DB schema/relationships (ER diagram preferred), architecture overview, and key design/deployment decisions.

**AC-DEMO-001**
Given the submission, when the required PDF is reviewed, then it contains a GitHub repository link and a working demo video link (platform link optional), with a filename in the FullName-TaskNo.pdf convention.

---

## 28. Definition of Done

- [ ] All explicit Student-role features implemented: registration, login, group creation, member add/invite (email or ID), assignment viewing, OneDrive link access, two-step submission confirmation, group progress visualization.
- [ ] All explicit Admin-role features implemented: assignment create/edit/view, targeting (all students / specific groups), group-wise and student-wise confirmation tracking, submission completion and group performance analytics.
- [ ] JWT-based authentication implemented for Student and Admin roles.
- [ ] Role-based authorization enforced across all protected endpoints.
- [ ] PostgreSQL schema implemented with the relationships described in Section 16, with referential integrity.
- [ ] Frontend (React + Tailwind) and backend (Node.js + Express) are separated into distinct folders.
- [ ] Docker setup runs frontend, backend, and database.
- [ ] Repository is clean, modular, with a clear commit history.
- [ ] README.md documentation is complete per Section 27's AC-DOC-001.
- [ ] ER diagram included or prepared for the technical interview.
- [ ] Working demo available; demo video recorded.
- [ ] Submission PDF prepared with the required links and correct filename convention, submitted via the provided form before the deadline (Thursday, 17 September 2026, 11:30 PM).

---

## 29. Deliverables Traceability Matrix

| Assignment Requirement | PRD Requirement(s) | Implementation Area | Verification |
|---|---|---|---|
| Students register and log in | FR-AUTH-001, FR-AUTH-002 | Backend auth, Frontend auth screens | AC-AUTH-001, AC-AUTH-002 |
| Students create a group and add/invite members via email or ID | FR-GROUP-001, FR-GROUP-002, FR-GROUP-003 | Backend group API, Frontend group screens | AC-GROUP-001, AC-GROUP-002, AC-GROUP-003 |
| Students view all assignments posted by professors | FR-ASSIGN-004 | Backend assignment API, Frontend assignment list | AC-STUDENT-001 |
| Students access OneDrive links per assignment | FR-SUBMIT-001 | Frontend assignment detail | Manual/UI verification |
| Students confirm submission via two-step verification | FR-SUBMIT-002 | Backend submission API, Frontend confirmation control | AC-SUBMIT-001, AC-SUBMIT-002 |
| Students track group progress (bars/badges) | FR-PROGRESS-001 | Backend progress aggregation, Frontend progress component | AC-PROGRESS-001 |
| Admin creates, edits, views assignments (title, description, due date, OneDrive link) | FR-ASSIGN-001, FR-ASSIGN-002, FR-ASSIGN-003 | Backend assignment API, Frontend admin assignment screens | AC-ASSIGN-001, AC-ASSIGN-002 |
| Admin assigns work to all students or specific groups | FR-ASSIGN-005, FR-ASSIGN-006 | Backend targeting logic, Frontend targeting UI | AC-ASSIGN-003, AC-ASSIGN-004 |
| Admin tracks group-wise and student-wise confirmations | FR-ADMIN-001, FR-ADMIN-002 | Backend monitoring API, Frontend monitoring screens | AC-ADMIN-001, AC-ADMIN-002 |
| Admin views analytics (completion, group performance, charts/counts) | FR-ANALYTICS-001, FR-ANALYTICS-002 | Backend analytics API, Frontend analytics screens | AC-ANALYTICS-001, AC-ANALYTICS-002 |
| Stack: React + Tailwind, Node + Express + PostgreSQL, Docker, HTML | Sections 18–21 | Full stack | AC-STACK-001, AC-DOCKER-001 |
| JWT authentication, Student/Admin roles | Section 6, FR-AUTH-* | Backend auth/authorization | AC-AUTH-002, AC-AUTH-003, AC-AUTH-004 |
| GitHub repo: modular, separate frontend/backend folders, clear commit history | Section 28 | Repository structure | AC-REPO-001 |
| Working demo | Section 34 | Deployed/runnable app | AC-DEMO-001 |
| README.md: overview, setup, API details, DB schema/ER diagram, architecture, design/deployment decisions | Section 20, Section 16 | Documentation | AC-DOC-001 |
| Technical interview: explain design, architecture, deployment | Section 35 | N/A (interview) | N/A |
| Submission PDF: GitHub link, demo video link, platform link (optional), filename convention, deadline | Section 27 | Submission process | AC-DEMO-001 |

Every explicit bullet from the assignment is represented above; none is omitted.

---

## 30. Scope Boundaries

### In Scope
- Student registration and login.
- Group creation and member management (add/invite via email or ID).
- Assignment creation, editing, viewing by Admin.
- Assignment targeting (all students or specific groups).
- Student viewing of assignments and OneDrive links.
- Two-step submission confirmation.
- Group progress visualization.
- Admin group-wise and student-wise confirmation tracking.
- Admin analytics on completion and group performance.
- JWT authentication with Student/Admin roles.
- React + Tailwind frontend; Node + Express + PostgreSQL backend; Docker containerization.
- GitHub repository, README documentation, working demo.

### Optional / Presentation Choice
- Progress bars **or** completion badges (either satisfies the requirement).
- Basic charts **or** summary counts (either satisfies the requirement).
- Platform link in the submission PDF is optional.

### Out of Scope / Not Specified
The following are not part of the provided specification (not mentioned in the assignment at all): notifications/email, real-time chat, in-app file upload or storage, OneDrive API integration (only a shared link is required), search functionality, password-reset flow, profile management beyond what registration/login imply, social login, multi-factor authentication, grading/scoring of submissions, assignment deletion, group deletion, admin self-service registration UI (mechanism unspecified — see Section 6/31).

---

## 31. Open Questions and Ambiguities

1. How an Admin account is created/provisioned (no explicit Admin registration flow is stated).
2. Maximum group size, if any.
3. Exact invitation mechanism for adding a member — immediate add vs. an accept/invite-pending step.
4. Whether a student can belong to multiple groups simultaneously.
5. Whether every student must belong to a group before assignments become meaningfully usable.
6. Whether a group can be edited or its members removed after creation.
7. Whether an assignment can target both "all students" and "specific groups" at once.
8. Exact formula for group progress (percentage, badge threshold, etc.).
9. Exact definition/metric for "group performance" in analytics.
10. Exact chart types or summary-count formats expected in analytics.
11. Whether a submission confirmation can be changed/reversed once made.
12. Whether assignments remain visible to students after their due date passes.
13. Exact API request/response payload contracts (only conceptual shapes are defined here).
14. Deployment platform/target environment (only Docker containerization is specified; no hosting platform is named).
15. Token expiration policy and whether refresh tokens are used.
16. Exact registration field set for a Student beyond email/ID and password.

---

## 32. Assumptions

| Assumption | Why Needed | Impact | Not Explicitly Specified By Joineazy |
|---|---|---|---|
| A Student record includes a display name in addition to email/ID | Email/ID alone were the only fields explicitly tied to member lookup; a name improves usability in group/assignment/monitoring UIs | Adds one attribute to the User entity; does not add a feature | Yes |
| A Group has a name/identifier field | The assignment says students "create a new group" without naming a field; some identifier is needed to distinguish groups in UI | Adds one attribute to the Group entity | Yes |
| The group creator is automatically the first member of the group | The assignment does not explicitly state this, but a group with zero members would be unusable | Establishes initial Group Membership on creation | Yes |
| Only existing group members can add new members to that group | The assignment does not state who is authorized to add members within a group | Restricts FR-GROUP-002 to current members rather than any student | Yes |
| A student confirms only their own submission, not on behalf of others | The assignment always frames confirmation as the student's own action | Confirms FR-SUBMIT-002's actor scope | Yes (implied but not stated verbatim) |
| An assignment is visible to a student if targeted to "all students" or to a group the student belongs to | The assignment does not state the exact visibility rule, only that targeting exists | Defines FR-ASSIGN-004's filtering logic | Yes |

Kept minimal, per instructions — only assumptions genuinely necessary to make the PRD implementable are included.

---

## 33. Implementation Priority

### Must Have
- Student registration/login; Admin login.
- JWT authentication with role-based authorization.
- Group creation and member add/invite (email or ID).
- Assignment create/edit/view (title, description, due date, OneDrive link).
- Assignment targeting (all students / specific groups).
- Student assignment viewing and OneDrive link access.
- Two-step submission confirmation.
- Group progress visualization.
- Admin group-wise and student-wise confirmation tracking.
- Admin analytics (completion, group performance).
- PostgreSQL schema with required relationships.
- Docker containerization.
- GitHub repository with separated frontend/backend and clear history.
- README documentation (overview, setup, API details, DB schema/ER diagram, architecture, design/deployment decisions).
- Working demo and demo video.

### Should Have
- Clean error handling/validation for the edge cases in Section 24 where behavior is a logical derivation (e.g., invalid login, unauthorized access, invalid member email/ID, duplicate membership).
- Clear, responsive UI polish across Student and Admin screens.

### Optional
- Choice of progress bars vs. completion badges (either is acceptable).
- Choice of charts vs. summary counts for analytics (either is acceptable).
- Platform link in the submission PDF (explicitly optional).

---

## 34. Suggested Demonstration Flow

1. Student registration/login.
2. Group creation and member management (add a member by email/ID).
3. Assignment viewing (as Student).
4. OneDrive link access (open the shared link).
5. Two-step submission confirmation ("Yes, I have submitted" → confirm).
6. Group progress display (bar/badge update after confirmation).
7. Admin login.
8. Assignment creation and editing.
9. Assignment targeting (all students vs. specific group).
10. Submission monitoring (group-wise and student-wise views).
11. Analytics (completion and group performance).
12. Responsive behavior demonstration where practical (e.g., resizing/viewing on a smaller screen).

No demonstration steps outside this explicit functional scope are included.

---

## 35. Technical Interview Discussion Points

- Why JWT authentication was chosen/used, and how it fulfills the "secure APIs" requirement.
- How Student/Admin role separation is implemented (middleware, route guards).
- How database relationships were modeled (Users, Groups, Group Membership, Assignments, Assignment Targets, Submission Confirmations) and why.
- How assignment targeting (all students vs. specific groups) works end-to-end.
- How submission confirmation is represented internally, and how it is kept distinct from the external OneDrive upload.
- How group progress is calculated from confirmation data, and what assumptions were made given the assignment's silence on the exact formula.
- How the frontend and backend communicate (REST API over JWT-authenticated requests).
- Why Docker is included and how it supports reproducible setup for frontend, backend, and database.
- Key design and deployment decisions made where the assignment was ambiguous, and the reasoning behind them.

---

## 36. Requirements Traceability

| Assignment Bullet | Status | Mapped PRD Section(s) |
|---|---|---|
| Design and develop a role-based full-stack web application | Covered | Sections 2, 4, 6 |
| Students form their own groups, manage members | Covered | Section 7, FR-GROUP-* |
| Students confirm assignment submissions | Covered | Section 9, FR-SUBMIT-* |
| Professors manage assignments and track group progress | Covered | Sections 8, 10, 11 |
| Professors (Admins) post assignments and share OneDrive submission links | Covered | Section 8, FR-ASSIGN-001 |
| Students form groups, add group members, confirm submission after external upload | Covered | Sections 7, 9 |
| Professors monitor group submission status and progress via unified dashboard | Covered | Section 11 |
| Student: Register and log in | Covered | FR-AUTH-001, FR-AUTH-002 |
| Student: Create group and invite/add members via email or ID | Covered | FR-GROUP-001, FR-GROUP-002 |
| Student: View all assignments posted by professors | Covered | FR-ASSIGN-004 |
| Student: Access OneDrive submission links | Covered | FR-SUBMIT-001 |
| Student: Confirm submission via two-step verification | Covered | FR-SUBMIT-002 |
| Student: Track group progress visually (bars/badges) | Covered | FR-PROGRESS-001 |
| Admin: Create, edit, view assignments (title, description, due date, OneDrive link) | Covered | FR-ASSIGN-001/002/003 |
| Admin: Assign work to all students or specific groups | Covered | FR-ASSIGN-005/006 |
| Admin: Track group-wise and student-wise submission confirmations | Covered | FR-ADMIN-001/002 |
| Admin: View analytics on submission completion and group performance | Covered | FR-ANALYTICS-001/002 |
| Stack: React.js + Tailwind CSS, Node.js + Express + PostgreSQL, Docker, HTML | Covered | Sections 18–21 |
| Authentication: JWT-based (Student/Admin roles) | Covered | Section 6 |
| GitHub Repository: clean, modular, separate frontend/backend folders, clear commit history | Covered | Sections 28, 29 |
| Working Demo | Covered | Sections 28, 34 |
| Documentation (README.md): overview, setup, API details, DB schema/ER diagram, architecture, design/deployment decisions | Covered | Sections 20, 27, 28 |
| Technical Interview: demo project, explain design/architecture/deployment | Covered | Section 35 |
| Submission format: PDF with GitHub link, demo video link, platform link (optional) | Covered | Sections 27, 28 |
| Filename convention: FullName-TaskNo.pdf | Covered | Section 28 |
| Submission deadline: Thursday, 17 September 2026, 11:30 PM | Covered | Section 28 |
| Group size limits | Ambiguous | Sections 7, 31 |
| Multiple group membership per student | Ambiguous | Sections 25, 31 |
| Exact progress calculation | Ambiguous | Section 10 |
| Exact "group performance" metric | Ambiguous | Section 12 |
| Progress bars vs. completion badges | Optional | Section 30 |
| Basic charts vs. summary counts | Optional | Section 30 |
| Platform link in submission PDF | Optional | Section 30 |

No bullet from the source assignment has been omitted.

---

*End of PRD.*
