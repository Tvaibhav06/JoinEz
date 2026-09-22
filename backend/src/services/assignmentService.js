const { pool } = require('../config/db');

async function createAssignment({
  title,
  description,
  dueDate,
  onedriveLink,
  targetType,
  groupIds = [],
  courseId,
  submissionType = 'INDIVIDUAL',
  adminId
}) {
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

  const subType = submissionType ? submissionType.toUpperCase() : 'INDIVIDUAL';
  if (!['INDIVIDUAL', 'GROUP'].includes(subType)) {
    const err = new Error('Submission type must be either INDIVIDUAL or GROUP');
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

  // Validate Course
  let resolvedCourseId = courseId;
  if (resolvedCourseId) {
    const cCheck = await pool.query('SELECT id FROM courses WHERE id = $1', [resolvedCourseId]);
    if (cCheck.rows.length === 0) {
      const err = new Error(`Course with ID ${resolvedCourseId} does not exist`);
      err.statusCode = 400;
      throw err;
    }
  } else {
    // Fallback to first available course or default course
    const cFallback = await pool.query('SELECT id FROM courses ORDER BY id ASC LIMIT 1');
    if (cFallback.rows.length > 0) {
      resolvedCourseId = cFallback.rows[0].id;
    }
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
      INSERT INTO assignments (title, description, due_date, onedrive_link, created_by, course_id, submission_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, description, due_date, onedrive_link, created_by, course_id, submission_type, created_at, updated_at
    `, [title.trim(), description.trim(), parsedDueDate, onedriveLink.trim(), adminId, resolvedCourseId, subType]);

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

    // Fetch targets and course details for response
    const targetsRes = await pool.query(`
      SELECT at.id, at.target_type, at.group_id, g.name AS group_name
      FROM assignment_targets at
      LEFT JOIN groups g ON at.group_id = g.id
      WHERE at.assignment_id = $1
    `, [assignment.id]);

    const courseRes = await pool.query('SELECT title FROM courses WHERE id = $1', [resolvedCourseId]);

    return {
      ...assignment,
      course_title: courseRes.rows[0]?.title || null,
      targets: targetsRes.rows
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateAssignment(assignmentId, {
  title,
  description,
  dueDate,
  onedriveLink,
  targetType,
  groupIds,
  courseId,
  submissionType
}, adminId) {
  const existingRes = await pool.query('SELECT * FROM assignments WHERE id = $1', [assignmentId]);
  if (existingRes.rows.length === 0) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }

  const existing = existingRes.rows[0];

  let newTitle = title !== undefined ? title.trim() : existing.title;
  let newDescription = description !== undefined ? description.trim() : existing.description;
  let newDueDate = existing.due_date;
  let newOnedriveLink = onedriveLink !== undefined ? onedriveLink.trim() : existing.onedrive_link;
  let newCourseId = courseId !== undefined ? courseId : existing.course_id;
  let newSubmissionType = submissionType !== undefined ? submissionType.toUpperCase() : existing.submission_type;

  if (dueDate) {
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      const err = new Error('Invalid due date format');
      err.statusCode = 400;
      throw err;
    }
    newDueDate = parsedDueDate;
  }

  if (newOnedriveLink && !newOnedriveLink.startsWith('http://') && !newOnedriveLink.startsWith('https://')) {
    const err = new Error('OneDrive link must be a valid URL starting with http:// or https://');
    err.statusCode = 400;
    throw err;
  }

  if (newSubmissionType && !['INDIVIDUAL', 'GROUP'].includes(newSubmissionType)) {
    const err = new Error('Submission type must be either INDIVIDUAL or GROUP');
    err.statusCode = 400;
    throw err;
  }

  if (newCourseId) {
    const cCheck = await pool.query('SELECT id FROM courses WHERE id = $1', [newCourseId]);
    if (cCheck.rows.length === 0) {
      const err = new Error(`Course with ID ${newCourseId} does not exist`);
      err.statusCode = 400;
      throw err;
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query(`
      UPDATE assignments
      SET title = $1, description = $2, due_date = $3, onedrive_link = $4,
          course_id = $5, submission_type = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, title, description, due_date, onedrive_link, created_by, course_id, submission_type, created_at, updated_at
    `, [newTitle, newDescription, newDueDate, newOnedriveLink, newCourseId, newSubmissionType, assignmentId]);

    const updated = updateRes.rows[0];

    // If targetType is updated
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

    const courseRes = await pool.query('SELECT title FROM courses WHERE id = $1', [updated.course_id]);

    return {
      ...updated,
      course_title: courseRes.rows[0]?.title || null,
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
    // Admin sees all assignments with course info, targets, and confirmed count
    const assignmentsRes = await pool.query(`
      SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link, a.created_by,
             a.course_id, a.submission_type, a.created_at, a.updated_at,
             u.name AS creator_name, c.title AS course_title,
             (SELECT COUNT(*)::int FROM submission_confirmations WHERE assignment_id = a.id) AS confirmed_count
      FROM assignments a
      JOIN users u ON a.created_by = u.id
      LEFT JOIN courses c ON a.course_id = c.id
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

  // User is Student:
  // Must only return assignments for courses student is enrolled in AND (targeted to ALL_STUDENTS or student's group)
  const studentGroupRes = await pool.query(`
    SELECT g.id, g.name, g.leader_id, u.name AS leader_name,
           (g.leader_id = $1) AS is_leader
    FROM group_members gm
    JOIN groups g ON gm.group_id = g.id
    JOIN users u ON g.leader_id = u.id
    WHERE gm.student_id = $1
  `, [user.id]);
  const studentGroup = studentGroupRes.rows[0] || null;
  const studentGroupId = studentGroup ? studentGroup.id : null;

  let queryText = `
    SELECT DISTINCT a.id, a.title, a.description, a.due_date, a.onedrive_link, a.created_by,
           a.course_id, a.submission_type, a.created_at, a.updated_at,
           u.name AS creator_name, c.title AS course_title
    FROM assignments a
    JOIN users u ON a.created_by = u.id
    JOIN courses c ON a.course_id = c.id
    JOIN course_enrollments ce ON a.course_id = ce.course_id AND ce.student_id = $1
    JOIN assignment_targets at ON a.id = at.assignment_id
    WHERE (at.target_type = 'ALL_STUDENTS'
  `;
  const queryParams = [user.id];

  if (studentGroupId) {
    queryText += ` OR (at.target_type = 'GROUP' AND at.group_id = $2) `;
    queryParams.push(studentGroupId);
  }

  queryText += `) ORDER BY a.due_date ASC`;

  const assignmentsRes = await pool.query(queryText, queryParams);
  const result = [];

  for (const a of assignmentsRes.rows) {
    // Check student's personal submission
    const subRes = await pool.query(`
      SELECT sc.id, sc.confirmed_at, sc.status, sc.confirmed_by_leader_id,
             lu.name AS confirmed_by_leader_name
      FROM submission_confirmations sc
      LEFT JOIN users lu ON sc.confirmed_by_leader_id = lu.id
      WHERE sc.assignment_id = $1 AND sc.student_id = $2
    `, [a.id, user.id]);

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
        group_name: studentGroup.name,
        leader_id: studentGroup.leader_id,
        leader_name: studentGroup.leader_name,
        is_leader: studentGroup.is_leader,
        total_members: totalMembers,
        confirmed_members: confirmedMembers,
        pending_members: Math.max(0, totalMembers - confirmedMembers),
        progress_percentage: progressPct,
        is_complete: totalMembers > 0 && confirmedMembers === totalMembers
      };
    }

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
      group_progress: groupProgress,
      student_group: studentGroup
    });
  }

  return result;
}

async function getAssignmentById(assignmentId, user) {
  const assignRes = await pool.query(`
    SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link, a.created_by,
           a.course_id, a.submission_type, a.created_at, a.updated_at,
           u.name AS creator_name, c.title AS course_title
    FROM assignments a
    JOIN users u ON a.created_by = u.id
    LEFT JOIN courses c ON a.course_id = c.id
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

  // If Student, verify course enrollment and assignment visibility
  if (user.role === 'student') {
    // Check course enrollment
    if (assignment.course_id) {
      const enrollRes = await pool.query(`
        SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2
      `, [assignment.course_id, user.id]);

      if (enrollRes.rows.length === 0) {
        const err = new Error('Access denied: You are not enrolled in the course for this assignment');
        err.statusCode = 403;
        throw err;
      }
    }

    const studentGroupRes = await pool.query(`
      SELECT g.id, g.name, g.leader_id, u.name AS leader_name,
             (g.leader_id = $1) AS is_leader
      FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      JOIN users u ON g.leader_id = u.id
      WHERE gm.student_id = $1
    `, [user.id]);
    const studentGroup = studentGroupRes.rows[0] || null;
    const studentGroupId = studentGroup ? studentGroup.id : null;

    const isAllStudents = targetsRes.rows.some(t => t.target_type === 'ALL_STUDENTS');
    if (!isAllStudents) {
      const isTargetedToGroup = targetsRes.rows.some(t => t.group_id === studentGroupId);
      if (!isTargetedToGroup) {
        const err = new Error('Access denied: This assignment is not targeted to you or your group');
        err.statusCode = 403;
        throw err;
      }
    }

    // Include personal submission and group progress
    const subRes = await pool.query(`
      SELECT sc.id, sc.confirmed_at, sc.status, sc.confirmed_by_leader_id,
             lu.name AS confirmed_by_leader_name
      FROM submission_confirmations sc
      LEFT JOIN users lu ON sc.confirmed_by_leader_id = lu.id
      WHERE sc.assignment_id = $1 AND sc.student_id = $2
    `, [assignmentId, user.id]);
    const hasSubmitted = subRes.rows.length > 0;

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

    return {
      ...assignment,
      targets: targetsRes.rows,
      has_submitted: hasSubmitted,
      submission: hasSubmitted ? subRes.rows[0] : null,
      group_progress: groupProgress,
      student_group: studentGroup
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
