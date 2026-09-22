const { pool } = require('../config/db');

/**
 * Returns list of courses a student is enrolled in with assignment counts and instructor info
 */
async function getMyCourses(studentId) {
  const query = `
    SELECT
      c.id,
      c.title,
      c.description,
      c.created_at,
      u.id AS professor_id,
      u.name AS professor_name,
      u.email AS professor_email,
      (
        SELECT COUNT(*)::int
        FROM course_enrollments ce2
        WHERE ce2.course_id = c.id
      ) AS student_count,
      (
        SELECT COUNT(*)::int
        FROM assignments a
        WHERE a.course_id = c.id
      ) AS assignment_count
    FROM course_enrollments ce
    JOIN courses c ON ce.course_id = c.id
    JOIN users u ON c.professor_id = u.id
    WHERE ce.student_id = $1
    ORDER BY c.created_at ASC
  `;
  const res = await pool.query(query, [studentId]);
  return res.rows;
}

/**
 * Returns courses taught by the professor with live analytics:
 * student_count, assignments_count, submitted_count, pending_count, completion_percentage
 */
async function getTeachingCourses(professorId) {
  const coursesRes = await pool.query(`
    SELECT
      c.id,
      c.title,
      c.description,
      c.created_at,
      u.id AS professor_id,
      u.name AS professor_name,
      (
        SELECT COUNT(*)::int
        FROM course_enrollments ce
        WHERE ce.course_id = c.id
      ) AS student_count,
      (
        SELECT COUNT(*)::int
        FROM assignments a
        WHERE a.course_id = c.id
      ) AS assignments_count
    FROM courses c
    JOIN users u ON c.professor_id = u.id
    WHERE c.professor_id = $1
    ORDER BY c.created_at ASC
  `, [professorId]);

  const result = [];

  for (const course of coursesRes.rows) {
    // Get all assignments for this course
    const assignRes = await pool.query(`
      SELECT id, title, submission_type
      FROM assignments
      WHERE course_id = $1
    `, [course.id]);

    let courseExpectedSubmissions = 0;
    let courseConfirmedSubmissions = 0;

    for (const a of assignRes.rows) {
      // Find expected submissions for assignment `a`
      const targetRes = await pool.query(`
        SELECT target_type, group_id
        FROM assignment_targets
        WHERE assignment_id = $1
      `, [a.id]);

      const isAllStudents = targetRes.rows.some((t) => t.target_type === 'ALL_STUDENTS');

      let assignmentExpected = 0;
      if (isAllStudents) {
        // Enrolled students in this course
        assignmentExpected = course.student_count;
      } else {
        // Group members enrolled in course
        const groupMembersRes = await pool.query(`
          SELECT COUNT(DISTINCT gm.student_id)::int AS count
          FROM assignment_targets at
          JOIN group_members gm ON at.group_id = gm.group_id
          JOIN course_enrollments ce ON ce.student_id = gm.student_id AND ce.course_id = $2
          WHERE at.assignment_id = $1
        `, [a.id, course.id]);
        assignmentExpected = groupMembersRes.rows[0].count;
      }

      // Count confirmed submissions
      const confRes = await pool.query(`
        SELECT COUNT(*)::int AS count
        FROM submission_confirmations sc
        WHERE sc.assignment_id = $1
      `, [a.id]);
      const assignmentConfirmed = confRes.rows[0].count;

      courseExpectedSubmissions += assignmentExpected;
      courseConfirmedSubmissions += assignmentConfirmed;
    }

    const pendingCount = Math.max(0, courseExpectedSubmissions - courseConfirmedSubmissions);
    const completionPct = courseExpectedSubmissions > 0
      ? Math.round((courseConfirmedSubmissions / courseExpectedSubmissions) * 100)
      : 0;

    result.push({
      ...course,
      submitted_count: courseConfirmedSubmissions,
      pending_count: pendingCount,
      expected_count: courseExpectedSubmissions,
      completion_percentage: completionPct
    });
  }

  return result;
}

/**
 * Returns assignments for a specific course, respecting viewer role and permissions
 */
async function getCourseAssignments(courseId, user) {
  // Check if course exists
  const courseRes = await pool.query(`
    SELECT c.id, c.title, c.description, c.professor_id, u.name AS professor_name
    FROM courses c
    JOIN users u ON c.professor_id = u.id
    WHERE c.id = $1
  `, [courseId]);

  if (courseRes.rows.length === 0) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  const course = courseRes.rows[0];

  // If Student: Verify enrollment
  if (user.role === 'student') {
    const enrollRes = await pool.query(`
      SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2
    `, [courseId, user.id]);

    if (enrollRes.rows.length === 0) {
      const err = new Error('Access denied: You are not enrolled in this course');
      err.statusCode = 403;
      throw err;
    }

    // Get student's group and leader info
    const groupRes = await pool.query(`
      SELECT g.id, g.name, g.leader_id, u.name AS leader_name,
             (g.leader_id = $1) AS is_leader
      FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      JOIN users u ON g.leader_id = u.id
      WHERE gm.student_id = $1
    `, [user.id]);

    const studentGroup = groupRes.rows[0] || null;

    // Fetch assignments for this course targeted to ALL_STUDENTS or student's group
    let assignQuery = `
      SELECT DISTINCT a.id, a.title, a.description, a.due_date, a.onedrive_link,
             a.course_id, a.submission_type, a.created_by, a.created_at, a.updated_at,
             u.name AS creator_name, c.title AS course_title
      FROM assignments a
      JOIN users u ON a.created_by = u.id
      JOIN courses c ON a.course_id = c.id
      JOIN assignment_targets at ON a.id = at.assignment_id
      WHERE a.course_id = $1 AND (at.target_type = 'ALL_STUDENTS'
    `;
    const params = [courseId];

    if (studentGroup) {
      assignQuery += ` OR (at.target_type = 'GROUP' AND at.group_id = $2) `;
      params.push(studentGroup.id);
    }
    assignQuery += `) ORDER BY a.due_date ASC`;

    const assignList = await pool.query(assignQuery, params);
    const result = [];

    for (const a of assignList.rows) {
      // Personal submission status
      const subRes = await pool.query(`
        SELECT sc.id, sc.confirmed_at, sc.status, sc.confirmed_by_leader_id,
               lu.name AS confirmed_by_leader_name
        FROM submission_confirmations sc
        LEFT JOIN users lu ON sc.confirmed_by_leader_id = lu.id
        WHERE sc.assignment_id = $1 AND sc.student_id = $2
      `, [a.id, user.id]);

      const hasSubmitted = subRes.rows.length > 0;
      const submission = hasSubmitted ? subRes.rows[0] : null;

      // Group progress if in a group
      let groupProgress = null;
      if (studentGroup) {
        const totalMembersRes = await pool.query(
          'SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1',
          [studentGroup.id]
        );
        const totalMembers = totalMembersRes.rows[0].count;

        const confMembersRes = await pool.query(`
          SELECT COUNT(*)::int AS count
          FROM submission_confirmations sc
          JOIN group_members gm ON sc.student_id = gm.student_id
          WHERE sc.assignment_id = $1 AND gm.group_id = $2
        `, [a.id, studentGroup.id]);
        const confirmedMembers = confMembersRes.rows[0].count;

        groupProgress = {
          group_id: studentGroup.id,
          group_name: studentGroup.name,
          leader_id: studentGroup.leader_id,
          leader_name: studentGroup.leader_name,
          is_leader: studentGroup.is_leader,
          total_members: totalMembers,
          confirmed_members: confirmedMembers,
          progress_percentage: totalMembers > 0 ? Math.round((confirmedMembers / totalMembers) * 100) : 0,
          is_complete: totalMembers > 0 && confirmedMembers === totalMembers
        };
      }

      result.push({
        ...a,
        has_submitted: hasSubmitted,
        submission,
        group_progress: groupProgress,
        student_group: studentGroup
      });
    }

    return {
      course,
      assignments: result
    };
  }

  // If Admin: Return all assignments for the course with submission counts
  const assignRes = await pool.query(`
    SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link,
           a.course_id, a.submission_type, a.created_by, a.created_at, a.updated_at,
           u.name AS creator_name, c.title AS course_title,
           (SELECT COUNT(*)::int FROM submission_confirmations WHERE assignment_id = a.id) AS confirmed_count
    FROM assignments a
    JOIN users u ON a.created_by = u.id
    JOIN courses c ON a.course_id = c.id
    WHERE a.course_id = $1
    ORDER BY a.due_date ASC
  `, [courseId]);

  const result = [];
  for (const a of assignRes.rows) {
    const targetsRes = await pool.query(`
      SELECT at.target_type, at.group_id, g.name AS group_name
      FROM assignment_targets at
      LEFT JOIN groups g ON at.group_id = g.id
      WHERE at.assignment_id = $1
    `, [a.id]);

    result.push({
      ...a,
      targets: targetsRes.rows,
      target_summary: targetsRes.rows.some((t) => t.target_type === 'ALL_STUDENTS')
        ? 'All Students'
        : targetsRes.rows.map((t) => t.group_name).join(', ')
    });
  }

  return {
    course,
    assignments: result
  };
}

/**
 * Returns simple course list for admin dropdowns
 */
async function getAllCourses(professorId = null) {
  let query = 'SELECT id, title, description, professor_id, created_at FROM courses';
  const params = [];
  if (professorId) {
    query += ' WHERE professor_id = $1';
    params.push(professorId);
  }
  query += ' ORDER BY title ASC';

  const res = await pool.query(query, params);
  return res.rows;
}

module.exports = {
  getMyCourses,
  getTeachingCourses,
  getCourseAssignments,
  getAllCourses
};
