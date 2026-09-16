const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Student group creation
router.post('/', authenticateJWT, requireRole('student'), groupController.createGroup);

// Get current student's group
router.get('/my-group', authenticateJWT, requireRole('student'), groupController.getMyGroup);

// Get specific group (member or admin)
router.get('/:id', authenticateJWT, groupController.getGroupById);

// Add member by email or Student ID (group members only)
router.post('/:id/members', authenticateJWT, requireRole('student'), groupController.addMember);

// Get group progress across assignments
router.get('/:id/progress', authenticateJWT, groupController.getGroupProgress);

module.exports = router;
