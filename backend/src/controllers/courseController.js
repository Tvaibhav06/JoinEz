const courseService = require('../services/courseService');
const { success } = require('../utils/response');

async function getMyCourses(req, res, next) {
  try {
    const courses = await courseService.getMyCourses(req.user.id);
    return success(res, courses, 'Enrolled courses retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
}

async function getTeachingCourses(req, res, next) {
  try {
    const courses = await courseService.getTeachingCourses(req.user.id);
    return success(res, courses, 'Taught courses retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
}

async function getCourseAssignments(req, res, next) {
  try {
    const courseId = parseInt(req.params.id, 10);
    const data = await courseService.getCourseAssignments(courseId, req.user);
    return success(res, data, 'Course assignments retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
}

async function getAllCourses(req, res, next) {
  try {
    const courses = await courseService.getAllCourses(req.user.role === 'admin' ? req.user.id : null);
    return success(res, courses, 'Courses retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyCourses,
  getTeachingCourses,
  getCourseAssignments,
  getAllCourses
};
