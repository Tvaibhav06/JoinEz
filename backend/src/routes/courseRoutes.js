const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All course routes require authenticated user
router.use(authenticateJWT);

// Student: List enrolled courses
router.get('/my-courses', requireRole('student'), courseController.getMyCourses);

// Admin / Professor: List courses being taught with basic analytics
router.get('/teaching', requireRole('admin'), courseController.getTeachingCourses);

// Admin: Simple list of courses for dropdown forms
router.get('/', requireRole('admin'), courseController.getAllCourses);

// Student or Admin: List assignments within a course (scoped with access control)
router.get('/:id/assignments', courseController.getCourseAssignments);

module.exports = router;
