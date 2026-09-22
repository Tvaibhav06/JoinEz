const { pool } = require('../config/db');

async function createGroup({ name, studentId }) {
  if (!name || !name.trim()) {
    const err = new Error('Group name is required');
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if student already belongs to a group
    const existingMembership = await client.query(
      'SELECT group_id FROM group_members WHERE student_id = $1',
      [studentId]
    );

    if (existingMembership.rows.length > 0) {
      const err = new Error('You are already a member of a group. A student may belong to only one group at a time.');
      err.statusCode = 409;
      throw err;
    }

    // Create group with student as both creator and default leader
    const groupRes = await client.query(`
      INSERT INTO groups (name, created_by, leader_id)
      VALUES ($1, $2, $2)
      RETURNING id, name, created_by, leader_id, created_at
    `, [name.trim(), studentId]);
    const group = groupRes.rows[0];

    // Add creator as first member
    await client.query(`
      INSERT INTO group_members (group_id, student_id)
      VALUES ($1, $2)
    `, [group.id, studentId]);

    await client.query('COMMIT');

    // Return group with members
    const membersRes = await pool.query(`
      SELECT u.id, u.name, u.email, gm.joined_at,
             (u.id = $2) AS is_creator,
             (u.id = $3) AS is_leader
      FROM group_members gm
      JOIN users u ON gm.student_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.joined_at ASC
    `, [group.id, group.created_by, group.leader_id]);

    const leaderRes = await pool.query('SELECT name FROM users WHERE id = $1', [group.leader_id]);

    return {
      ...group,
      leader_name: leaderRes.rows[0]?.name || null,
      members: membersRes.rows
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getMyGroup(studentId) {
  const groupRes = await pool.query(`
    SELECT g.id, g.name, g.created_by, g.leader_id, g.created_at,
           u.name AS creator_name, u.email AS creator_email,
           lu.name AS leader_name, lu.email AS leader_email
    FROM group_members gm
    JOIN groups g ON gm.group_id = g.id
    JOIN users u ON g.created_by = u.id
    LEFT JOIN users lu ON g.leader_id = lu.id
    WHERE gm.student_id = $1
  `, [studentId]);

  if (groupRes.rows.length === 0) {
    return null;
  }

  const group = groupRes.rows[0];
  const membersRes = await pool.query(`
    SELECT u.id, u.name, u.email, gm.joined_at,
           (u.id = $2) AS is_creator,
           (u.id = $3) AS is_leader
    FROM group_members gm
    JOIN users u ON gm.student_id = u.id
    WHERE gm.group_id = $1
    ORDER BY gm.joined_at ASC
  `, [group.id, group.created_by, group.leader_id]);

  return {
    ...group,
    is_leader: group.leader_id === studentId,
    members: membersRes.rows
  };
}

async function getGroupById(groupId, user) {
  const groupRes = await pool.query(`
    SELECT g.id, g.name, g.created_by, g.leader_id, g.created_at,
           u.name AS creator_name, u.email AS creator_email,
           lu.name AS leader_name, lu.email AS leader_email
    FROM groups g
    JOIN users u ON g.created_by = u.id
    LEFT JOIN users lu ON g.leader_id = lu.id
    WHERE g.id = $1
  `, [groupId]);

  if (groupRes.rows.length === 0) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  const group = groupRes.rows[0];

  // If user is a student, ensure they belong to this group
  if (user.role === 'student') {
    const memberCheck = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND student_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rows.length === 0) {
      const err = new Error('Access denied: You are not a member of this group');
      err.statusCode = 403;
      throw err;
    }
  }

  const membersRes = await pool.query(`
    SELECT u.id, u.name, u.email, gm.joined_at,
           (u.id = $2) AS is_creator,
           (u.id = $3) AS is_leader
    FROM group_members gm
    JOIN users u ON gm.student_id = u.id
    WHERE gm.group_id = $1
    ORDER BY gm.joined_at ASC
  `, [groupId, group.created_by, group.leader_id]);

  return {
    ...group,
    is_leader: user.role === 'student' ? group.leader_id === user.id : false,
    members: membersRes.rows
  };
}

async function addMember(groupId, { emailOrId }, requestingUserId) {
  if (!emailOrId || !emailOrId.toString().trim()) {
    const err = new Error('Student email or Student ID is required');
    err.statusCode = 400;
    throw err;
  }

  // 1. Verify caller is a member of this group
  const callerCheck = await pool.query(
    'SELECT 1 FROM group_members WHERE group_id = $1 AND student_id = $2',
    [groupId, requestingUserId]
  );
  if (callerCheck.rows.length === 0) {
    const err = new Error('Access denied: Only group members can add new members');
    err.statusCode = 403;
    throw err;
  }

  const queryTerm = emailOrId.toString().trim();
  const isNumericId = /^\d+$/.test(queryTerm);

  // 2. Locate target student
  let targetUserRes;
  if (isNumericId) {
    targetUserRes = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1 OR LOWER(email) = LOWER($2)',
      [parseInt(queryTerm, 10), queryTerm]
    );
  } else {
    targetUserRes = await pool.query(
      'SELECT id, name, email, role FROM users WHERE LOWER(email) = LOWER($1)',
      [queryTerm]
    );
  }

  if (targetUserRes.rows.length === 0) {
    const err = new Error(`Student not found with identifier: ${queryTerm}`);
    err.statusCode = 404;
    throw err;
  }

  const targetStudent = targetUserRes.rows[0];

  // 3. Verify target is a student
  if (targetStudent.role !== 'student') {
    const err = new Error('Cannot add an admin to a student group');
    err.statusCode = 400;
    throw err;
  }

  // 4. Check if target is already in this group
  const inThisGroup = await pool.query(
    'SELECT 1 FROM group_members WHERE group_id = $1 AND student_id = $2',
    [groupId, targetStudent.id]
  );
  if (inThisGroup.rows.length > 0) {
    const err = new Error('Student is already a member of this group');
    err.statusCode = 409;
    throw err;
  }

  // 5. Check if target is already in another group
  const inOtherGroup = await pool.query(
    'SELECT g.name FROM group_members gm JOIN groups g ON gm.group_id = g.id WHERE gm.student_id = $1',
    [targetStudent.id]
  );
  if (inOtherGroup.rows.length > 0) {
    const err = new Error(`Student already belongs to another group ("${inOtherGroup.rows[0].name}"). Students may belong to only one group.`);
    err.statusCode = 409;
    throw err;
  }

  // 6. Insert membership
  await pool.query(
    'INSERT INTO group_members (group_id, student_id) VALUES ($1, $2)',
    [groupId, targetStudent.id]
  );

  // 7. Return updated members list
  const groupRes = await pool.query('SELECT created_by, leader_id FROM groups WHERE id = $1', [groupId]);
  const creatorId = groupRes.rows[0].created_by;
  const leaderId = groupRes.rows[0].leader_id;

  const membersRes = await pool.query(`
    SELECT u.id, u.name, u.email, gm.joined_at,
           (u.id = $2) AS is_creator,
           (u.id = $3) AS is_leader
    FROM group_members gm
    JOIN users u ON gm.student_id = u.id
    WHERE gm.group_id = $1
    ORDER BY gm.joined_at ASC
  `, [groupId, creatorId, leaderId]);

  return {
    message: `Added ${targetStudent.name} to the group`,
    members: membersRes.rows
  };
}

async function getGroupProgress(groupId, user) {
  // Authorization check
  if (user.role === 'student') {
    const memberCheck = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND student_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rows.length === 0) {
      const err = new Error('Access denied: You are not a member of this group');
      err.statusCode = 403;
      throw err;
    }
  }

  // Get total current group members
  const memberCountRes = await pool.query(
    'SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1',
    [groupId]
  );
  const totalMembers = memberCountRes.rows[0].count;

  // Find all assignments targeted to ALL_STUDENTS or specifically to this group
  const assignmentsRes = await pool.query(`
    SELECT DISTINCT a.id, a.title, a.description, a.due_date, a.onedrive_link,
           a.submission_type, a.course_id, c.title AS course_title,
      (SELECT target_type FROM assignment_targets WHERE assignment_id = a.id LIMIT 1) AS target_type
    FROM assignments a
    LEFT JOIN courses c ON a.course_id = c.id
    JOIN assignment_targets at ON a.id = at.assignment_id
    WHERE at.target_type = 'ALL_STUDENTS' OR (at.target_type = 'GROUP' AND at.group_id = $1)
    ORDER BY a.due_date ASC
  `, [groupId]);

  const progressList = [];

  for (const assignment of assignmentsRes.rows) {
    // Count confirmed submissions from current group members for this assignment
    const confirmedRes = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM submission_confirmations sc
      JOIN group_members gm ON sc.student_id = gm.student_id
      WHERE sc.assignment_id = $1 AND gm.group_id = $2
    `, [assignment.id, groupId]);

    const confirmedMembers = confirmedRes.rows[0].count;
    const progressPercentage = totalMembers > 0
      ? Math.round((confirmedMembers / totalMembers) * 100)
      : 0;

    // Check caller's own submission status if student
    let userSubmission = null;
    if (user.role === 'student') {
      const subRes = await pool.query(`
        SELECT sc.confirmed_at, sc.status, sc.confirmed_by_leader_id, lu.name AS leader_name
        FROM submission_confirmations sc
        LEFT JOIN users lu ON sc.confirmed_by_leader_id = lu.id
        WHERE sc.assignment_id = $1 AND sc.student_id = $2
      `, [assignment.id, user.id]);
      if (subRes.rows.length > 0) {
        userSubmission = subRes.rows[0];
      }
    }

    // Get list of group members with their submission status for this assignment
    const memberStatusesRes = await pool.query(`
      SELECT u.id, u.name, u.email,
        CASE WHEN sc.id IS NOT NULL THEN 'confirmed' ELSE 'pending' END AS status,
        sc.confirmed_at,
        sc.confirmed_by_leader_id
      FROM group_members gm
      JOIN users u ON gm.student_id = u.id
      LEFT JOIN submission_confirmations sc ON sc.assignment_id = $1 AND sc.student_id = u.id
      WHERE gm.group_id = $2
      ORDER BY u.name ASC
    `, [assignment.id, groupId]);

    progressList.push({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        onedrive_link: assignment.onedrive_link,
        submission_type: assignment.submission_type,
        course_id: assignment.course_id,
        course_title: assignment.course_title,
        target_type: assignment.target_type
      },
      group_id: groupId,
      total_members: totalMembers,
      confirmed_members: confirmedMembers,
      pending_members: Math.max(0, totalMembers - confirmedMembers),
      progress_percentage: progressPercentage,
      is_complete: totalMembers > 0 && confirmedMembers === totalMembers,
      user_submission: userSubmission,
      member_statuses: memberStatusesRes.rows
    });
  }

  return progressList;
}

module.exports = {
  createGroup,
  getMyGroup,
  getGroupById,
  addMember,
  getGroupProgress
};
