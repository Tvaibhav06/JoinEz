const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Admin creates assignment
router.post('/', authenticateJWT, requireRole('admin'), assignmentController.createAssignment);

// Admin edits assignment
router.put('/:id', authenticateJWT, requireRole('admin'), assignmentController.updateAssignment);

// List assignments (Admin sees all; Student sees applicable)
router.get('/', authenticateJWT, assignmentController.getAssignments);

// View single assignment details (with authorization check)
router.get('/:id', authenticateJWT, assignmentController.getAssignmentById);

module.exports = router;
