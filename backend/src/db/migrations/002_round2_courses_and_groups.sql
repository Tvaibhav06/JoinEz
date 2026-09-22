-- Round 2 Database Enhancement Migration
-- Adds Courses, Course Enrollments, Group Leaders, Assignment Submission Types, and Leader Confirmations

-- 1. Courses table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    professor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_professor_id ON courses(professor_id);

-- 2. Course Enrollments join table (Many-to-Many between Courses and Students)
CREATE TABLE IF NOT EXISTS course_enrollments (
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);

-- 3. Alter Groups table: Add leader_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'leader_id'
    ) THEN
        ALTER TABLE groups ADD COLUMN leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Backfill leader_id to created_by for existing groups
UPDATE groups SET leader_id = created_by WHERE leader_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_groups_leader_id ON groups(leader_id);

-- 4. Alter Assignments table: Add submission_type and course_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' AND column_name = 'submission_type'
    ) THEN
        ALTER TABLE assignments ADD COLUMN submission_type VARCHAR(20) DEFAULT 'INDIVIDUAL' CHECK (submission_type IN ('INDIVIDUAL', 'GROUP'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' AND column_name = 'course_id'
    ) THEN
        ALTER TABLE assignments ADD COLUMN course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Legacy Migration: Ensure all existing assignments belong to a course and have submission_type
DO $$
DECLARE
    default_prof_id INTEGER;
    default_course_id INTEGER;
BEGIN
    -- Find an admin user to be the professor for the default course
    SELECT id INTO default_prof_id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1;

    IF default_prof_id IS NOT NULL THEN
        -- Insert default course if it doesn't already exist
        INSERT INTO courses (title, description, professor_id)
        SELECT 'General / Existing Assignments', 'Default course for legacy assignments created in Task 1', default_prof_id
        WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'General / Existing Assignments')
        RETURNING id INTO default_course_id;

        IF default_course_id IS NULL THEN
            SELECT id INTO default_course_id FROM courses WHERE title = 'General / Existing Assignments' LIMIT 1;
        END IF;

        -- Associate any orphan assignments to the default course
        UPDATE assignments SET course_id = default_course_id WHERE course_id IS NULL;
    END IF;

    -- Ensure default submission_type is INDIVIDUAL for existing assignments
    UPDATE assignments SET submission_type = 'INDIVIDUAL' WHERE submission_type IS NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);

-- 6. Alter Submission Confirmations table: Add confirmed_by_leader_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submission_confirmations' AND column_name = 'confirmed_by_leader_id'
    ) THEN
        ALTER TABLE submission_confirmations ADD COLUMN confirmed_by_leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_submissions_confirmed_by_leader ON submission_confirmations(confirmed_by_leader_id);
