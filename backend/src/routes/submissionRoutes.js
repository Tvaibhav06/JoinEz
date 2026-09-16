const express = require('express');
const router = express.Router({ mergeParams: true });
const submissionController = require('../controllers/submissionController');
const { authenticateJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Step 1: Initial "Yes, I have submitted" selection
router.post('/step1', authenticateJWT, requireRole('student'), submissionController.recordStep1);

// Step 2: Final confirmation
router.post('/confirm', authenticateJWT, requireRole('student'), submissionController.confirmSubmission);

// Get own submission status
router.get('/', authenticateJWT, requireRole('student'), submissionController.getSubmissionStatus);

module.exports = router;
