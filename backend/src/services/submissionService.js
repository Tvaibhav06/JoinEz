const { pool } = require('../config/db');

async function verifyStudentAssignmentAccess(assignmentId, studentId) {
  const assignRes = await pool.query('SELECT id FROM assignments WHERE id = $1', [assignmentId]);
  if (assignRes.rows.length === 0) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }

  // Check if targets ALL_STUDENTS
  const allStudentsTarget = await pool.query(
    "SELECT 1 FROM assignment_targets WHERE assignment_id = $1 AND target_type = 'ALL_STUDENTS'",
    [assignmentId]
  );
  if (allStudentsTarget.rows.length > 0) {
    return true;
  }

  // Check if targets student's group
  const groupTarget = await pool.query(`
    SELECT 1
    FROM assignment_targets at
    JOIN group_members gm ON at.group_id = gm.group_id
    WHERE at.assignment_id = $1 AND gm.student_id = $2
  `, [assignmentId, studentId]);

  if (groupTarget.rows.length === 0) {
    const err = new Error('Access denied: You do not have access to this assignment');
    err.statusCode = 403;
    throw err;
  }

  return true;
}

async function recordStep1(assignmentId, studentId) {
  await verifyStudentAssignmentAccess(assignmentId, studentId);

  // Check if already confirmed
  const existing = await pool.query(
    'SELECT id, confirmed_at FROM submission_confirmations WHERE assignment_id = $1 AND student_id = $2',
    [assignmentId, studentId]
  );
  if (existing.rows.length > 0) {
    const err = new Error('You have already confirmed submission for this assignment');
    err.statusCode = 409;
    throw err;
  }

  return {
    step1_selected: true,
    step1_selected_at: new Date(),
    assignment_id: assignmentId,
    student_id: studentId,
    message: 'Step 1 recorded. Please confirm your final submission.'
  };
}

async function confirmSubmission(assignmentId, studentId) {
  await verifyStudentAssignmentAccess(assignmentId, studentId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check duplicate
    const existing = await client.query(
      'SELECT id, confirmed_at FROM submission_confirmations WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, studentId]
    );
    if (existing.rows.length > 0) {
      const err = new Error('You have already confirmed submission for this assignment');
      err.statusCode = 409;
      throw err;
    }

    const insertRes = await client.query(`
      INSERT INTO submission_confirmations (assignment_id, student_id, step1_selected_at, confirmed_at, status)
      VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'confirmed')
      RETURNING id, assignment_id, student_id, step1_selected_at, confirmed_at, status
    `, [assignmentId, studentId]);

    await client.query('COMMIT');
    return insertRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getSubmissionStatus(assignmentId, studentId) {
  await verifyStudentAssignmentAccess(assignmentId, studentId);

  const subRes = await pool.query(
    'SELECT id, assignment_id, student_id, step1_selected_at, confirmed_at, status FROM submission_confirmations WHERE assignment_id = $1 AND student_id = $2',
    [assignmentId, studentId]
  );

  const hasSubmitted = subRes.rows.length > 0;
  return {
    assignment_id: assignmentId,
    student_id: studentId,
    has_submitted: hasSubmitted,
    submission: hasSubmitted ? subRes.rows[0] : null
  };
}

module.exports = {
  recordStep1,
  confirmSubmission,
  getSubmissionStatus
};
