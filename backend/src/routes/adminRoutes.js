const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All admin routes require valid JWT + admin role
router.use(authenticateJWT, requireRole('admin'));

// Group-wise monitoring for an assignment
router.get('/assignments/:id/groups', adminController.getAssignmentGroupMonitoring);

// Student-wise monitoring for an assignment
router.get('/assignments/:id/students', adminController.getAssignmentStudentMonitoring);

// Submission completion analytics
router.get('/analytics/completion', adminController.getCompletionAnalytics);

// Group performance analytics
router.get('/analytics/group-performance', adminController.getGroupPerformanceAnalytics);

// Dashboard summary counts
router.get('/dashboard/summary', adminController.getDashboardSummary);

module.exports = router;
