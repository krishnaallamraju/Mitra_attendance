const express = require('express');
const router = express.Router();
const {
  getAttendanceRoster,
  markBulkAttendance,
  getStudentStats,
  getTeamSummary,
  getAdminDashboardStats
} = require('../controllers/attendanceController');
const { verifyToken, requireRole, requireSelfOrAdmin } = require('../middleware/auth');

// Protect all routes with auth token
router.use(verifyToken);

// Admin-only endpoints
router.get('/roster', requireRole('admin'), getAttendanceRoster);
router.post('/mark', requireRole('admin'), markBulkAttendance);
router.get('/team-summary', requireRole('admin'), getTeamSummary);
router.get('/admin-dashboard', requireRole('admin'), getAdminDashboardStats);

// Student stats endpoint (accessible by the student themselves OR an admin)
router.get('/student/:studentId', requireSelfOrAdmin, getStudentStats);

module.exports = router;
