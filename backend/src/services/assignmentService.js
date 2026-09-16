const { pool } = require('../config/db');

async function createAssignment({ title, description, dueDate, onedriveLink, targetType, groupIds = [], adminId }) {
  if (!title || !description || !dueDate || !onedriveLink || !targetType) {
    const err = new Error('Title, description, due date, OneDrive link, and target type are required');
    err.statusCode = 400;
    throw err;
  }

  if (!['ALL_STUDENTS', 'GROUP'].includes(targetType)) {
    const err = new Error('Target type must be either ALL_STUDENTS or GROUP');
    err.statusCode = 400;
    throw err;
  }

  const parsedDueDate = new Date(dueDate);
  if (isNaN(parsedDueDate.getTime())) {
    const err = new Error('Invalid due date format');
    err.statusCode = 400;
    throw err;
  }

  // Validate OneDrive URL
  if (!onedriveLink.startsWith('http://') && !onedriveLink.startsWith('https://')) {
    const err = new Error('OneDrive link must be a valid URL starting with http:// or https://');
    err.statusCode = 400;
    throw err;
  }

  if (targetType === 'GROUP') {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      const err = new Error('At least one group must be selected when targeting specific groups');
      err.statusCode = 400;
      throw err;
    }

    // Verify all groups exist
    for (const gid of groupIds) {
      const gCheck = await pool.query('SELECT id FROM groups WHERE id = $1', [gid]);
      if (gCheck.rows.length === 0) {
        const err = new Error(`Target group with ID ${gid} does not exist`);
        err.statusCode = 400;
        throw err;
      }
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const assignRes = await client.query(`
      INSERT INTO assignments (title, description, due_date, onedrive_link, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, description, due_date, onedrive_link, created_by, created_at, updated_at
    `, [title.trim(), description.trim(), parsedDueDate, onedriveLink.trim(), adminId]);

    const assignment = assignRes.rows[0];

    if (targetType === 'ALL_STUDENTS') {
      await client.query(`
        INSERT INTO assignment_targets (assignment_id, target_type, group_id)
        VALUES ($1, 'ALL_STUDENTS', NULL)
      `, [assignment.id]);
    } else {
      for (const gid of groupIds) {
        await client.query(`
          INSERT INTO assignment_targets (assignment_id, target_type, group_id)
          VALUES ($1, 'GROUP', $2)
        `, [assignment.id, gid]);
      }
    }

    await client.query('COMMIT');

    // Fetch targets for response
    const targetsRes = await pool.query(`
      SELECT at.id, at.target_type, at.group_id, g.name AS group_name
      FROM assignment_targets at
      LEFT JOIN groups g ON at.group_id = g.id
      WHERE at.assignment_id = $1
    `, [assignment.id]);

    return {
      ...assignment,
      targets: targetsRes.rows
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateAssignment(assignmentId, { title, description, dueDate, onedriveLink, targetType, groupIds }, adminId) {
  const existingRes = await pool.query('SELECT * FROM assignments WHERE id = $1', [assignmentId]);
  if (existingRes.rows.length === 0) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }

  const existing = existingRes.rows[0];
  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newDescription = description !== undefined ? description.trim() : existing.description;
  const newLink = onedriveLink !== undefined ? onedriveLink.trim() : existing.onedrive_link;

  let newDueDate = existing.due_date;
  if (dueDate !== undefined) {
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) {
      const err = new Error('Invalid due date format');
      err.statusCode = 400;
      throw err;
    }
    newDueDate = d;
  }

  if (newLink && !newLink.startsWith('http://') && !newLink.startsWith('https://')) {
    const err = new Error('OneDrive link must be a valid URL starting with http:// or https://');
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query(`
      UPDATE assignments
      SET title = $1, description = $2, due_date = $3, onedrive_link = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, title, description, due_date, onedrive_link, created_by, created_at, updated_at
    `, [newTitle, newDescription, newDueDate, newLink, assignmentId]);

    const updated = updateRes.rows[0];

    // If targeting is updated
    if (targetType) {
      if (!['ALL_STUDENTS', 'GROUP'].includes(targetType)) {
        const err = new Error('Target type must be either ALL_STUDENTS or GROUP');
        err.statusCode = 400;
        throw err;
      }

      if (targetType === 'GROUP') {
        if (!Array.isArray(groupIds) || groupIds.length === 0) {
          const err = new Error('At least one group must be selected when targeting specific groups');
          err.statusCode = 400;
          throw err;
        }

        for (const gid of groupIds) {
          const gCheck = await client.query('SELECT id FROM groups WHERE id = $1', [gid]);
          if (gCheck.rows.length === 0) {
            const err = new Error(`Target group with ID ${gid} does not exist`);
            err.statusCode = 400;
            throw err;
          }
        }
      }

      // Remove existing targets and re-create without removing confirmations
      await client.query('DELETE FROM assignment_targets WHERE assignment_id = $1', [assignmentId]);

      if (targetType === 'ALL_STUDENTS') {
        await client.query(`
          INSERT INTO assignment_targets (assignment_id, target_type, group_id)
          VALUES ($1, 'ALL_STUDENTS', NULL)
        `, [assignmentId]);
      } else {
        for (const gid of groupIds) {
          await client.query(`
            INSERT INTO assignment_targets (assignment_id, target_type, group_id)
            VALUES ($1, 'GROUP', $2)
          `, [assignmentId, gid]);
        }
      }
    }

    await client.query('COMMIT');

    const targetsRes = await pool.query(`
      SELECT at.id, at.target_type, at.group_id, g.name AS group_name
      FROM assignment_targets at
      LEFT JOIN groups g ON at.group_id = g.id
      WHERE at.assignment_id = $1
    `, [assignmentId]);

    return {
      ...updated,
      targets: targetsRes.rows
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getAssignments(user) {
  if (user.role === 'admin') {
    // Admin sees all assignments with targets and total confirmation count
    const assignmentsRes = await pool.query(`
      SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link, a.created_by,
             a.created_at, a.updated_at, u.name AS creator_name,
             (SELECT COUNT(*)::int FROM submission_confirmations WHERE assignment_id = a.id) AS confirmed_count
      FROM assignments a
      JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
    `);

    const result = [];
    for (const a of assignmentsRes.rows) {
      const targetsRes = await pool.query(`
        SELECT at.target_type, at.group_id, g.name AS group_name
        FROM assignment_targets at
        LEFT JOIN groups g ON at.group_id = g.id
        WHERE at.assignment_id = $1
      `, [a.id]);

      result.push({
        ...a,
        targets: targetsRes.rows,
        target_summary: targetsRes.rows.some(t => t.target_type === 'ALL_STUDENTS')
          ? 'All Students'
          : targetsRes.rows.map(t => t.group_name).join(', ')
      });
    }

    return result;
  }

  // User is Student: Only return assignments targeted to ALL_STUDENTS or to Student's Group
  const studentGroupRes = await pool.query(
    'SELECT group_id FROM group_members WHERE student_id = $1',
    [user.id]
  );
  const studentGroupId = studentGroupRes.rows.length > 0 ? studentGroupRes.rows[0].group_id : null;

  let queryText = `
    SELECT DISTINCT a.id, a.title, a.description, a.due_date, a.onedrive_link, a.created_by,
           a.created_at, a.updated_at, u.name AS creator_name
    FROM assignments a
    JOIN users u ON a.created_by = u.id
    JOIN assignment_targets at ON a.id = at.assignment_id
    WHERE at.target_type = 'ALL_STUDENTS'
  `;
  const queryParams = [];

  if (studentGroupId) {
    queryText += ` OR (at.target_type = 'GROUP' AND at.group_id = $1) `;
    queryParams.push(studentGroupId);
  }

  queryText += ` ORDER BY a.due_date ASC `;

  const assignmentsRes = await pool.query(queryText, queryParams);
  const result = [];

  for (const a of assignmentsRes.rows) {
    // Check student's personal submission
    const subRes = await pool.query(
      'SELECT id, confirmed_at, status FROM submission_confirmations WHERE assignment_id = $1 AND student_id = $2',
      [a.id, user.id]
    );
    const hasSubmitted = subRes.rows.length > 0;
    const submissionDetails = hasSubmitted ? subRes.rows[0] : null;

    // Group progress for this assignment if student is in a group
    let groupProgress = null;
    if (studentGroupId) {
      const totalRes = await pool.query(
        'SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1',
        [studentGroupId]
      );
      const totalMembers = totalRes.rows[0].count;

      const confRes = await pool.query(`
        SELECT COUNT(*)::int AS count
        FROM submission_confirmations sc
        JOIN group_members gm ON sc.student_id = gm.student_id
        WHERE sc.assignment_id = $1 AND gm.group_id = $2
      `, [a.id, studentGroupId]);
      const confirmedMembers = confRes.rows[0].count;

      const progressPct = totalMembers > 0 ? Math.round((confirmedMembers / totalMembers) * 100) : 0;
      groupProgress = {
        group_id: studentGroupId,
        total_members: totalMembers,
        confirmed_members: confirmedMembers,
        pending_members: Math.max(0, totalMembers - confirmedMembers),
        progress_percentage: progressPct,
        is_complete: totalMembers > 0 && confirmedMembers === totalMembers
      };
    }

    // Get target info
    const targetsRes = await pool.query(`
      SELECT at.target_type, at.group_id, g.name AS group_name
      FROM assignment_targets at
      LEFT JOIN groups g ON at.group_id = g.id
      WHERE at.assignment_id = $1
    `, [a.id]);

    result.push({
      ...a,
      targets: targetsRes.rows,
      target_summary: targetsRes.rows.some(t => t.target_type === 'ALL_STUDENTS')
        ? 'All Students'
        : targetsRes.rows.map(t => t.group_name).join(', '),
      has_submitted: hasSubmitted,
      submission: submissionDetails,
      group_progress: groupProgress
    });
  }

  return result;
}

async function getAssignmentById(assignmentId, user) {
  const assignRes = await pool.query(`
    SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link, a.created_by,
           a.created_at, a.updated_at, u.name AS creator_name
    FROM assignments a
    JOIN users u ON a.created_by = u.id
    WHERE a.id = $1
  `, [assignmentId]);

  if (assignRes.rows.length === 0) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }

  const assignment = assignRes.rows[0];

  const targetsRes = await pool.query(`
    SELECT at.target_type, at.group_id, g.name AS group_name
    FROM assignment_targets at
    LEFT JOIN groups g ON at.group_id = g.id
    WHERE at.assignment_id = $1
  `, [assignmentId]);

  // If Student, verify assignment visibility
  if (user.role === 'student') {
    const isAllStudents = targetsRes.rows.some(t => t.target_type === 'ALL_STUDENTS');

    if (!isAllStudents) {
      const studentGroupRes = await pool.query(
        'SELECT group_id FROM group_members WHERE student_id = $1',
        [user.id]
      );
      const studentGroupId = studentGroupRes.rows.length > 0 ? studentGroupRes.rows[0].group_id : null;

      const isTargetedToGroup = targetsRes.rows.some(t => t.group_id === studentGroupId);
      if (!isTargetedToGroup) {
        const err = new Error('Access denied: This assignment is not targeted to you or your group');
        err.statusCode = 403;
        throw err;
      }
    }

    // Include personal submission and group progress
    const subRes = await pool.query(
      'SELECT id, confirmed_at, status FROM submission_confirmations WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, user.id]
    );
    const hasSubmitted = subRes.rows.length > 0;

    const studentGroupRes = await pool.query(
      'SELECT group_id FROM group_members WHERE student_id = $1',
      [user.id]
    );
    const studentGroupId = studentGroupRes.rows.length > 0 ? studentGroupRes.rows[0].group_id : null;

    let groupProgress = null;
    if (studentGroupId) {
      const totalRes = await pool.query(
        'SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1',
        [studentGroupId]
      );
      const totalMembers = totalRes.rows[0].count;

      const confRes = await pool.query(`
        SELECT COUNT(*)::int AS count
        FROM submission_confirmations sc
        JOIN group_members gm ON sc.student_id = gm.student_id
        WHERE sc.assignment_id = $1 AND gm.group_id = $2
      `, [assignmentId, studentGroupId]);
      const confirmedMembers = confRes.rows[0].count;

      groupProgress = {
        group_id: studentGroupId,
        total_members: totalMembers,
        confirmed_members: confirmedMembers,
        progress_percentage: totalMembers > 0 ? Math.round((confirmedMembers / totalMembers) * 100) : 0,
        is_complete: totalMembers > 0 && confirmedMembers === totalMembers
      };
    }

    return {
      ...assignment,
      targets: targetsRes.rows,
      has_submitted: hasSubmitted,
      submission: hasSubmitted ? subRes.rows[0] : null,
      group_progress: groupProgress
    };
  }

  // If Admin
  return {
    ...assignment,
    targets: targetsRes.rows
  };
}

module.exports = {
  createAssignment,
  updateAssignment,
  getAssignments,
  getAssignmentById
};
