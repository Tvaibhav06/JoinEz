# Architecture Documentation
## Joineazy Student, Group, Course & Assignment Management System (Round 2)

This document outlines the software architecture, design patterns, security model, and data flow of the Joineazy system, updated to incorporate **Round 2 Course Hierarchies, Group Leadership Authorization, Transactional Fan-Out, and Server-Side Status Filtering**.

---

## 1. High-Level System Architecture

The application follows a decoupled client-server architecture:

```text
┌────────────────────────────────────────────────────────┐
│                   React.js SPA Client                  │
│  Vite • Tailwind CSS • Lucide UI • Context API • Router│
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST (JSON)
                            │ Authorization: Bearer <JWT>
┌───────────────────────────▼────────────────────────────┐
│                    Express REST API                    │
│            Node.js • CORS • JWT Middleware             │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Routes → Middleware → Controllers → Services     │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │ Parameterized SQL Queries
                            │ (pg Connection Pool with SSL)
┌───────────────────────────▼────────────────────────────┐
│                  PostgreSQL Database                   │
│   Users • Courses • Enrollments • Groups • Members     │
│   Assignments • Targets • Submission Confirmations     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Layered Backend Design

To ensure testability, modularity, and clean separation of concerns, the backend strictly adheres to a five-layer architecture:

```text
HTTP Request
     │
     ▼
[ Routes Layer ]          Mounts endpoints under /api/* (Auth, Courses, Groups, Assignments, Admin)
     │
     ▼
[ Middleware Layer ]      JWT verification, role authorization (requireRole), error handling
     │
     ▼
[ Controller Layer ]      Extracts parameters & query filters, invokes services, formats standardized JSON
     │
     ▼
[ Service Layer ]         Encapsulates domain logic (leader check, enrollment check, transaction fan-out)
     │
     ▼
[ Database Layer ]        pg Connection Pool executing parameterized queries against PostgreSQL
     │
     ▼
HTTP Response             { success: true, message: "...", data: { ... } }
```

### Key Responsibilities by Layer:
1. **Routes (`src/routes/`)**:
   - `authRoutes.js`: Login, student registration, profile.
   - `courseRoutes.js`: Course listing, student enrolled courses, professor taught courses, course assignments.
   - `groupRoutes.js`: Group creation, team membership, leader resolution.
   - `assignmentRoutes.js`: Assignment CRUD with course and submission type.
   - `submissionRoutes.js`: Step 1 intent and Step 2 confirmation with leader gating.
   - `adminRoutes.js`: Monitoring with server-side status filtering and completion analytics.
2. **Middleware (`src/middleware/`)**:
   - `authenticateJWT`: Validates token signature, expiration, and ensures user still exists.
   - `requireRole`: Enforces role boundaries (`student` vs `admin`).
   - `errorHandler`: Traps exceptions, translates PostgreSQL error codes (e.g. `23505` unique violation) into clean HTTP JSON responses.
3. **Controllers (`src/controllers/`)**: Translates HTTP parameters and query strings into typed arguments and delegates to services.
4. **Services (`src/services/`)**: Contains core domain logic:
   - `courseService.js`: Scopes courses by student enrollment and professor ownership.
   - `submissionService.js`: Enforces group leader checks and executes transactional confirmation fan-out.
   - `adminService.js`: Dynamic SQL filtering on `?status=SUBMITTED` (`sc.id IS NOT NULL`) vs `?status=PENDING` (`sc.id IS NULL`).
5. **Database (`src/config/db.js`)**: Manages pooling, client acquisition, production SSL, and transaction rollbacks.

---

## 3. Security Architecture & RBAC

### 3.1 Authentication
- Passwords are encrypted using `bcryptjs` with a cost factor of 10. Plain-text passwords never touch logs or database records.
- Login generates a signed JSON Web Token (JWT) with HS256 encryption.
- Public student registration forces the `role` to `'student'` server-side, preventing privilege escalation.
- Admin accounts cannot be created publicly; they are provisioned exclusively via database seed configurations.

### 3.2 Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | Role Allowed | Backend Enforcement |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Public | Enforces student role assignment |
| `/api/auth/login` | POST | Public | Validates credentials & issues JWT |
| `/api/auth/me` | GET | Authenticated | Returns current profile |
| `/api/courses/my-courses` | GET | Student | Returns only courses caller is enrolled in |
| `/api/courses/teaching` | GET | Admin | Returns courses taught with live stats |
| `/api/courses/:id/assignments` | GET | Authenticated | Enforces course enrollment if student |
| `/api/groups` | POST | Student | Rejects admin callers; enforces 1-group limit |
| `/api/groups/my-group` | GET | Student | Returns active group with leader details |
| `/api/groups/:id/members` | POST | Student (Member) | Verifies caller is existing group member |
| `/api/assignments` | POST | Admin | Rejects non-admin; validates `submission_type` |
| `/api/assignments/:id` | PUT | Admin | Rejects non-admin |
| `/api/assignments` | GET | Authenticated | Filtered to student enrolled courses |
| `/api/assignments/:id/submission/step1` | POST | Student | For GROUP: Rejects non-leaders with 403 |
| `/api/assignments/:id/submission/confirm` | POST | Student | For GROUP: Rejects non-leaders with 403; fans out across team |
| `/api/admin/assignments/:id/students` | GET | Admin | Supports `?status=SUBMITTED` / `PENDING` in SQL |
| `/api/admin/dashboard/summary` | GET | Admin | Faculty summary KPIs |

---

## 4. Transaction Boundaries & Data Integrity

### 4.1 Group Creation Transaction
```sql
BEGIN;
INSERT INTO groups (name, created_by, leader_id) VALUES ($1, $2, $2) RETURNING id;
INSERT INTO group_members (group_id, student_id) VALUES (group_id, $2);
COMMIT;
```

### 4.2 Group Submission Confirmation (Transactional Fan-Out)
When a designated group leader confirms submission for a `GROUP` assignment, the server runs an atomic transaction that inserts confirmation records for all current members of that team:
```sql
BEGIN;
-- Verify student is leader: group.leader_id === req.user.id
-- Verify no prior group confirmation exists
FOR member_id IN SELECT student_id FROM group_members WHERE group_id = $group_id LOOP
  INSERT INTO submission_confirmations (
    assignment_id, student_id, step1_selected_at, confirmed_at, status, confirmed_by_leader_id
  ) VALUES ($assign_id, member_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'confirmed', $leader_id)
  ON CONFLICT (assignment_id, student_id) DO UPDATE
    SET confirmed_by_leader_id = $leader_id, confirmed_at = CURRENT_TIMESTAMP;
END LOOP;
COMMIT;
```

### 4.3 Individual Submission Confirmation
```sql
BEGIN;
INSERT INTO submission_confirmations (
  assignment_id, student_id, step1_selected_at, confirmed_at, status, confirmed_by_leader_id
) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'confirmed', NULL);
COMMIT;
```

---

## 5. Domain Business Logic & Formulas

### 5.1 Group Assignment Live Progress
Progress is dynamically derived from database records and never stored as a stale static column:
$$\text{Progress \%} = \left(\frac{\text{Confirmed Group Members}}{\text{Total Current Group Members}}\right) \times 100$$
- When $\text{Confirmed Group Members} = \text{Total Current Group Members}$, the status is flagged as **Complete (100%)**.

### 5.2 Server-Side Status Filtering
To support large cohorts, filtering is executed directly in PostgreSQL rather than sending thousands of rows to the browser:
- `?status=SUBMITTED`: Appends `AND sc.id IS NOT NULL`
- `?status=PENDING`: Appends `AND sc.id IS NULL`
- `?status=ALL`: Returns all enrolled students for the assignment target
