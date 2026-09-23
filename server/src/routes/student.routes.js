const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  resetStudentPassword,
  deleteStudent
} = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All student CRUD endpoints require Admin role
router.use(verifyToken, requireRole('admin'));

router.get('/', getAllStudents);
router.post('/', createStudent);
router.get('/:id', getStudentById);
router.put('/:id', updateStudent);
router.patch('/:id/toggle-status', toggleStudentStatus);
router.post('/:id/reset-password', resetStudentPassword);
router.delete('/:id', deleteStudent);

module.exports = router;
