# Joineazy Student, Group & Assignment Management System

A role-based full-stack web application designed for **Joineazy Task 1**, enabling students to form groups, view professor assignments, access external OneDrive submission links, confirm submissions via a two-step in-app verification flow, and track live team progress, while professors/admins manage assignments, monitor submission progress, and review basic analytics.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Architecture Overview](#architecture-overview)
5. [Project Structure](#project-structure)
6. [Local Development Setup](#local-development-setup)
7. [Docker Setup](#docker-setup)
8. [Environment Variables](#environment-variables)
9. [Database Schema & ER Diagram](#database-schema--er-diagram)
10. [API Documentation](#api-documentation)
11. [Route Security Matrix](#route-security-matrix)
12. [Implementation Decisions for PRD Ambiguities](#implementation-decisions-for-prd-ambiguities)
13. [Demo Credentials](#demo-credentials)
14. [Demo Walkthrough](#demo-walkthrough)
15. [Automated Testing](#automated-testing)
16. [Scope & Limitations](#scope--limitations)

---

## 1. Project Overview

In university and internship programs, professors post coursework and share an external OneDrive folder where actual files are uploaded. The Joineazy system solves the collaboration and coordination challenge:
- Students self-organize into collaborative groups.
- Professors publish assignments targeted to either all students or specific groups.
- Students open the external OneDrive link, complete the upload, and return to record a **two-step in-app submission confirmation**.
- Live team progress updates dynamically based on individual member confirmations.
- Professors track group-wise and student-wise completion and review aggregate analytics on a unified dashboard.

---

## 2. Features

### Student Experience
- **Authentication**: Public registration and secure JWT login.
- **Group Management**:
  - Create a group (creator automatically becomes initial member).
  - Add members immediately by **Email** or **numeric Student ID**.
  - Enforces single-group policy (a student may belong to only one active group at a time).
  - View member list with join dates and roles.
- **Assignment Access**:
  - View assignments targeted to all students or specifically to the student's group.
  - Direct external link to the class OneDrive folder (`target="_blank" rel="noopener noreferrer"`).
- **Two-Step Submission Confirmation**:
  - **Step 1**: Initial intent selection ("Yes, I have submitted externally").
  - **Step 2**: Final confirmation dialog with explicit acknowledgment.
  - Strictly prevents duplicate confirmations.
- **Group Progress Tracking**:
  - Dynamic visual progress bar derived from database records (`confirmed / total * 100`).
  - "✓ Group Complete" badge displayed upon 100% completion.

### Admin (Professor) Experience
- **Authentication**: Secure login via seeded professor credentials.
- **Assignment Management**:
  - Create assignments with Title, Description, Due Date, and external OneDrive URL.
  - Flexible targeting: **All Students** or **Specific Groups** (multi-select).
  - Edit existing assignments while preserving student submission histories.
- **Submission Monitoring**:
  - **Group-Wise Monitoring**: Progress percentage, confirmed count, pending count, and member-by-member breakdown table.
  - **Student-Wise Monitoring**: Filterable roster showing student name, email, group, status badge, and confirmation timestamp.
- **Analytics & Performance**:
  - **Completion Analytics**: Total expected submissions, total confirmed, total pending, and overall completion rate.
  - **Group Performance Analytics**: Ranking table and progress bars using the PRD formula: `(Confirmed / Expected) * 100`.
- **Dashboard Overview**: Summary KPI cards and recent submissions live feed.

---

## 3. Technology Stack

- **Frontend**:
  - React.js 18 (Vite)
  - Tailwind CSS (Curated slate & indigo color tokens, modern typography with Inter)
  - React Router DOM v6 (Role-based route protection)
  - Lucide React (Clean, accessible icons)
- **Backend**:
  - Node.js & Express.js
  - PostgreSQL (`pg` connection pool with parameterized SQL queries)
  - JSON Web Tokens (`jsonwebtoken`)
  - Password Hashing (`bcryptjs`)
  - CORS & Dotenv
- **Testing**:
  - Jest & Supertest (End-to-end REST API testing)
- **Containerization**:
  - Docker & Docker Compose (Multi-stage builds, Nginx production server, PostgreSQL healthchecks)

---

## 4. Architecture Overview

The system implements a strictly separated layered architecture:

```text
React Client (SPA)
       │
       ▼ (HTTP / JSON with Bearer JWT)
Express REST API
       │
  ┌────┴──────────────────────────────┐
  │ Routes Layer                      │
  │   ↓                               │
  │ Middleware (JWT + RBAC + Errors)  │
  │   ↓                               │
  │ Controllers                       │
  │   ↓                               │
  │ Services (Business Logic)         │
  │   ↓                               │
  │ PostgreSQL (Parameterized Queries)│
  └────┬──────────────────────────────┘
       │
       ▼
PostgreSQL Database (Referential Integrity, Constraints & Indexes)
```

For comprehensive details on request flows and transaction boundaries, refer to [`docs/architecture.md`](file:///d:/codes/assignmw/docs/architecture.md).

---

## 5. Project Structure

```text
joineazy-task1/
├── frontend/                     # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Navbar, Modal, ProgressBar, Badges, Cards, Tables
│   │   ├── pages/
│   │   │   ├── auth/             # LoginPage, RegisterPage
│   │   │   ├── student/          # StudentDashboard, StudentAssignments, StudentGroup
│   │   │   └── admin/            # AdminDashboard, AdminAssignments, AdminMonitoring, AdminAnalytics
│   │   ├── layouts/              # StudentLayout, AdminLayout
│   │   ├── services/             # Centralized api.js client
│   │   ├── context/              # AuthContext (JWT, user, role, login, logout)
│   │   ├── routes/               # ProtectedRoute
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── nginx.conf                # Nginx production configuration
│   ├── Dockerfile
│   └── package.json
│
├── backend/                      # Node.js + Express REST API
│   ├── src/
│   │   ├── config/               # db.js (pg Pool), env.js
│   │   ├── controllers/          # auth, group, assignment, submission, admin controllers
│   │   ├── services/             # auth, group, assignment, submission, admin services
│   │   ├── middleware/           # auth.js, role.js, errorHandler.js
│   │   ├── routes/               # auth, group, assignment, submission, admin routes
│   │   ├── db/
│   │   │   ├── migrations/       # 001_init_schema.sql
│   │   │   ├── seeds/            # 001_seed_data.js
│   │   │   └── migrate.js        # Automated migration runner
│   │   ├── utils/                # jwt.js, password.js, response.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/                    # Integration & unit test suites (Jest + Supertest)
│   ├── Dockerfile
│   └── package.json
│
├── docs/
│   ├── er-diagram.md             # Detailed Mermaid ER diagram & schema dictionary
│   └── architecture.md           # Architecture, data flows & security model
│
├── docker-compose.yml            # Multi-container orchestration
├── .env.example                  # Environment configuration template
├── .gitignore
└── README.md
```

---

## 6. Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) running locally on port 5432

### 1. Clone & Environment Configuration
```bash
git clone https://github.com/Tvaibhav06/JoinEz.git
cd JoinEz
cp .env.example .env
```
Ensure `.env` contains your PostgreSQL credentials (e.g., `postgresql://postgres:postgres123@localhost:5432/joineazy_db`).

### 2. Database Initialization & Seeding
```bash
# Create database in PostgreSQL (if not already created)
psql -U postgres -c "CREATE DATABASE joineazy_db;"

# Install backend dependencies & run migrations + seed
cd backend
npm install
npm run db:migrate
npm run db:seed
```

### 3. Start Backend Server
```bash
cd backend
npm start
# Server starts on http://localhost:5000
```

### 4. Start Frontend Client
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 7. Docker Setup

The entire application (PostgreSQL, Express Backend, and React Frontend via Nginx) can be started with a single Docker Compose command:

```bash
docker compose up --build
```

### What Happens Automatically:
1. `postgres` container starts on port `5432` with healthcheck verification.
2. `backend` container starts on port `5000`, waits for PostgreSQL to become healthy, and executes schema migrations & demo seeds automatically.
3. `frontend` container builds production React assets and serves them via Nginx on port `5173`.

Access the application:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

To stop the containers:
```bash
docker compose down -v
```

---

## 8. Environment Variables

| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5000` | Backend HTTP port |
| `NODE_ENV` | `development` / `production` | Node environment |
| `DATABASE_URL` | `postgresql://postgres:postgres123@localhost:5432/joineazy_db` | PostgreSQL connection string |
| `JWT_SECRET` | `joineazy_super_secret_jwt_key_2026_change_in_production` | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | Token validity duration |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `VITE_API_URL` | `http://localhost:5000/api` | API Base URL for frontend client |

---

## 9. Database Schema & ER Diagram

```mermaid
erDiagram
    USERS ||--o{ GROUPS : "creates (student)"
    USERS ||--o{ GROUP_MEMBERS : "belongs to (student)"
    GROUPS ||--|{ GROUP_MEMBERS : "contains"
    USERS ||--o{ ASSIGNMENTS : "posts (admin)"
    ASSIGNMENTS ||--|{ ASSIGNMENT_TARGETS : "targets"
    GROUPS ||--o{ ASSIGNMENT_TARGETS : "received by"
    USERS ||--o{ SUBMISSION_CONFIRMATIONS : "confirms (student)"
    ASSIGNMENTS ||--o{ SUBMISSION_CONFIRMATIONS : "tracked by"
```

For the comprehensive data dictionary, refer to [`docs/er-diagram.md`](file:///d:/codes/assignmw/docs/er-diagram.md).

---

## 10. API Documentation

All endpoints other than registration and login require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new student account |
| `POST` | `/api/auth/login` | Public | Authenticate student or admin; receive JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/groups` | Student | Create new group (creator becomes initial member) |
| `GET` | `/api/groups/my-group` | Student | View current student's active group and members |
| `GET` | `/api/groups/:id` | Member / Admin | View group details and member roster |
| `POST` | `/api/groups/:id/members` | Student (Member) | Add member by student email or student ID |
| `GET` | `/api/groups/:id/progress` | Member / Admin | View dynamic group progress across assignments |
| `POST` | `/api/assignments` | Admin | Create assignment with title, description, due date, OneDrive URL, targets |
| `PUT` | `/api/assignments/:id` | Admin | Edit assignment details and targeting |
| `GET` | `/api/assignments` | Student / Admin | List assignments (Admin: all; Student: applicable) |
| `GET` | `/api/assignments/:id` | Student / Admin | View single assignment details with visibility check |
| `POST` | `/api/assignments/:id/submission/step1` | Student | Record Step 1 intent ("Yes, I have submitted") |
| `POST` | `/api/assignments/:id/submission/confirm`| Student | Record final confirmation (Step 2) |
| `GET` | `/api/assignments/:id/submission` | Student | Retrieve own confirmation status |
| `GET` | `/api/admin/assignments/:id/groups` | Admin | Group-wise submission tracking breakdown |
| `GET` | `/api/admin/assignments/:id/students` | Admin | Student-wise submission tracking roster |
| `GET` | `/api/admin/analytics/completion` | Admin | Submission completion statistics and breakdown |
| `GET` | `/api/admin/analytics/group-performance` | Admin | Group performance calculation and rankings |
| `GET` | `/api/admin/dashboard/summary` | Admin | Dashboard summary counts and recent submissions |

---

## 11. Route Security Matrix

| Capability | Public | Student | Admin | Backend Enforcement |
| :--- | :---: | :---: | :---: | :--- |
| Register Student Account | ✓ | ✓ | — | Role hardcoded to `student` |
| Login & Token Issuance | ✓ | ✓ | ✓ | Role returned in JWT payload |
| Create Group | — | ✓ | — | Rejects non-students; enforces 1-group limit |
| Add Member to Group | — | ✓ | — | Verifies caller is group member |
| View Student Group | — | ✓ | ✓ | Students restricted to own group |
| View Group Progress | — | ✓ | ✓ | Students restricted to own group |
| Create / Edit Assignment | — | — | ✓ | Rejects non-admins (403) |
| View Assignments List | — | ✓ | ✓ | Student view filtered server-side |
| Access Restricted Assignment | — | Target Only | ✓ | Non-targeted students blocked (403) |
| Submit Confirmation | — | ✓ | — | Only student can confirm for self |
| Admin Monitoring & Analytics | — | — | ✓ | Protected by `requireRole('admin')` |

---

## 12. Implementation Decisions for PRD Ambiguities

Per prompt Section 3, the following design decisions were adopted and enforced throughout the system:

1. **Admin Provisioning**:
   - There is no public admin registration form to prevent unauthorized privilege escalation.
   - Admin accounts are provisioned via database seed data (`admin@joineazy.demo` / `Admin@123`).
2. **Student Identification**:
   - The database-generated integer `users.id` serves as the Student ID.
   - Member additions support lookup by either **email** or **numeric Student ID**.
3. **Single Active Group per Student**:
   - A student may belong to only **one active group at a time**.
   - Enforced at the database level with a `UNIQUE(student_id)` constraint on `group_members`, and validated with descriptive error responses in the service layer.
4. **Immediate Member Addition**:
   - "Invite/add members" is implemented as immediate addition rather than an email acceptance workflow.
5. **Group Authorization**:
   - Only students who are existing members of a group may add members to that group. Enforced strictly server-side.
6. **Group Size**:
   - No maximum group size is enforced.
7. **Dynamic Progress Calculation**:
   - Group progress is never stored as a stale column; it is calculated dynamically from current members and confirmations:
     $$\text{Progress \%} = \left(\frac{\text{Confirmed Group Members}}{\text{Total Current Group Members}}\right) \times 100$$
   - Displays "Complete" badge when confirmed members equal total members.
8. **Group Performance Analytics Formula**:
   - Calculated as:
     $$\text{Group Performance \%} = \left(\frac{\text{Confirmed Confirmations}}{\text{Expected Confirmations}}\right) \times 100$$
     where $\text{Expected} = \text{Group Members} \times \text{Applicable Assignments}$.
9. **Submission Confirmation Uniqueness**:
   - Enforced via a PostgreSQL unique constraint: `UNIQUE(assignment_id, student_id)`.
   - Once confirmed, the student cannot confirm again (action is disabled and idempotent).
10. **Assignment Targeting Model**:
    - Each assignment selects either `ALL_STUDENTS` or `GROUP` (with one or more group IDs).
11. **External OneDrive Submission Model**:
    - The application stores and exposes OneDrive URLs. Actual file storage and uploading occur outside the application; the application records and tracks verified in-app confirmations.

---

## 13. Demo Credentials

The seeded database contains ready-to-test accounts with pre-populated groups and submission confirmations.

### Admin (Professor)
- **Email**: `admin@joineazy.demo`
- **Password**: `Admin@123`
- **Role**: Professor / Admin

### Students
| Name | Email | Password | Group | Seeded Submissions |
| :--- | :--- | :--- | :--- | :--- |
| **Aarav Sharma** | `student1@demo.com` | `Student@123` | Team Alpha (Creator) | DBMS (Confirmed), OS (Confirmed) |
| **Bhavya Patel** | `student2@demo.com` | `Student@123` | Team Alpha (Member) | DBMS (Confirmed), OS (Pending) |
| **Chetan Kumar** | `student3@demo.com` | `Student@123` | Team Alpha (Member) | DBMS (Pending), OS (Pending) |
| **Diya Rao** | `student4@demo.com` | `Student@123` | Team Beta (Creator) | DBMS (Confirmed), Networks (Confirmed) |
| **Eshan Verma** | `student5@demo.com` | `Student@123` | Team Beta (Member) | DBMS (Pending), Networks (Confirmed) |

*Tip: The login page includes 1-click demo credential fill buttons for instant evaluation.*

---

## 14. Demo Walkthrough

### Scenario A: Student Workflow
1. Navigate to `http://localhost:5173/login`.
2. Click **"Aarav (Student, Alpha)"** or login with `student1@demo.com` / `Student@123`.
3. **Dashboard**: Observe active group "Team Alpha", member roster, applicable assignments, and overall team progress bar.
4. **My Group**: View team members. Try adding a member using email or student ID (e.g. ID `5` will show that Eshan already belongs to Team Beta).
5. **Assignments**:
   - View Assignment 1 (DBMS - All Students) and Assignment 2 (OS - Team Alpha). Notice Assignment 3 (Networks - Team Beta) is not visible.
   - Click **"Open OneDrive Link"** (opens in a new tab).
   - Click **"Yes, I have submitted"** -> Step 1 dialog opens -> Proceed -> Step 2 final verification -> Click **"Confirm Submission"**.
   - Confirmation status immediately updates to "Submitted" and group progress updates live.

### Scenario B: Admin Workflow
1. Log in with `admin@joineazy.demo` / `Admin@123`.
2. **Dashboard**: View summary KPI cards (Students, Groups, Assignments, Overall Completion) and recent submissions feed.
3. **Assignments**:
   - Click **"Create Assignment"**. Enter Title, Description, Due Date, OneDrive URL, choose **"Specific Groups"**, and select "Team Alpha".
   - Submit and verify the assignment is persisted.
   - Click **"Edit"** on an existing assignment to modify the title or deadline.
4. **Monitoring**:
   - Select an assignment from the dropdown.
   - **Group-Wise**: Inspect group completion progress bars and member status breakdown.
   - **Student-Wise**: View student submission table with search filter.
5. **Analytics**:
   - Inspect the **Submission Completion** cards and per-assignment progress bars.
   - Review **Group Performance Ranking** table calculated with the PRD formula.

---

## 15. Automated Testing

The backend includes a comprehensive Jest and Supertest suite verifying all functional, security, and edge-case requirements:

```bash
cd backend
npm test
```

### Verified Test Suites:
- `auth.test.js`: Student registration, duplicate email rejection, student login, admin login, invalid password handling, JWT verification, and RBAC rejection.
- `groups_and_assignments.test.js`:
  - Group creation, creator auto-membership, and 1-group-per-student limit.
  - Adding members by email and ID, rejection of non-existent students, and rejection of students already in another group.
  - Non-member authorization checks.
  - Admin assignment creation with targeting, applicable student visibility, and blocking non-targeted students.
  - Two-step submission confirmation workflow (Step 1 intent, Step 2 final, duplicate prevention).
  - Dynamic progress calculation and Admin analytics formulas.

---

## 16. Scope & Limitations

Per the PRD specification:
- **External Submission**: Assignment files are uploaded by students directly to OneDrive. The application stores the link and records verified confirmations; it does not host or process file binaries.
- **Single Active Group**: A student may belong to only one group at a time.
- **Admin Accounts**: Created exclusively via database seed data.
- **Out of Scope**: In-app file uploads, chat, email delivery services, grading, and payment processing are intentionally omitted per the PRD specification.
