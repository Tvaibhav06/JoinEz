const { pool } = require('../config/db');

async function verifyStudentAssignmentAccess(assignmentId, studentId) {
  const assignRes = await pool.query(
    'SELECT id, title, course_id, submission_type FROM assignments WHERE id = $1',
    [assignmentId]
  );
  if (assignRes.rows.length === 0) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }
  const assignment = assignRes.rows[0];

  // 1. Verify course enrollment if course is assigned
  if (assignment.course_id) {
    const enrollRes = await pool.query(
      'SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2',
      [assignment.course_id, studentId]
    );
    if (enrollRes.rows.length === 0) {
      const err = new Error('Access denied: You are not enrolled in the course for this assignment');
      err.statusCode = 403;
      throw err;
    }
  }

  // 2. Check if targets ALL_STUDENTS
  const allStudentsTarget = await pool.query(
    "SELECT 1 FROM assignment_targets WHERE assignment_id = $1 AND target_type = 'ALL_STUDENTS'",
    [assignmentId]
  );
  if (allStudentsTarget.rows.length > 0) {
    return assignment;
  }

  // 3. Check if targets student's group
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

  return assignment;
}

async function recordStep1(assignmentId, studentId) {
  const assignment = await verifyStudentAssignmentAccess(assignmentId, studentId);

  // Check if Group assignment
  if (assignment.submission_type === 'GROUP') {
    // 1. Fetch student's group and leader info
    const groupRes = await pool.query(`
      SELECT g.id, g.name, g.leader_id, u.name AS leader_name
      FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      JOIN users u ON g.leader_id = u.id
      WHERE gm.student_id = $1
    `, [studentId]);

    if (groupRes.rows.length === 0) {
      const err = new Error('You must be a member of a group to submit a group assignment');
      err.statusCode = 400;
      throw err;
    }

    const group = groupRes.rows[0];

    // 2. Enforce leader-only submission acknowledgment
    if (group.leader_id !== studentId) {
      const err = new Error(`Access denied: Only the group leader (${group.leader_name}) can acknowledge submission for group assignments`);
      err.statusCode = 403;
      throw err;
    }

    // 3. Check if this group already has a confirmed submission
    const existingGroupSub = await pool.query(`
      SELECT sc.id, sc.confirmed_at
      FROM submission_confirmations sc
      JOIN group_members gm ON sc.student_id = gm.student_id
      WHERE sc.assignment_id = $1 AND gm.group_id = $2
      LIMIT 1
    `, [assignmentId, group.id]);

    if (existingGroupSub.rows.length > 0) {
      const err = new Error('Your group has already confirmed submission for this assignment');
      err.statusCode = 409;
      throw err;
    }

    return {
      step1_selected: true,
      step1_selected_at: new Date(),
      assignment_id: assignmentId,
      student_id: studentId,
      submission_type: 'GROUP',
      is_leader: true,
      group_name: group.name,
      message: `Step 1 recorded for ${group.name}. As group leader, confirm to submit for all team members.`
    };
  }

  // Individual assignment
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
    submission_type: 'INDIVIDUAL',
    message: 'Step 1 recorded. Please confirm your final submission.'
  };
}

async function confirmSubmission(assignmentId, studentId) {
  const assignment = await verifyStudentAssignmentAccess(assignmentId, studentId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Handle GROUP assignment
    if (assignment.submission_type === 'GROUP') {
      // 1. Fetch student's group
      const groupRes = await client.query(`
        SELECT g.id, g.name, g.leader_id, u.name AS leader_name
        FROM group_members gm
        JOIN groups g ON gm.group_id = g.id
        JOIN users u ON g.leader_id = u.id
        WHERE gm.student_id = $1
      `, [studentId]);

      if (groupRes.rows.length === 0) {
        const err = new Error('You must be a member of a group to submit a group assignment');
        err.statusCode = 400;
        throw err;
      }

      const group = groupRes.rows[0];

      // 2. Enforce leader-only check
      if (group.leader_id !== studentId) {
        const err = new Error(`Access denied: Only the group leader (${group.leader_name}) can acknowledge submission for group assignments`);
        err.statusCode = 403;
        throw err;
      }

      // 3. Check duplicate submission for group
      const existingGroupSub = await client.query(`
        SELECT sc.id
        FROM submission_confirmations sc
        JOIN group_members gm ON sc.student_id = gm.student_id
        WHERE sc.assignment_id = $1 AND gm.group_id = $2
        LIMIT 1
      `, [assignmentId, group.id]);

      if (existingGroupSub.rows.length > 0) {
        const err = new Error('Your group has already confirmed submission for this assignment');
        err.statusCode = 409;
        throw err;
      }

      // 4. Retrieve all current members of this group
      const membersRes = await client.query(
        'SELECT student_id FROM group_members WHERE group_id = $1',
        [group.id]
      );
      const memberIds = membersRes.rows.map((m) => m.student_id);

      // 5. Transactionally insert confirmation records for all group members with confirmed_by_leader_id
      for (const memberId of memberIds) {
        await client.query(`
          INSERT INTO submission_confirmations (
            assignment_id, student_id, step1_selected_at, confirmed_at, status, confirmed_by_leader_id
          )
          VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'confirmed', $3)
          ON CONFLICT (assignment_id, student_id)
          DO UPDATE SET confirmed_by_leader_id = $3, confirmed_at = CURRENT_TIMESTAMP
        `, [assignmentId, memberId, studentId]);
      }

      await client.query('COMMIT');

      return {
        assignment_id: assignmentId,
        group_id: group.id,
        group_name: group.name,
        submission_type: 'GROUP',
        confirmed_by_leader_id: studentId,
        confirmed_members_count: memberIds.length,
        status: 'confirmed',
        message: `Group submission confirmed for all ${memberIds.length} members of ${group.name}`
      };
    }

    // Handle INDIVIDUAL assignment
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
      INSERT INTO submission_confirmations (
        assignment_id, student_id, step1_selected_at, confirmed_at, status, confirmed_by_leader_id
      )
      VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'confirmed', NULL)
      RETURNING id, assignment_id, student_id, step1_selected_at, confirmed_at, status, confirmed_by_leader_id
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
  const assignment = await verifyStudentAssignmentAccess(assignmentId, studentId);

  const subRes = await pool.query(`
    SELECT sc.id, sc.assignment_id, sc.student_id, sc.step1_selected_at, sc.confirmed_at,
           sc.status, sc.confirmed_by_leader_id, lu.name AS leader_name
    FROM submission_confirmations sc
    LEFT JOIN users lu ON sc.confirmed_by_leader_id = lu.id
    WHERE sc.assignment_id = $1 AND sc.student_id = $2
  `, [assignmentId, studentId]);

  const hasSubmitted = subRes.rows.length > 0;

  let isLeader = false;
  let leaderName = null;
  if (assignment.submission_type === 'GROUP') {
    const groupRes = await pool.query(`
      SELECT g.id, g.leader_id, u.name AS leader_name
      FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      JOIN users u ON g.leader_id = u.id
      WHERE gm.student_id = $1
    `, [studentId]);
    if (groupRes.rows.length > 0) {
      isLeader = groupRes.rows[0].leader_id === studentId;
      leaderName = groupRes.rows[0].leader_name;
    }
  }

  return {
    assignment_id: assignmentId,
    student_id: studentId,
    submission_type: assignment.submission_type,
    is_leader: isLeader,
    leader_name: leaderName,
    has_submitted: hasSubmitted,
    submission: hasSubmitted ? subRes.rows[0] : null
  };
}

module.exports = {
  recordStep1,
  confirmSubmission,
  getSubmissionStatus
};
