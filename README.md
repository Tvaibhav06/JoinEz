# JoinEz — Student, Group, Course & Assignment Management System
## Round 2 Enhancement (Joineazy Full Stack Internship)

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-41%20Passed-brightgreen.svg)]()

A robust, role-based academic platform built for **Joineazy Round 2**, extending the Task 1 system with **Course Data Relationships**, **Individual vs Group Assignment Types**, **Group-Leader-Only Acknowledgment**, **Professor Course Dashboard Analytics**, **Server-Side Status Filtering**, **Auth UX Polish**, and **Multi-Platform Cloud Deployment** specifications.

---

## Table of Contents

1. [Round 2 Overview & Enhancements](#1-round-2-overview--enhancements)
2. [UI/UX Design Decisions & Rationale](#2-uiux-design-decisions--rationale)
3. [Visual UI Showcase & Screenshots](#3-visual-ui-showcase--screenshots)
4. [System Architecture](#4-system-architecture)
5. [Database Schema & ER Diagram](#5-database-schema--er-diagram)
6. [Round 2 Core Workflows](#6-round-2-core-workflows)
   - [Course Layer & Student Enrollment](#course-layer--student-enrollment)
   - [Individual vs Group Submission Logic](#individual-vs-group-submission-logic)
   - [Leader-Only Group Acknowledgment](#leader-only-group-acknowledgment)
   - [Server-Side Status Filtering](#server-side-status-filtering)
7. [API Specification](#7-api-specification)
8. [Demo Credentials](#8-demo-credentials)
9. [Local Development & Setup](#9-local-development--setup)
10. [Docker Setup](#10-docker-setup)
11. [Automated Testing](#11-automated-testing)
12. [Deployment Guide (Render / Vercel / Netlify)](#12-deployment-guide)
13. [Verification Report](#13-verification-report)
14. [Known Limitations](#14-known-limitations)

---

## 1. Round 2 Overview & Enhancements

Building directly on top of Task 1's baseline, Round 2 introduces the following major capabilities:

| Feature Area | Task 1 Baseline | Round 2 Enhancement |
| :--- | :--- | :--- |
| **Courses Layer** | No courses concept; flat assignment list. | Dedicated `courses` and `course_enrollments` tables; course-scoped student and professor dashboards. |
| **Assignment Types** | Implicitly all individual acknowledgments. | Explicit `submission_type` (`INDIVIDUAL` vs `GROUP`) stored per assignment. |
| **Group Submissions** | Every student had to confirm individually. | **Leader-Only Acknowledgment**: Only designated group leader can confirm; transactionally marks submission for all group members with `confirmed_by_leader_id`. Non-leaders are rejected (403 Forbidden). |
| **Student Dashboard** | Simple assignment & group overview. | Redesigned with responsive **Enrolled Course Cards** clickable to `/student/courses/:courseId/assignments`. |
| **Professor Dashboard** | Generic counts. | Dedicated **Courses Taught Dashboard** with live PostgreSQL analytics (enrolled student count, submitted count, pending count, submission rate). |
| **Monitoring Filters** | Client-side search only. | **Server-Side Status Filtering**: `?status=SUBMITTED` and `?status=PENDING` implemented directly in SQL. |
| **Authentication UX** | Basic forms. | Real-time inline field validation, loading spinners, role-based redirects, and quick demo logins. |
| **Database Migrations** | Initial schema only. | Migration runner (`002_round2_courses_and_groups.sql`) with backwards-compatible legacy assignment backfill. |

---

## 2. UI/UX Design Decisions & Rationale

1. **Course-Centric Hierarchy (`StudentDashboard.jsx` & `CourseAssignments.jsx`)**:
   - *Rationale*: Real university portals organize student workflows around enrolled courses. Students view responsive course cards with instructor details and assignment counts, clicking through to course-scoped assignments at `/student/courses/:courseId/assignments`.
2. **Clear Submission Type Distinction**:
   - *Rationale*: Individual and Group coursework have fundamentally different responsibilities. We implemented distinctive color tokens:
     - **Individual**: Blue badge (`UserCheck`), "Acknowledge Submission" button.
     - **Group**: Purple badge (`Users`), "Submit as Group Leader" button (`Crown`).
3. **Leader-Only Role Feedback**:
   - *Rationale*: Non-leader students must not be confused about why they cannot click submit. The UI renders a dedicated notice: *"Only your group leader ([Leader Name]) can confirm this submission on behalf of the group."* If the student is the leader, a golden crown badge and prominent action button are presented.
4. **Instant Inline Validation on Auth**:
   - *Rationale*: Instant regex validation for email and length validation for password prevents failed round-trips to the server and provides immediate user confidence.
5. **Segmented Status Filters in Professor Monitoring**:
   - *Rationale*: Professors managing large cohorts need fast access to pending students. Server-side buttons (`All`, `Submitted`, `Pending`) make auditing missing submissions instant.

---

## 3. Visual UI Showcase & Screenshots

### Student Portal: Enrolled Courses & Team Overview
Students view their active team membership and an enrolled course catalog with instructor details and live completion indicators:
![Student Dashboard](docs/screenshots/student_dashboard.png)

### Course Assignments & Group Leader Acknowledgment
Course-scoped coursework displays distinct badges for **Individual** vs **Group** assignments. Only the designated team leader is authorized to submit for the entire team:
![Course Assignments](docs/screenshots/course_assignments.png)

### External OneDrive Submission Modal (Step 1 & Step 2)
The two-step submission protocol provides direct access to external OneDrive coursework folders and gives explicit leader-only confirmation guidance:
![Submission Modal](docs/screenshots/submission_modal_step1.png)

### Professor Dashboard: Courses Taught & Live Analytics
Faculty members inspect their taught course rosters with real-time PostgreSQL analytics (student count, submitted/pending count, and submission rates):
![Professor Dashboard](docs/screenshots/professor_dashboard.png)

### Submission Monitoring with Server-Side Status Filtering
Professors can filter submissions in real-time by status (`ALL`, `SUBMITTED`, `PENDING`), backed directly by SQL query parameters:
![Submission Monitoring](docs/screenshots/monitoring_status_filter.png)

### Performance & Completion Analytics
Global statistics and group performance rankings computed dynamically from PostgreSQL data:
![Admin Analytics](docs/screenshots/admin_analytics.png)

---

## 4. System Architecture

```text
                                +---------------------------+
                                |    React 18 + Vite SPA    |
                                | (Tailwind CSS, Lucide UI) |
                                +-------------+-------------+
                                              |
                                     HTTP / REST (JWT)
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
|                               Express.js REST Backend Layer                             |
|                                                                                         |
|  [Auth Routes]     [Course Routes]     [Group Routes]     [Assign Routes]    [Admin]     |
|         |                 |                   |                  |              |       |
|  [Auth Service]   [Course Service]    [Group Service]    [Assign/Submit]  [Admin Serv]  |
+---------------------------------------------+-------------------------------------------+
                                              |
                                     pg Pool (SSL Ready)
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
|                                   PostgreSQL Database                                   |
|                                                                                         |
|  • users                  • courses                     • course_enrollments            |
|  • groups (leader_id)     • group_members               • assignments (course_id, type) |
|  • assignment_targets     • submission_confirmations (confirmed_by_leader_id)           |
+-----------------------------------------------------------------------------------------+
```

---

## 5. Database Schema & ER Diagram

```mermaid
erDiagram
    users ||--o{ courses : "teaches (as professor)"
    users ||--o{ course_enrollments : "enrolls in"
    courses ||--o{ course_enrollments : "has enrolled students"
    courses ||--o{ assignments : "contains"
    users ||--o{ groups : "creates"
    users ||--o{ groups : "leads (as leader_id)"
    groups ||--o{ group_members : "contains"
    users ||--o{ group_members : "belongs to (single group)"
    users ||--o{ assignments : "creates (as admin)"
    assignments ||--o{ assignment_targets : "targets"
    groups ||--o{ assignment_targets : "targeted by"
    assignments ||--o{ submission_confirmations : "receives"
    users ||--o{ submission_confirmations : "confirms (student_id)"
    users ||--o{ submission_confirmations : "leader who confirmed (confirmed_by_leader_id)"

    users {
        int id PK
        string name
        string email UK
        string password_hash
        string role "student | admin"
        timestamp created_at
    }

    courses {
        int id PK
        string title
        text description
        int professor_id FK
        timestamp created_at
    }

    course_enrollments {
        int course_id PK, FK
        int student_id PK, FK
        timestamp enrolled_at
    }

    groups {
        int id PK
        string name
        int created_by FK
        int leader_id FK
        timestamp created_at
    }

    group_members {
        int group_id PK, FK
        int student_id PK, FK, UK
        timestamp joined_at
    }

    assignments {
        int id PK
        string title
        text description
        timestamp due_date
        string onedrive_link
        int created_by FK
        int course_id FK
        string submission_type "INDIVIDUAL | GROUP"
        timestamp created_at
        timestamp updated_at
    }

    assignment_targets {
        int id PK
        int assignment_id FK
        string target_type "ALL_STUDENTS | GROUP"
        int group_id FK
    }

    submission_confirmations {
        int id PK
        int assignment_id FK
        int student_id FK
        timestamp step1_selected_at
        timestamp confirmed_at
        string status "confirmed"
        int confirmed_by_leader_id FK
    }
```

---

## 6. Round 2 Core Workflows

### Course Layer & Student Enrollment
1. Seed data assigns professor `admin@joineazy.demo` to 3 courses (`CS301`, `CS302`, `CS303`).
2. Students are enrolled into courses via `course_enrollments`.
3. Student API `GET /api/courses/my-courses` returns only courses the student is enrolled in.
4. Direct access to assignment details or course assignments checks enrollment (`403 Forbidden` if unenrolled).

### Individual vs Group Submission Logic
- **Individual (`submission_type = INDIVIDUAL`)**:
  - Each student independently completes Step 1 ("Yes, I have submitted externally") and Step 2 ("Confirm").
  - Affects strictly the calling student's confirmation record (`confirmed_by_leader_id = NULL`).
- **Group (`submission_type = GROUP`)**:
  - **Leader Authorization**: Backend verifies `group.leader_id === req.user.id`. If a non-leader attempts Step 1 or Step 2, the backend rejects with `403 Forbidden`.
  - **Transactional Fan-Out**: On final confirmation, the server executes a PostgreSQL transaction inserting confirmation records for **all current group members**, tagging `confirmed_by_leader_id = leaderId`.
  - All group members' interfaces immediately reflect as `Submitted` with live 100% team progress.

### Server-Side Status Filtering
The professor student monitoring API endpoint accepts a `?status=` query parameter:
- `GET /api/admin/assignments/:id/students?status=SUBMITTED`: Filters `WHERE sc.id IS NOT NULL` in SQL.
- `GET /api/admin/assignments/:id/students?status=PENDING`: Filters `WHERE sc.id IS NULL` in SQL.
- `GET /api/admin/assignments/:id/students?status=ALL`: Returns full cohort.

---

## 7. API Specification

### Courses Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/courses/my-courses` | Student | Returns list of courses student is enrolled in with assignment counts. |
| `GET` | `/api/courses/teaching` | Admin | Returns courses taught with student count, submitted/pending count, and completion rate. |
| `GET` | `/api/courses/:id/assignments` | Student / Admin | Returns assignments within course (enforces enrollment authorization). |
| `GET` | `/api/courses` | Admin | Returns all courses for dropdown form inputs. |

### Assignment Endpoints (Updated)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/assignments` | Admin | Creates assignment with `courseId` and `submissionType` (`INDIVIDUAL` or `GROUP`). |
| `PUT` | `/api/assignments/:id` | Admin | Updates assignment fields including course and submission type. |
| `GET` | `/api/assignments` | Authenticated | Lists assignments applicable to user (with course title & submission type). |
| `GET` | `/api/assignments/:id` | Authenticated | Detailed assignment information with access check. |

### Submission Endpoints (Leader Enforced)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/assignments/:id/submission/step1` | Student | Records Step 1 intent. For `GROUP`, rejects non-leaders with 403. |
| `POST` | `/api/assignments/:id/submission/confirm` | Student | Confirms submission. For `GROUP`, fan-outs confirmation across all members. |
| `GET` | `/api/assignments/:id/submission` | Student | Returns personal/group submission status and leader details. |

### Admin Monitoring Endpoints (Status Filtered)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/assignments/:id/students?status=...` | Admin | Student roster filtered server-side (`SUBMITTED`, `PENDING`, `ALL`). |
| `GET` | `/api/admin/assignments/:id/groups` | Admin | Group monitoring with leader names and team member statuses. |
| `GET` | `/api/admin/dashboard/summary` | Admin | Summary KPIs including total courses and recent submission activity. |

---

## 8. Demo Credentials

| Role | Name | Email | Password | Group & Role |
| :--- | :--- | :--- | :--- | :--- |
| **Admin / Professor** | Prof. Sarah Jenkins | `admin@joineazy.demo` | `Admin@123` | Instructor (All Courses) |
| **Student (Leader)** | Aarav Sharma | `student1@demo.com` | `Student@123` | **Team Alpha (Leader)** |
| **Student (Member)** | Bhavya Patel | `student2@demo.com` | `Student@123` | Team Alpha (Member) |
| **Student (Member)** | Chetan Kumar | `student3@demo.com` | `Student@123` | Team Alpha (Member) |
| **Student (Leader)** | Diya Rao | `student4@demo.com` | `Student@123` | **Team Beta (Leader)** |
| **Student (Member)** | Eshan Verma | `student5@demo.com` | `Student@123` | Team Beta (Member) |

---

## 9. Local Development & Setup

### Prerequisites
- Node.js v18+
- PostgreSQL v14+ running locally on port `5432`

### 1. Clone & Configure Environment
```bash
git clone https://github.com/Tvaibhav06/JoinEz.git
cd JoinEz
```

Create root `.env` (or copy `.env.example`):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/joineazy_db
JWT_SECRET=joineazy_round2_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

VITE_API_URL=http://localhost:5000/api
```

### 2. Database Migration & Seeding
```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
```

### 3. Start Development Servers
In terminal 1 (Backend):
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

In terminal 2 (Frontend):
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 10. Docker Setup

Run the entire application stack (PostgreSQL, Node backend, Nginx frontend) via Docker Compose:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Healthcheck: `http://localhost:5000/api/health`

---

## 11. Automated Testing

The repository contains end-to-end automated tests covering:
- Authentication & JWT RBAC
- Course enrollment & access control (enrolled vs unenrolled 403)
- Assignment types (`INDIVIDUAL` vs `GROUP`)
- Group leader authorization (non-leader 403 rejection)
- Transactional fan-out confirmation across all group members
- Server-side status filtering (`SUBMITTED` vs `PENDING`)
- Database migration integrity & Task 1 regressions

Run tests:
```bash
cd backend
npm test
```

**Results:**
```text
Test Suites: 3 passed, 3 total
Tests:       41 passed, 41 total
Snapshots:   0 total
Time:        6.289 s
```

---

## 12. Deployment Guide

The repository includes pre-configured deployment specifications for **Render**, **Vercel**, and **Netlify**:

### Option A: Render 1-Click Blueprint (`render.yaml`)
1. Push repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Select this repository. Render will automatically provision:
   - Managed PostgreSQL database
   - Node/Express Web Service (`/backend`)
   - Vite React Static Site (`/frontend` with rewrite rules)

### Option B: Frontend on Vercel or Netlify
- **Vercel**: Configuration file [`frontend/vercel.json`](file:///d:/codes/assignmw/frontend/vercel.json) handles SPA rewrites.
- **Netlify**: Configuration file [`netlify.toml`](file:///d:/codes/assignmw/netlify.toml) specifies publish directory `dist` and redirect rule `/* /index.html 200`.
- Set Environment Variable: `VITE_API_URL = https://your-backend-url.onrender.com/api`

---

## 13. Verification Report

| Area | Status | Evidence |
| :--- | :---: | :--- |
| **Auth UX** | **PASS** | Inline regex validation, loading spinner states, demo accounts, role-based redirect. |
| **Courses** | **PASS** | `courses` & `course_enrollments` tables; `GET /api/courses/my-courses` and `teaching`. |
| **Student Dashboard** | **PASS** | Responsive Enrolled Course cards navigating to `/student/courses/:courseId/assignments`. |
| **Professor Dashboard** | **PASS** | Courses Taught with live PostgreSQL analytics (student count, submitted/pending counts). |
| **Assignment Types** | **PASS** | Explicit `INDIVIDUAL` and `GROUP` types; form selector & badges. |
| **Leader-Only Acknowledgment** | **PASS** | Non-leader rejected with 403; leader confirmation transactionally fans out to all members. |
| **Individual Submissions** | **PASS** | Preserves Task 1 isolation; confirming affects only the caller. |
| **Status Filtering** | **PASS** | Server-side query parameter `?status=SUBMITTED` & `PENDING` directly in SQL. |
| **Database Migration** | **PASS** | `002_round2_courses_and_groups.sql` runs cleanly; backfills legacy records. |
| **Tests** | **PASS** | 41/41 tests passing in Jest/Supertest suite with 0 failures. |
| **Docker** | **Config Valid** | Multi-stage Dockerfile and docker-compose.yml verified; runtime pending local Docker daemon. |
| **Deployment Configs** | **PASS** | `render.yaml`, `vercel.json`, `netlify.toml` configured for SPA routing. |
| **README Documentation** | **PASS** | Comprehensive documentation, ER diagram, and verification matrix provided. |

---

## 14. Known Limitations

1. **Course Self-Enrollment**: In alignment with the PRD specification (which explicitly designated self-enrollment as out-of-scope for Round 2), courses and student enrollments are managed through seed data and administrative assignment.
2. **OneDrive File Verification**: Per specification, the system records student submission acknowledgment; external file inspection on OneDrive is external to the application scope.
