const { User, TEAMS } = require('../models/User');
const Attendance = require('../models/Attendance');
const { isSupabaseConfigured } = require('../config/supabase');
const supabaseService = require('../services/supabaseService');

// Get all students with optional filters
const getAllStudents = async (req, res) => {
  try {
    const { team, isActive, search } = req.query;

    if (isSupabaseConfigured()) {
      const students = await supabaseService.getAllStudents({ team, isActive, search });
      return res.status(200).json({
        count: students.length,
        students
      });
    }

    const filter = { role: 'student' };

    if (team && TEAMS.includes(team)) {
      filter.team = team;
    }

    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { rollNumber: searchRegex }
      ];
    }

    const students = await User.find(filter).sort({ team: 1, rollNumber: 1, name: 1 });
    
    // Fetch today's date YYYY-MM-DD
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Fetch attendance records for today or latest
    const studentIds = students.map((s) => s._id);
    const todayAttendance = await Attendance.find({ student: { $in: studentIds }, dateStr: todayStr });
    
    const statusMap = new Map();
    todayAttendance.forEach((a) => statusMap.set(a.student.toString(), a.status));

    // If no record for today, fetch latest record for each student
    if (todayAttendance.length === 0 && studentIds.length > 0) {
      const latestAttendance = await Attendance.aggregate([
        { $match: { student: { $in: studentIds } } },
        { $sort: { date: -1 } },
        { $group: { _id: '$student', status: { $first: '$status' } } }
      ]);
      latestAttendance.forEach((a) => statusMap.set(a._id.toString(), a.status));
    }

    const publicStudents = students.map((s) => {
      const json = s.toPublicJSON();
      json.attendanceStatus = statusMap.get(s._id.toString()) || null;
      return json;
    });

    return res.status(200).json({
      count: publicStudents.length,
      students: publicStudents
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    return res.status(500).json({ message: 'Failed to fetch students', error: err.message });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured()) {
      const student = await supabaseService.getUserById(id);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ message: 'Student not found' });
      }
      return res.status(200).json({ student: student.toPublicJSON ? student.toPublicJSON() : student });
    }

    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    return res.status(200).json({ student: student.toPublicJSON() });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching student details', error: err.message });
  }
};

// Create a new student
const createStudent = async (req, res) => {
  try {
    const { name, email, rollNumber, team, password } = req.body;

    if (!name || !email || !rollNumber || !team || !password) {
      return res.status(400).json({ message: 'All fields (name, email, rollNumber, team, password) are required.' });
    }

    if (!TEAMS.includes(team)) {
      return res.status(400).json({ message: `Invalid team. Must be one of: ${TEAMS.join(', ')}` });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRoll = rollNumber.toUpperCase().trim();

    if (isSupabaseConfigured()) {
      const created = await supabaseService.createStudent({
        name,
        email: cleanEmail,
        rollNumber: cleanRoll,
        team,
        password
      });

      return res.status(201).json({
        message: 'Student registered successfully in persistent database',
        student: created
      });
    }

    // Check email uniqueness in Mongo
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    // Check roll number uniqueness in Mongo
    const existingRoll = await User.findOne({ rollNumber: cleanRoll });
    if (existingRoll) {
      return res.status(400).json({ message: 'A student with this Roll Number already exists.' });
    }

    const passwordHash = await User.hashPassword(password);

    const newStudent = await User.create({
      name: name.trim(),
      email: cleanEmail,
      rollNumber: cleanRoll,
      team,
      passwordHash,
      role: 'student',
      isActive: true
    });

    return res.status(201).json({
      message: 'Student registered successfully',
      student: newStudent.toPublicJSON()
    });
  } catch (err) {
    console.error('Error creating student:', err);
    return res.status(500).json({ message: 'Failed to create student', error: err.message });
  }
};

// Update student details
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, rollNumber, team, isActive } = req.body;

    if (team && !TEAMS.includes(team)) {
      return res.status(400).json({ message: `Invalid team. Must be one of: ${TEAMS.join(', ')}` });
    }

    if (isSupabaseConfigured()) {
      const updated = await supabaseService.updateStudent(id, { name, email, rollNumber, team, isActive });
      return res.status(200).json({
        message: 'Student profile updated successfully in persistent database',
        student: updated
      });
    }

    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (email && email.toLowerCase().trim() !== student.email) {
      const cleanEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: cleanEmail, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Email address already in use by another account.' });
      }
      student.email = cleanEmail;
    }

    if (rollNumber && rollNumber.toUpperCase().trim() !== student.rollNumber) {
      const cleanRoll = rollNumber.toUpperCase().trim();
      const existing = await User.findOne({ rollNumber: cleanRoll, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Roll Number already in use by another student.' });
      }
      student.rollNumber = cleanRoll;
    }

    if (name) student.name = name.trim();
    if (team) student.team = team;
    if (isActive !== undefined) student.isActive = isActive;

    await student.save();

    return res.status(200).json({
      message: 'Student profile updated successfully',
      student: student.toPublicJSON()
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update student', error: err.message });
  }
};

// Toggle active status
const toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured()) {
      const toggled = await supabaseService.toggleStudentStatus(id);
      return res.status(200).json({
        message: `Student status set to ${toggled.isActive ? 'Active' : 'Inactive'}`,
        student: toggled
      });
    }

    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    student.isActive = !student.isActive;
    await student.save();

    return res.status(200).json({
      message: `Student status set to ${student.isActive ? 'Active' : 'Inactive'}`,
      student: student.toPublicJSON()
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to toggle status', error: err.message });
  }
};

// Reset password for a student
const resetStudentPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    if (isSupabaseConfigured()) {
      await supabaseService.resetStudentPassword(id, newPassword);
      return res.status(200).json({ message: 'Student password reset successfully in persistent database.' });
    }

    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    student.passwordHash = await User.hashPassword(newPassword);
    await student.save();

    return res.status(200).json({ message: 'Student password reset successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
};

// Delete student permanently
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured()) {
      await supabaseService.deleteStudent(id);
      return res.status(200).json({ message: 'Student and associated attendance records deleted successfully from persistent database.' });
    }

    const student = await User.findOneAndDelete({ _id: id, role: 'student' });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Cascade delete student's attendance records
    await Attendance.deleteMany({ student: id });

    return res.status(200).json({ message: 'Student and associated attendance records deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete student', error: err.message });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  resetStudentPassword,
  deleteStudent
};
