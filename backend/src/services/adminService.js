const { pool } = require('../config/db');

async function getAssignmentGroupMonitoring(assignmentId) {
  const assignRes = await pool.query(`
    SELECT a.id, a.title, a.course_id, a.submission_type, c.title AS course_title
    FROM assignments a
    LEFT JOIN courses c ON a.course_id = c.id
    WHERE a.id = $1
  `, [assignmentId]);

  if (assignRes.rows.length === 0) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }
  const assignment = assignRes.rows[0];

  const targetsRes = await pool.query(
    'SELECT target_type, group_id FROM assignment_targets WHERE assignment_id = $1',
    [assignmentId]
  );
  const isAllStudents = targetsRes.rows.some((t) => t.target_type === 'ALL_STUDENTS');

  let relevantGroupsRes;
  if (isAllStudents) {
    relevantGroupsRes = await pool.query(`
      SELECT g.id, g.name, g.created_by, g.leader_id, g.created_at, u.name AS leader_name
      FROM groups g
      LEFT JOIN users u ON g.leader_id = u.id
      ORDER BY g.name ASC
    `);
  } else {
    relevantGroupsRes = await pool.query(`
      SELECT g.id, g.name, g.created_by, g.leader_id, g.created_at, u.name AS leader_name
      FROM groups g
      JOIN assignment_targets at ON g.id = at.group_id
      LEFT JOIN users u ON g.leader_id = u.id
      WHERE at.assignment_id = $1
      ORDER BY g.name ASC
    `, [assignmentId]);
  }

  const groupsMonitoring = [];

  for (const group of relevantGroupsRes.rows) {
    // Group members with submission status
    const membersRes = await pool.query(`
      SELECT u.id, u.name, u.email, gm.joined_at,
        (u.id = $3) AS is_leader,
        CASE WHEN sc.id IS NOT NULL THEN 'confirmed' ELSE 'pending' END AS status,
        sc.confirmed_at,
        sc.confirmed_by_leader_id,
        lu.name AS confirmed_by_leader_name
      FROM group_members gm
      JOIN users u ON gm.student_id = u.id
      LEFT JOIN submission_confirmations sc ON sc.assignment_id = $1 AND sc.student_id = u.id
      LEFT JOIN users lu ON sc.confirmed_by_leader_id = lu.id
      WHERE gm.group_id = $2
      ORDER BY u.name ASC
    `, [assignmentId, group.id, group.leader_id]);

    const totalMembers = membersRes.rows.length;
    const confirmedCount = membersRes.rows.filter((m) => m.status === 'confirmed').length;
    const pendingCount = totalMembers - confirmedCount;
    const percentage = totalMembers > 0 ? Math.round((confirmedCount / totalMembers) * 100) : 0;

    groupsMonitoring.push({
      group_id: group.id,
      group_name: group.name,
      leader_id: group.leader_id,
      leader_name: group.leader_name,
      total_members: totalMembers,
      confirmed_members: confirmedCount,
      pending_members: pendingCount,
      progress_percentage: percentage,
      is_complete: totalMembers > 0 && confirmedCount === totalMembers,
      members: membersRes.rows
    });
  }

  return {
    assignment,
    groups: groupsMonitoring
  };
}

async function getAssignmentStudentMonitoring(assignmentId, statusFilter = null) {
  const assignRes = await pool.query(`
    SELECT a.id, a.title, a.course_id, a.submission_type, c.title AS course_title
    FROM assignments a
    LEFT JOIN courses c ON a.course_id = c.id
    WHERE a.id = $1
  `, [assignmentId]);

  if (assignRes.rows.length === 0) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }
  const assignment = assignRes.rows[0];

  const targetsRes = await pool.query(
    'SELECT target_type, group_id FROM assignment_targets WHERE assignment_id = $1',
    [assignmentId]
  );
  const isAllStudents = targetsRes.rows.some((t) => t.target_type === 'ALL_STUDENTS');

  // Build filter clause for status
  let statusClause = '';
  if (statusFilter) {
    const cleanFilter = statusFilter.toUpperCase();
    if (cleanFilter === 'SUBMITTED' || cleanFilter === 'CONFIRMED') {
      statusClause = ' AND sc.id IS NOT NULL ';
    } else if (cleanFilter === 'PENDING') {
      statusClause = ' AND sc.id IS NULL ';
    }
  }

  let studentsRes;
  if (isAllStudents) {
    // If targeted to ALL_STUDENTS, filter by course enrollment if course is set
    let courseEnrollJoin = '';
    const queryParams = [assignmentId];

    if (assignment.course_id) {
      courseEnrollJoin = ' JOIN course_enrollments ce ON u.id = ce.student_id AND ce.course_id = $2 ';
      queryParams.push(assignment.course_id);
    }

    const query = `
      SELECT u.id AS student_id, u.name AS student_name, u.email AS student_email,
             g.id AS group_id, COALESCE(g.name, 'No Group') AS group_name,
             g.leader_id, lu_leader.name AS leader_name,
             (g.leader_id = u.id) AS is_group_leader,
             CASE WHEN sc.id IS NOT NULL THEN 'confirmed' ELSE 'pending' END AS status,
             sc.confirmed_at,
             sc.confirmed_by_leader_id,
             lu_sub.name AS confirmed_by_leader_name
      FROM users u
      ${courseEnrollJoin}
      LEFT JOIN group_members gm ON u.id = gm.student_id
      LEFT JOIN groups g ON gm.group_id = g.id
      LEFT JOIN users lu_leader ON g.leader_id = lu_leader.id
      LEFT JOIN submission_confirmations sc ON sc.assignment_id = $1 AND sc.student_id = u.id
      LEFT JOIN users lu_sub ON sc.confirmed_by_leader_id = lu_sub.id
      WHERE u.role = 'student' ${statusClause}
      ORDER BY g.name NULLS LAST, u.name ASC
    `;
    studentsRes = await pool.query(query, queryParams);
  } else {
    const query = `
      SELECT u.id AS student_id, u.name AS student_name, u.email AS student_email,
             g.id AS group_id, g.name AS group_name,
             g.leader_id, lu_leader.name AS leader_name,
             (g.leader_id = u.id) AS is_group_leader,
             CASE WHEN sc.id IS NOT NULL THEN 'confirmed' ELSE 'pending' END AS status,
             sc.confirmed_at,
             sc.confirmed_by_leader_id,
             lu_sub.name AS confirmed_by_leader_name
      FROM assignment_targets at
      JOIN groups g ON at.group_id = g.id
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON gm.student_id = u.id
      LEFT JOIN users lu_leader ON g.leader_id = lu_leader.id
      LEFT JOIN submission_confirmations sc ON sc.assignment_id = $1 AND sc.student_id = u.id
      LEFT JOIN users lu_sub ON sc.confirmed_by_leader_id = lu_sub.id
      WHERE at.assignment_id = $1 AND u.role = 'student' ${statusClause}
      ORDER BY g.name ASC, u.name ASC
    `;
    studentsRes = await pool.query(query, [assignmentId]);
  }

  return {
    assignment,
    status_filter: statusFilter || 'ALL',
    students: studentsRes.rows
  };
}

async function getCompletionAnalytics(assignmentIdFilter = null) {
  let assignmentsQuery = `
    SELECT a.id, a.title, a.due_date, a.course_id, a.submission_type, c.title AS course_title,
      (SELECT target_type FROM assignment_targets WHERE assignment_id = a.id LIMIT 1) AS target_type
    FROM assignments a
    LEFT JOIN courses c ON a.course_id = c.id
  `;
  const queryParams = [];

  if (assignmentIdFilter) {
    assignmentsQuery += ' WHERE a.id = $1';
    queryParams.push(assignmentIdFilter);
  }
  assignmentsQuery += ' ORDER BY a.created_at DESC';

  const assignmentsRes = await pool.query(assignmentsQuery, queryParams);

  let totalExpected = 0;
  let totalConfirmed = 0;
  const byAssignment = [];

  for (const a of assignmentsRes.rows) {
    let expectedCount = 0;
    if (a.target_type === 'ALL_STUDENTS') {
      if (a.course_id) {
        const studentCountRes = await pool.query(
          'SELECT COUNT(*)::int AS count FROM course_enrollments WHERE course_id = $1',
          [a.course_id]
        );
        expectedCount = studentCountRes.rows[0].count;
      } else {
        const studentCountRes = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'student'");
        expectedCount = studentCountRes.rows[0].count;
      }
    } else {
      const groupMembersCountRes = await pool.query(`
        SELECT COUNT(DISTINCT gm.student_id)::int AS count
        FROM assignment_targets at
        JOIN group_members gm ON at.group_id = gm.group_id
        WHERE at.assignment_id = $1
      `, [a.id]);
      expectedCount = groupMembersCountRes.rows[0].count;
    }

    const confirmedRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM submission_confirmations WHERE assignment_id = $1',
      [a.id]
    );
    const confirmedCount = confirmedRes.rows[0].count;
    const pendingCount = Math.max(0, expectedCount - confirmedCount);
    const pct = expectedCount > 0 ? Math.round((confirmedCount / expectedCount) * 100) : 0;

    totalExpected += expectedCount;
    totalConfirmed += confirmedCount;

    byAssignment.push({
      assignment_id: a.id,
      title: a.title,
      course_id: a.course_id,
      course_title: a.course_title,
      submission_type: a.submission_type,
      due_date: a.due_date,
      target_type: a.target_type,
      expected_submissions: expectedCount,
      confirmed_submissions: confirmedCount,
      pending_submissions: pendingCount,
      completion_percentage: pct
    });
  }

  const overallPct = totalExpected > 0 ? Math.round((totalConfirmed / totalExpected) * 100) : 0;

  return {
    total_expected: totalExpected,
    total_confirmed: totalConfirmed,
    total_pending: Math.max(0, totalExpected - totalConfirmed),
    completion_percentage: overallPct,
    assignments: byAssignment
  };
}

async function getGroupPerformanceAnalytics() {
  const groupsRes = await pool.query(`
    SELECT g.id, g.name, g.leader_id, u.name AS leader_name
    FROM groups g
    LEFT JOIN users u ON g.leader_id = u.id
    ORDER BY g.name ASC
  `);

  const groupPerformance = [];

  for (const group of groupsRes.rows) {
    const memberCountRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1',
      [group.id]
    );
    const memberCount = memberCountRes.rows[0].count;

    const assignmentsCountRes = await pool.query(`
      SELECT COUNT(DISTINCT a.id)::int AS count
      FROM assignments a
      JOIN assignment_targets at ON a.id = at.assignment_id
      WHERE at.target_type = 'ALL_STUDENTS' OR (at.target_type = 'GROUP' AND at.group_id = $1)
    `, [group.id]);
    const assignmentsCount = assignmentsCountRes.rows[0].count;

    const expectedConfirmations = memberCount * assignmentsCount;

    const confirmedRes = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM submission_confirmations sc
      JOIN group_members gm ON sc.student_id = gm.student_id
      WHERE gm.group_id = $1
        AND sc.assignment_id IN (
          SELECT a.id FROM assignments a
          JOIN assignment_targets at ON a.id = at.assignment_id
          WHERE at.target_type = 'ALL_STUDENTS' OR (at.target_type = 'GROUP' AND at.group_id = $1)
        )
    `, [group.id]);

    const confirmedConfirmations = confirmedRes.rows[0].count;
    const completionPercentage = expectedConfirmations > 0
      ? Math.round((confirmedConfirmations / expectedConfirmations) * 100)
      : 0;

    groupPerformance.push({
      group_id: group.id,
      group_name: group.name,
      leader_id: group.leader_id,
      leader_name: group.leader_name,
      member_count: memberCount,
      assignments_count: assignmentsCount,
      expected_submissions: expectedConfirmations,
      confirmed_submissions: confirmedConfirmations,
      pending_submissions: Math.max(0, expectedConfirmations - confirmedConfirmations),
      completion_percentage: completionPercentage
    });
  }

  return groupPerformance;
}

async function getDashboardSummary() {
  const [studentsRes, groupsRes, assignmentsRes, coursesRes, analytics] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'student'"),
    pool.query('SELECT COUNT(*)::int AS count FROM groups'),
    pool.query('SELECT COUNT(*)::int AS count FROM assignments'),
    pool.query('SELECT COUNT(*)::int AS count FROM courses'),
    getCompletionAnalytics()
  ]);

  // Recent 5 submissions
  const recentSubmissionsRes = await pool.query(`
    SELECT sc.id, sc.confirmed_at, sc.confirmed_by_leader_id,
           u.name AS student_name, u.email AS student_email,
           a.title AS assignment_title, a.submission_type,
           c.title AS course_title,
           COALESCE(g.name, 'No Group') AS group_name,
           lu.name AS confirmed_by_leader_name
    FROM submission_confirmations sc
    JOIN users u ON sc.student_id = u.id
    JOIN assignments a ON sc.assignment_id = a.id
    LEFT JOIN courses c ON a.course_id = c.id
    LEFT JOIN group_members gm ON u.id = gm.student_id
    LEFT JOIN groups g ON gm.group_id = g.id
    LEFT JOIN users lu ON sc.confirmed_by_leader_id = lu.id
    ORDER BY sc.confirmed_at DESC
    LIMIT 5
  `);

  return {
    total_students: studentsRes.rows[0].count,
    total_groups: groupsRes.rows[0].count,
    total_assignments: assignmentsRes.rows[0].count,
    total_courses: coursesRes.rows[0].count,
    overall_completion_percentage: analytics.completion_percentage,
    total_confirmed: analytics.total_confirmed,
    total_expected: analytics.total_expected,
    recent_submissions: recentSubmissionsRes.rows
  };
}

module.exports = {
  getAssignmentGroupMonitoring,
  getAssignmentStudentMonitoring,
  getCompletionAnalytics,
  getGroupPerformanceAnalytics,
  getDashboardSummary
};
