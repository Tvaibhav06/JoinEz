const assignmentService = require('../services/assignmentService');
const { success } = require('../utils/response');

async function createAssignment(req, res, next) {
  try {
    const { title, description, dueDate, onedriveLink, targetType, groupIds } = req.body;
    const assignment = await assignmentService.createAssignment({
      title,
      description,
      dueDate,
      onedriveLink,
      targetType,
      groupIds,
      adminId: req.user.id
    });
    return success(res, assignment, 'Assignment created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function updateAssignment(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const { title, description, dueDate, onedriveLink, targetType, groupIds } = req.body;
    const assignment = await assignmentService.updateAssignment(assignmentId, {
      title,
      description,
      dueDate,
      onedriveLink,
      targetType,
      groupIds
    }, req.user.id);
    return success(res, assignment, 'Assignment updated successfully', 200);
  } catch (err) {
    next(err);
  }
}

async function getAssignments(req, res, next) {
  try {
    const assignments = await assignmentService.getAssignments(req.user);
    return success(res, assignments, 'Assignments retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
}

async function getAssignmentById(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const assignment = await assignmentService.getAssignmentById(assignmentId, req.user);
    return success(res, assignment, 'Assignment details', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAssignment,
  updateAssignment,
  getAssignments,
  getAssignmentById
};
