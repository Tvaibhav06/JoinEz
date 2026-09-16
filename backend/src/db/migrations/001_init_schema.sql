-- PostgreSQL Schema for Joineazy Student, Group & Assignment Management System

-- 1. Users table (Students & Admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast login and member lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Groups table
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);

-- 3. Group Members join table
-- A student can belong to only one group at a time (enforced via UNIQUE constraint on student_id)
CREATE TABLE IF NOT EXISTS group_members (
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, student_id),
    CONSTRAINT uq_student_single_group UNIQUE (student_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_student_id ON group_members(student_id);

-- 4. Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    onedrive_link TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);

-- 5. Assignment Targets table
-- Target types: ALL_STUDENTS (group_id IS NULL) or GROUP (group_id IS NOT NULL)
CREATE TABLE IF NOT EXISTS assignment_targets (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('ALL_STUDENTS', 'GROUP')),
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT chk_target_group_consistency CHECK (
        (target_type = 'ALL_STUDENTS' AND group_id IS NULL) OR
        (target_type = 'GROUP' AND group_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_assignment_targets_assignment_id ON assignment_targets(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_targets_group_id ON assignment_targets(group_id);

-- 6. Submission Confirmations table
-- Self-reported confirmation of external OneDrive submission via 2-step flow
-- Enforces strictly one confirmation per assignment per student
CREATE TABLE IF NOT EXISTS submission_confirmations (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step1_selected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed')),
    CONSTRAINT uq_assignment_student_confirmation UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submission_confirmations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submission_confirmations(student_id);
