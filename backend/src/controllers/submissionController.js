const submissionService = require('../services/submissionService');
const { success } = require('../utils/response');

async function recordStep1(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const result = await submissionService.recordStep1(assignmentId, req.user.id);
    return success(res, result, result.message, 200);
  } catch (err) {
    next(err);
  }
}

async function confirmSubmission(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const result = await submissionService.confirmSubmission(assignmentId, req.user.id);
    return success(res, result, 'Submission confirmed successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function getSubmissionStatus(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const result = await submissionService.getSubmissionStatus(assignmentId, req.user.id);
    return success(res, result, 'Submission status retrieved', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  recordStep1,
  confirmSubmission,
  getSubmissionStatus
};
