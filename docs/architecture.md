# Architecture Documentation

## Joineazy Student, Group & Assignment Management System

This document outlines the software architecture, design patterns, security model, and data flow of the Joineazy system.

---

## 1. High-Level System Architecture

The application follows a decoupled client-server architecture:

```text
┌────────────────────────────────────────────────────────┐
│                   React.js SPA Client                  │
│       Vite • Tailwind CSS • Context API • SPA Router   │
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
                            │ (PostgreSQL Connection Pool)
┌───────────────────────────▼────────────────────────────┐
│                  PostgreSQL Database                   │
│   Users • Groups • Assignments • Targets • Submissions │
└────────────────────────────────────────────────────────┘
```

---

## 2. Layered Backend Design

To ensure testability, modularity, and clean separation of concerns, the backend strictly adheres to a five-layer architecture:

```text
HTTP Request
     │
     ▼
[ Routes Layer ]          Defines URI endpoints, HTTP verbs, and mounts handlers
     │
     ▼
[ Middleware Layer ]      JWT authentication, role-based authorization, and schema validation
     │
     ▼
[ Controller Layer ]      Extracts request inputs, calls services, formats standardized JSON
     │
     ▼
[ Service Layer ]         Encapsulates business rules, calculations, and transaction orchestration
     │
     ▼
[ Database Layer ]        pg Connection Pool executing parameterized queries against PostgreSQL
     │
     ▼
HTTP Response             { success: true, message: "...", data: { ... } }
```

### Key Responsibilities by Layer:
1. **Routes (`src/routes/`)**: Mounts endpoints under `/api/...`. Never contains database queries.
2. **Middleware (`src/middleware/`)**:
   - `authenticateJWT`: Validates token signature, expiration, and ensures user still exists in DB.
   - `requireRole`: Enforces role boundaries (`student` vs `admin`).
   - `errorHandler`: Traps all uncaught exceptions, transforms PostgreSQL error codes (e.g. `23505` unique violation) into clean HTTP JSON responses.
3. **Controllers (`src/controllers/`)**: Translates HTTP parameters into typed method arguments and delegates to the appropriate service.
4. **Services (`src/services/`)**: Contains all core domain logic, membership validation, targeting filters, and statistical calculations.
5. **Database (`src/config/db.js`)**: Manages pooling, client acquisition, and transactional rollbacks.

---

## 3. Security Architecture & RBAC

### 3.1 Authentication
- Passwords are encrypted using `bcryptjs` with a cost factor of 10. Plain-text passwords never touch logs or database records.
- Login generates a signed JSON Web Token (JWT) with HS256 encryption containing:
  ```json
  {
    "sub": 1,
    "id": 1,
    "email": "student1@demo.com",
    "role": "student",
    "name": "Aarav Sharma",
    "iat": 1758067200,
    "exp": 1758672000
  }
  ```
- Public student registration forces the `role` to `'student'` server-side, preventing privilege escalation.
- Admin accounts cannot be created publicly; they are provisioned exclusively via database seed configurations.

### 3.2 Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | Role Allowed | Backend Enforcement |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Public | Enforces student role assignment |
| `/api/auth/login` | POST | Public | Validates credentials & issues JWT |
| `/api/auth/me` | GET | Authenticated | Returns current profile |
| `/api/groups` | POST | Student | Rejects admin callers; enforces 1-group limit |
| `/api/groups/my-group`| GET | Student | Returns active group |
| `/api/groups/:id` | GET | Member / Admin | Verifies caller belongs to group if student |
| `/api/groups/:id/members` | POST | Student (Member) | Verifies caller is group member |
| `/api/groups/:id/progress`| GET | Member / Admin | Verifies caller belongs to group if student |
| `/api/assignments` | POST | Admin | Rejects non-admin callers |
| `/api/assignments/:id` | PUT | Admin | Rejects non-admin callers |
| `/api/assignments` | GET | Authenticated | Admin sees all; Student filtered to applicable |
| `/api/assignments/:id` | GET | Authenticated | Verifies student group targeting access |
| `/api/assignments/:id/submission/step1` | POST | Student | Verifies student assignment visibility |
| `/api/assignments/:id/submission/confirm` | POST | Student | Enforces uniqueness & visibility |
| `/api/admin/*` | GET | Admin | All sub-routes require Admin role |

---

## 4. Transaction Boundaries & Data Integrity

Critical multi-step operations are wrapped in PostgreSQL transactions with automatic `ROLLBACK` upon error:

### 4.1 Group Creation Transaction
```sql
BEGIN;
INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING id;
INSERT INTO group_members (group_id, student_id) VALUES (group_id, $2);
COMMIT;
```

### 4.2 Assignment Creation Transaction
```sql
BEGIN;
INSERT INTO assignments (title, description, due_date, onedrive_link, created_by) VALUES (...) RETURNING id;
-- Loop over target groups or insert ALL_STUDENTS
INSERT INTO assignment_targets (assignment_id, target_type, group_id) VALUES (...);
COMMIT;
```

### 4.3 Final Submission Confirmation Transaction
```sql
BEGIN;
-- Verify no prior confirmation exists
SELECT id FROM submission_confirmations WHERE assignment_id = $1 AND student_id = $2;
INSERT INTO submission_confirmations (assignment_id, student_id, step1_selected_at, confirmed_at, status) VALUES (...);
COMMIT;
```

---

## 5. Domain Business Logic & Formulas

### 5.1 Group Assignment Progress
Progress is dynamically derived from database records and never stored as a stale static column:
$$\text{Progress \%} = \left(\frac{\text{Confirmed Group Members}}{\text{Total Current Group Members}}\right) \times 100$$
- When $\text{Confirmed Group Members} = \text{Total Current Group Members}$, the status is flagged as **Complete (100%)**.

### 5.2 Group Performance Analytics
Measures aggregate submission efficiency across all assignments applicable to that group:
$$\text{Group Performance \%} = \left(\frac{\text{Total Confirmed Member-Assignment Confirmations}}{\text{Total Expected Member-Assignment Confirmations}}\right) \times 100$$
$$\text{Total Expected} = \text{Group Member Count} \times \text{Applicable Assignments Count}$$

### 5.3 External OneDrive Architecture
- The application stores and exposes external OneDrive URLs (`https://onedrive.live.com/...`).
- Students perform file uploads outside the platform.
- The two-step in-app confirmation records self-reported completion without hosting or processing raw file binaries.
