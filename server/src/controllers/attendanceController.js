const { User, TEAMS } = require('../models/User');
const Attendance = require('../models/Attendance');
const { isSupabaseConfigured } = require('../config/supabase');
const supabaseService = require('../services/supabaseService');

// Helper to get ISO date string YYYY-MM-DD
const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to parse dateStr YYYY-MM-DD to UTC midnight Date
const parseDateStr = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

// Helper to compute Monday to Sunday range for a given date
const getMondayToSundayRange = (refDate = new Date()) => {
  const d = new Date(refDate);
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday
  const diffToMon = d.getUTCDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diffToMon, 0, 0, 0, 0));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { monday, sunday };
};

// Helper to compute current month start and end range
const getMonthRange = (refDate = new Date()) => {
  const year = refDate.getUTCFullYear();
  const month = refDate.getUTCMonth();

  const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  return { startOfMonth, endOfMonth };
};

// 1. Get Attendance Roster for a Team on a specific date (Admin)
const getAttendanceRoster = async (req, res) => {
  try {
    const { team, dateStr } = req.query;

    if (!team || !TEAMS.includes(team)) {
      return res.status(400).json({ message: `Valid team is required. Must be one of: ${TEAMS.join(', ')}` });
    }

    const dateQueryStr = dateStr || getTodayDateStr();

    if (isSupabaseConfigured()) {
      const rosterData = await supabaseService.getAttendanceRoster(team, dateQueryStr);
      return res.status(200).json(rosterData);
    }

    // Fetch active students in this team
    const students = await User.find({ team, role: 'student', isActive: true })
      .select('name email rollNumber team isActive')
      .sort({ rollNumber: 1, name: 1 });

    // Fetch existing attendance entries for team & date
    const existingRecords = await Attendance.find({ team, dateStr: dateQueryStr });

    // Map student ID -> attendance doc
    const attendanceMap = new Map();
    existingRecords.forEach((rec) => {
      attendanceMap.set(rec.student.toString(), rec);
    });

    const roster = students.map((student) => {
      const rec = attendanceMap.get(student._id.toString());
      return {
        studentId: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        team: student.team,
        status: rec ? rec.status : null,
        remarks: rec ? rec.remarks : '',
        attendanceId: rec ? rec._id : null
      };
    });

    const totalStudents = roster.length;
    const markedCount = roster.filter((r) => r.status !== null).length;
    const presentCount = roster.filter((r) => r.status === 'Present').length;
    const absentCount = roster.filter((r) => r.status === 'Absent').length;
    const leaveCount = roster.filter((r) => r.status === 'Leave').length;

    return res.status(200).json({
      team,
      dateStr: dateQueryStr,
      totalStudents,
      markedCount,
      presentCount,
      absentCount,
      leaveCount,
      roster
    });
  } catch (err) {
    console.error('Error fetching roster:', err);
    return res.status(500).json({ message: 'Failed to fetch attendance roster', error: err.message });
  }
};

// 2. Mark / Bulk Upsert Attendance for a Team (Admin)
const markBulkAttendance = async (req, res) => {
  try {
    const { team, dateStr, records } = req.body;

    if (!team || !TEAMS.includes(team)) {
      return res.status(400).json({ message: `Valid team is required. Must be one of: ${TEAMS.join(', ')}` });
    }

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ message: 'Valid dateStr in YYYY-MM-DD format is required.' });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Records array containing student statuses is required.' });
    }

    const adminId = req.user._id || req.user.id;

    if (isSupabaseConfigured()) {
      const result = await supabaseService.markBulkAttendance({
        team,
        dateStr,
        records,
        markedBy: adminId
      });
      return res.status(200).json(result);
    }

    const parsedDate = parseDateStr(dateStr);

    const bulkOperations = records.map((rec) => {
      if (!rec.studentId || !['Present', 'Absent', 'Leave'].includes(rec.status)) {
        throw new Error(`Invalid record for student ${rec.studentId}. Status must be Present, Absent, or Leave.`);
      }

      return {
        updateOne: {
          filter: { student: rec.studentId, dateStr },
          update: {
            $set: {
              student: rec.studentId,
              team,
              dateStr,
              date: parsedDate,
              status: rec.status,
              markedBy: adminId,
              remarks: rec.remarks || ''
            }
          },
          upsert: true
        }
      };
    });

    const result = await Attendance.bulkWrite(bulkOperations);

    return res.status(200).json({
      message: `Successfully saved attendance for ${records.length} students in ${team} on ${dateStr}`,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (err) {
    console.error('Error bulk updating attendance:', err);
    return res.status(500).json({ message: err.message || 'Failed to update attendance records.' });
  }
};

// 3. Get Student Attendance Stats & History (Student or Admin)
const getStudentStats = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (isSupabaseConfigured()) {
      const stats = await supabaseService.getStudentStats(studentId, req.query.refDate);
      return res.status(200).json(stats);
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student account not found.' });
    }

    const refDate = req.query.refDate ? parseDateStr(req.query.refDate) : new Date();

    // Calculate Week range (Mon - Sun)
    const { monday, sunday } = getMondayToSundayRange(refDate);

    // Calculate Month range
    const { startOfMonth, endOfMonth } = getMonthRange(refDate);

    // Fetch all student attendance
    const allRecords = await Attendance.find({ student: studentId }).sort({ date: -1 });

    // Weekly stats
    const weeklyRecords = allRecords.filter((r) => r.date >= monday && r.date <= sunday);
    const weeklyPresent = weeklyRecords.filter((r) => r.status === 'Present').length;
    const weeklyAbsent = weeklyRecords.filter((r) => r.status === 'Absent').length;
    const weeklyTotal = weeklyRecords.length;
    const weeklyPercentage = weeklyTotal > 0 ? Math.round((weeklyPresent / weeklyTotal) * 100) : 0;

    // Monthly stats
    const monthlyRecords = allRecords.filter((r) => r.date >= startOfMonth && r.date <= endOfMonth);
    const monthlyPresent = monthlyRecords.filter((r) => r.status === 'Present').length;
    const monthlyAbsent = monthlyRecords.filter((r) => r.status === 'Absent').length;
    const monthlyTotal = monthlyRecords.length;
    const monthlyPercentage = monthlyTotal > 0 ? Math.round((monthlyPresent / monthlyTotal) * 100) : 0;

    // Overall stats
    const overallPresent = allRecords.filter((r) => r.status === 'Present').length;
    const overallAbsent = allRecords.filter((r) => r.status === 'Absent').length;
    const overallTotal = allRecords.length;
    const overallPercentage = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

    return res.status(200).json({
      student: student.toPublicJSON(),
      refDateStr: refDate.toISOString().split('T')[0],
      weekly: {
        startDate: monday.toISOString().split('T')[0],
        endDate: sunday.toISOString().split('T')[0],
        total: weeklyTotal,
        present: weeklyPresent,
        absent: weeklyAbsent,
        percentage: weeklyPercentage
      },
      monthly: {
        year: refDate.getUTCFullYear(),
        month: refDate.getUTCMonth() + 1,
        total: monthlyTotal,
        present: monthlyPresent,
        absent: monthlyAbsent,
        percentage: monthlyPercentage
      },
      overall: {
        total: overallTotal,
        present: overallPresent,
        absent: overallAbsent,
        percentage: overallPercentage
      },
      history: allRecords.map((r) => ({
        id: r._id,
        dateStr: r.dateStr,
        status: r.status,
        team: r.team,
        remarks: r.remarks
      }))
    });
  } catch (err) {
    console.error('Error fetching student stats:', err);
    return res.status(500).json({ message: 'Failed to fetch student statistics', error: err.message });
  }
};

// 4. Get Team Summary & Student Leaderboard (Admin)
const getTeamSummary = async (req, res) => {
  try {
    const { team, range = 'week', refDateStr } = req.query;

    if (isSupabaseConfigured()) {
      const summary = await supabaseService.getTeamSummary({ team, range, refDateStr });
      return res.status(200).json(summary);
    }

    const refDate = refDateStr ? parseDateStr(refDateStr) : new Date();

    let startDate, endDate, periodName;

    if (range === 'month') {
      const mRange = getMonthRange(refDate);
      startDate = mRange.startOfMonth;
      endDate = mRange.endOfMonth;
      periodName = `Month of ${refDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`;
    } else {
      const wRange = getMondayToSundayRange(refDate);
      startDate = wRange.monday;
      endDate = wRange.sunday;
      periodName = `Week of ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;
    }

    const teamFilter = team && TEAMS.includes(team) ? { team } : {};

    // Get active students
    const studentQuery = { role: 'student', isActive: true, ...teamFilter };
    const students = await User.find(studentQuery).select('name rollNumber email team');

    // Get attendance records in range
    const attendanceQuery = {
      date: { $gte: startDate, $lte: endDate },
      ...teamFilter
    };
    const records = await Attendance.find(attendanceQuery);

    // Group records by student
    const studentStatsMap = new Map();
    students.forEach((st) => {
      studentStatsMap.set(st._id.toString(), {
        studentId: st._id,
        name: st.name,
        rollNumber: st.rollNumber,
        team: st.team,
        present: 0,
        absent: 0,
        total: 0,
        percentage: 0
      });
    });

    records.forEach((rec) => {
      const stId = rec.student.toString();
      if (studentStatsMap.has(stId)) {
        const item = studentStatsMap.get(stId);
        item.total += 1;
        if (rec.status === 'Present') item.present += 1;
        if (rec.status === 'Absent') item.absent += 1;
      }
    });

    // Calculate percentage per student
    const studentSummaries = Array.from(studentStatsMap.values()).map((st) => {
      st.percentage = st.total > 0 ? Math.round((st.present / st.total) * 100) : 0;
      return st;
    });

    // Team aggregate metrics
    const totalRecords = records.length;
    const totalPresent = records.filter((r) => r.status === 'Present').length;
    const totalAbsent = records.filter((r) => r.status === 'Absent').length;
    const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    // Per-team breakdown (if querying across all teams or single team)
    const teamsBreakdown = TEAMS.map((tName) => {
      const teamRecords = records.filter((r) => r.team === tName);
      const tTotal = teamRecords.length;
      const tPresent = teamRecords.filter((r) => r.status === 'Present').length;
      const tAbsent = teamRecords.filter((r) => r.status === 'Absent').length;
      const tStudents = students.filter((s) => s.team === tName).length;
      return {
        team: tName,
        totalStudents: tStudents,
        totalSessions: tTotal,
        present: tPresent,
        absent: tAbsent,
        percentage: tTotal > 0 ? Math.round((tPresent / tTotal) * 100) : 0
      };
    });

    return res.status(200).json({
      range,
      periodName,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      selectedTeam: team || 'All Teams',
      totalActiveStudents: students.length,
      totalSessions: totalRecords,
      totalPresent,
      totalAbsent,
      overallPercentage,
      teamsBreakdown,
      studentSummaries: studentSummaries.sort((a, b) => b.percentage - a.percentage || a.rollNumber.localeCompare(b.rollNumber))
    });
  } catch (err) {
    console.error('Error in getTeamSummary:', err);
    return res.status(500).json({ message: 'Failed to generate team summary', error: err.message });
  }
};

// 5. Get Top-Level Admin Dashboard Stats (Admin)
const getAdminDashboardStats = async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const stats = await supabaseService.getAdminDashboardStats();
      return res.status(200).json(stats);
    }

    const todayStr = getTodayDateStr();

    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const inactiveStudents = await User.countDocuments({ role: 'student', isActive: false });

    // Today's attendance stats
    const todayRecords = await Attendance.find({ dateStr: todayStr });
    const todayPresent = todayRecords.filter((r) => r.status === 'Present').length;
    const todayAbsent = todayRecords.filter((r) => r.status === 'Absent').length;
    const todayMarked = todayRecords.length;
    const todayPercentage = todayMarked > 0 ? Math.round((todayPresent / todayMarked) * 100) : 0;

    // Team breakdown for today
    const teamStats = await Promise.all(
      TEAMS.map(async (teamName) => {
        const teamStudentCount = await User.countDocuments({ team: teamName, role: 'student', isActive: true });
        const teamTodayRecords = todayRecords.filter((r) => r.team === teamName);
        const present = teamTodayRecords.filter((r) => r.status === 'Present').length;
        const absent = teamTodayRecords.filter((r) => r.status === 'Absent').length;
        const marked = teamTodayRecords.length;

        return {
          team: teamName,
          totalStudents: teamStudentCount,
          markedCount: marked,
          present,
          absent,
          percentage: marked > 0 ? Math.round((present / marked) * 100) : 0,
          isCompleted: teamStudentCount > 0 && marked >= teamStudentCount
        };
      })
    );

    return res.status(200).json({
      todayStr,
      totalStudents,
      inactiveStudents,
      todayMarked,
      todayPresent,
      todayAbsent,
      todayPercentage,
      teamStats
    });
  } catch (err) {
    console.error('Error fetching admin dashboard stats:', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard stats', error: err.message });
  }
};

module.exports = {
  getAttendanceRoster,
  markBulkAttendance,
  getStudentStats,
  getTeamSummary,
  getAdminDashboardStats
};
