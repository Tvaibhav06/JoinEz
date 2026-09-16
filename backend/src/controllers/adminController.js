const adminService = require('../services/adminService');
const { success } = require('../utils/response');

async function getAssignmentGroupMonitoring(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const data = await adminService.getAssignmentGroupMonitoring(assignmentId);
    return success(res, data, 'Group monitoring data', 200);
  } catch (err) {
    next(err);
  }
}

async function getAssignmentStudentMonitoring(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const data = await adminService.getAssignmentStudentMonitoring(assignmentId);
    return success(res, data, 'Student monitoring data', 200);
  } catch (err) {
    next(err);
  }
}

async function getCompletionAnalytics(req, res, next) {
  try {
    const assignmentId = req.query.assignment_id ? parseInt(req.query.assignment_id, 10) : null;
    const data = await adminService.getCompletionAnalytics(assignmentId);
    return success(res, data, 'Completion analytics', 200);
  } catch (err) {
    next(err);
  }
}

async function getGroupPerformanceAnalytics(req, res, next) {
  try {
    const data = await adminService.getGroupPerformanceAnalytics();
    return success(res, data, 'Group performance analytics', 200);
  } catch (err) {
    next(err);
  }
}

async function getDashboardSummary(req, res, next) {
  try {
    const data = await adminService.getDashboardSummary();
    return success(res, data, 'Admin dashboard summary', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAssignmentGroupMonitoring,
  getAssignmentStudentMonitoring,
  getCompletionAnalytics,
  getGroupPerformanceAnalytics,
  getDashboardSummary
};
