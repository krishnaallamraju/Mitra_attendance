const { supabase, isSupabaseConfigured } = require('../config/supabase');
const bcrypt = require('bcryptjs');

const TEAMS = ['Vibe Coding', 'AI Team', 'Industry Connect', 'Marketing'];

// Helper to format ISO date string YYYY-MM-DD
const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format current time string HH:MM:SS
const getNowTimeStr = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Helper to compute Monday to Sunday range for a reference date
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

// Helper to compute month start and end range
const getMonthRange = (refDate = new Date()) => {
  const year = refDate.getUTCFullYear();
  const month = refDate.getUTCMonth();

  const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  return { startOfMonth, endOfMonth };
};

// ==========================================================
// 1. AUTH & USER QUERIES
// ==========================================================
const findUserByIdentifier = async (identifier) => {
  if (!isSupabaseConfigured() || !supabase) return null;

  const clean = identifier.trim();
  const isEmail = clean.includes('@');

  let query = supabase.from('users').select('*');
  if (isEmail) {
    query = query.eq('email', clean.toLowerCase());
  } else {
    query = query.or(`roll_number.eq.${clean.toUpperCase()},username.eq.${clean.toLowerCase()}`);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    _id: data.id,
    team: data.club_name,
    rollNumber: data.roll_number,
    passwordHash: data.password_hash,
    isActive: data.is_active,
    async comparePassword(candidatePassword) {
      return await bcrypt.compare(candidatePassword, data.password_hash);
    },
    toPublicJSON() {
      const copy = { ...data, _id: data.id, team: data.club_name, rollNumber: data.roll_number, isActive: data.is_active };
      delete copy.password_hash;
      return copy;
    }
  };
};

const createStudentAccount = async ({ name, username, email, password, team }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert({
    name: name.trim(),
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    roll_number: `FB_${username.trim().toLowerCase()}`,
    club_name: team,
    role: 'student',
    password_hash: passwordHash,
    is_active: true
  }).select().single();
  if (error) throw error;
  return {
    ...data,
    _id: data.id,
    team: data.club_name,
    rollNumber: data.roll_number,
    passwordHash: data.password_hash,
    isActive: data.is_active,
    toPublicJSON() {
      const copy = { ...data, _id: data.id, team: data.club_name, rollNumber: data.roll_number, isActive: data.is_active };
      delete copy.password_hash;
      return copy;
    }
  };
};

const getUserById = async (id) => {
  if (!isSupabaseConfigured() || !supabase) return null;

  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    _id: data.id,
    team: data.club_name,
    rollNumber: data.roll_number,
    passwordHash: data.password_hash,
    isActive: data.is_active,
    async comparePassword(candidatePassword) {
      return await bcrypt.compare(candidatePassword, data.password_hash);
    },
    toPublicJSON() {
      const copy = { ...data, _id: data.id, team: data.club_name, rollNumber: data.roll_number, isActive: data.is_active };
      delete copy.password_hash;
      return copy;
    }
  };
};

// ==========================================================
// 2. STUDENT CRUD (ADMIN)
// ==========================================================
const getAllStudents = async ({ team, isActive, search }) => {
  let query = supabase.from('users').select('*').eq('role', 'student').order('roll_number', { ascending: true });

  if (team && TEAMS.includes(team)) {
    query = query.eq('club_name', team);
  }

  if (isActive !== undefined && isActive !== '') {
    query = query.eq('is_active', isActive === 'true' || isActive === true);
  }

  if (search) {
    const s = `%${search.trim()}%`;
    query = query.or(`name.ilike.${s},email.ilike.${s},roll_number.ilike.${s}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const todayStr = getTodayDateStr();
  const studentIds = (data || []).map((s) => s.id);
  
  let attendanceMap = new Map();
  if (studentIds.length > 0) {
    const { data: attData } = await supabase
      .from('attendance')
      .select('student_id, status')
      .in('student_id', studentIds)
      .eq('date_str', todayStr);

    (attData || []).forEach((a) => attendanceMap.set(a.student_id, a.status));
  }

  return (data || []).map((s) => ({
    _id: s.id,
    id: s.id,
    name: s.name,
    email: s.email,
    rollNumber: s.roll_number,
    team: s.club_name,
    role: s.role,
    isActive: s.is_active,
    attendanceStatus: attendanceMap.get(s.id) || null,
    createdAt: s.created_at
  }));
};

const createStudent = async ({ name, email, rollNumber, team, password }) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        roll_number: rollNumber.toUpperCase().trim(),
        club_name: team,
        role: 'student',
        password_hash: passwordHash,
        is_active: true
      }
    ])
    .select()
    .single();

  if (error) throw error;

  // Insert into helper students table
  await supabase.from('students').insert([
    {
      user_id: data.id,
      roll_number: data.roll_number,
      club_name: data.club_name
    }
  ]);

  return {
    _id: data.id,
    id: data.id,
    name: data.name,
    email: data.email,
    rollNumber: data.roll_number,
    team: data.club_name,
    role: data.role,
    isActive: data.is_active
  };
};

const updateStudent = async (id, { name, email, rollNumber, team, isActive }) => {
  const updatePayload = { updated_at: new Date().toISOString() };
  if (name) updatePayload.name = name.trim();
  if (email) updatePayload.email = email.toLowerCase().trim();
  if (rollNumber) updatePayload.roll_number = rollNumber.toUpperCase().trim();
  if (team) updatePayload.club_name = team;
  if (isActive !== undefined) updatePayload.is_active = isActive;

  const { data, error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', id)
    .eq('role', 'student')
    .select()
    .single();

  if (error) throw error;

  // Update students helper relation
  if (rollNumber || team) {
    await supabase.from('students').update({
      roll_number: data.roll_number,
      club_name: data.club_name
    }).eq('user_id', id);
  }

  return {
    _id: data.id,
    id: data.id,
    name: data.name,
    email: data.email,
    rollNumber: data.roll_number,
    team: data.club_name,
    role: data.role,
    isActive: data.is_active
  };
};

const toggleStudentStatus = async (id) => {
  const { data: user, error: getErr } = await supabase.from('users').select('is_active').eq('id', id).single();
  if (getErr) throw getErr;

  const newStatus = !user.is_active;
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    _id: data.id,
    isActive: data.is_active,
    name: data.name
  };
};

const resetStudentPassword = async (id, newPassword) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const { error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  return true;
};

const deleteStudent = async (id) => {
  // Cascades attendance and students
  const { error } = await supabase.from('users').delete().eq('id', id).eq('role', 'student');
  if (error) throw error;
  return true;
};

// ==========================================================
// 3. ATTENDANCE OPERATIONS
// ==========================================================
const getAttendanceRoster = async (team, dateStr) => {
  const dateQueryStr = dateStr || getTodayDateStr();

  // Fetch active students in this team
  const { data: students, error: sErr } = await supabase
    .from('users')
    .select('id, name, email, roll_number, club_name, is_active')
    .eq('role', 'student')
    .eq('club_name', team)
    .eq('is_active', true)
    .order('roll_number', { ascending: true });

  if (sErr) throw sErr;

  // Fetch existing attendance records for team and date
  const { data: records, error: aErr } = await supabase
    .from('attendance')
    .select('*')
    .eq('club_name', team)
    .eq('date_str', dateQueryStr);

  if (aErr) throw aErr;

  const recordMap = new Map();
  (records || []).forEach((r) => recordMap.set(r.student_id, r));

  const roster = (students || []).map((s) => {
    const rec = recordMap.get(s.id);
    return {
      studentId: s.id,
      name: s.name,
      rollNumber: s.roll_number,
      email: s.email,
      team: s.club_name,
      status: rec ? rec.status : null,
      remarks: rec ? rec.remarks : '',
      attendanceId: rec ? rec.id : null,
      timeStr: rec ? rec.time_str : null
    };
  });

  const totalStudents = roster.length;
  const markedCount = roster.filter((r) => r.status !== null).length;
  const presentCount = roster.filter((r) => r.status === 'Present').length;
  const absentCount = roster.filter((r) => r.status === 'Absent').length;

  return {
    team,
    dateStr: dateQueryStr,
    totalStudents,
    markedCount,
    presentCount,
    absentCount,
    roster
  };
};

const markBulkAttendance = async ({ team, dateStr, records, markedBy }) => {
  const parsedDate = dateStr;
  const timeStr = getNowTimeStr();

  const upsertRows = records.map((r) => ({
    student_id: r.studentId,
    club_name: team,
    date_str: dateStr,
    date: parsedDate,
    time_str: timeStr,
    status: r.status,
    remarks: r.remarks || '',
    marked_by: markedBy,
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('attendance')
    .upsert(upsertRows, { onConflict: 'student_id,date_str' })
    .select();

  if (error) throw error;

  return {
    message: `Successfully saved attendance for ${records.length} students in ${team} on ${dateStr}`,
    count: data?.length || records.length
  };
};

const getStudentStats = async (studentId, refDateStr) => {
  const { data: student, error: sErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', studentId)
    .single();

  if (sErr || !student) throw new Error('Student account not found');

  const refDate = refDateStr ? new Date(refDateStr) : new Date();
  const { monday, sunday } = getMondayToSundayRange(refDate);
  const { startOfMonth, endOfMonth } = getMonthRange(refDate);

  const monStr = monday.toISOString().split('T')[0];
  const sunStr = sunday.toISOString().split('T')[0];
  const monthStartStr = startOfMonth.toISOString().split('T')[0];
  const monthEndStr = endOfMonth.toISOString().split('T')[0];

  const { data: allRecords, error: aErr } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('date_str', { ascending: false });

  if (aErr) throw aErr;

  const records = allRecords || [];

  // Weekly stats
  const weeklyRecords = records.filter((r) => r.date_str >= monStr && r.date_str <= sunStr);
  const weeklyPresent = weeklyRecords.filter((r) => r.status === 'Present').length;
  const weeklyAbsent = weeklyRecords.filter((r) => r.status === 'Absent').length;
  const weeklyTotal = weeklyRecords.length;
  const weeklyPercentage = weeklyTotal > 0 ? Math.round((weeklyPresent / weeklyTotal) * 100) : 0;

  // Monthly stats
  const monthlyRecords = records.filter((r) => r.date_str >= monthStartStr && r.date_str <= monthEndStr);
  const monthlyPresent = monthlyRecords.filter((r) => r.status === 'Present').length;
  const monthlyAbsent = monthlyRecords.filter((r) => r.status === 'Absent').length;
  const monthlyTotal = monthlyRecords.length;
  const monthlyPercentage = monthlyTotal > 0 ? Math.round((monthlyPresent / monthlyTotal) * 100) : 0;

  // Overall stats
  const overallPresent = records.filter((r) => r.status === 'Present').length;
  const overallAbsent = records.filter((r) => r.status === 'Absent').length;
  const overallTotal = records.length;
  const overallPercentage = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

  return {
    student: {
      _id: student.id,
      id: student.id,
      name: student.name,
      email: student.email,
      rollNumber: student.roll_number,
      team: student.club_name,
      role: student.role,
      isActive: student.is_active
    },
    refDateStr: refDate.toISOString().split('T')[0],
    weekly: {
      startDate: monStr,
      endDate: sunStr,
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
    history: records.map((r) => ({
      id: r.id,
      dateStr: r.date_str,
      timeStr: r.time_str,
      status: r.status,
      team: r.club_name,
      remarks: r.remarks
    }))
  };
};

const getTeamSummary = async ({ team, range = 'week', refDateStr }) => {
  const refDate = refDateStr ? new Date(refDateStr) : new Date();

  let startDateStr, endDateStr, periodName;

  if (range === 'month') {
    const mRange = getMonthRange(refDate);
    startDateStr = mRange.startOfMonth.toISOString().split('T')[0];
    endDateStr = mRange.endOfMonth.toISOString().split('T')[0];
    periodName = `Month of ${refDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  } else {
    const wRange = getMondayToSundayRange(refDate);
    startDateStr = wRange.monday.toISOString().split('T')[0];
    endDateStr = wRange.sunday.toISOString().split('T')[0];
    periodName = `Week of ${startDateStr} to ${endDateStr}`;
  }

  let studentQuery = supabase.from('users').select('id, name, roll_number, email, club_name').eq('role', 'student').eq('is_active', true);
  if (team && TEAMS.includes(team)) {
    studentQuery = studentQuery.eq('club_name', team);
  }

  const { data: students, error: sErr } = await studentQuery;
  if (sErr) throw sErr;

  let attendanceQuery = supabase.from('attendance').select('*').gte('date_str', startDateStr).lte('date_str', endDateStr);
  if (team && TEAMS.includes(team)) {
    attendanceQuery = attendanceQuery.eq('club_name', team);
  }

  const { data: records, error: aErr } = await attendanceQuery;
  if (aErr) throw aErr;

  const studentMap = new Map();
  (students || []).forEach((st) => {
    studentMap.set(st.id, {
      studentId: st.id,
      name: st.name,
      rollNumber: st.roll_number,
      team: st.club_name,
      present: 0,
      absent: 0,
      total: 0,
      percentage: 0
    });
  });

  (records || []).forEach((rec) => {
    if (studentMap.has(rec.student_id)) {
      const item = studentMap.get(rec.student_id);
      item.total += 1;
      if (rec.status === 'Present') item.present += 1;
      if (rec.status === 'Absent') item.absent += 1;
    }
  });

  const studentSummaries = Array.from(studentMap.values()).map((st) => {
    st.percentage = st.total > 0 ? Math.round((st.present / st.total) * 100) : 0;
    return st;
  });

  const totalRecords = records?.length || 0;
  const totalPresent = records?.filter((r) => r.status === 'Present').length || 0;
  const totalAbsent = records?.filter((r) => r.status === 'Absent').length || 0;
  const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  const teamsBreakdown = TEAMS.map((tName) => {
    const teamRecs = (records || []).filter((r) => r.club_name === tName);
    const tTotal = teamRecs.length;
    const tPresent = teamRecs.filter((r) => r.status === 'Present').length;
    const tAbsent = teamRecs.filter((r) => r.status === 'Absent').length;
    const tStudents = (students || []).filter((s) => s.club_name === tName).length;
    return {
      team: tName,
      totalStudents: tStudents,
      totalSessions: tTotal,
      present: tPresent,
      absent: tAbsent,
      percentage: tTotal > 0 ? Math.round((tPresent / tTotal) * 100) : 0
    };
  });

  return {
    range,
    periodName,
    startDate: startDateStr,
    endDate: endDateStr,
    selectedTeam: team || 'All Teams',
    totalActiveStudents: students?.length || 0,
    totalSessions: totalRecords,
    totalPresent,
    totalAbsent,
    overallPercentage,
    teamsBreakdown,
    studentSummaries: studentSummaries.sort((a, b) => b.percentage - a.percentage || a.rollNumber.localeCompare(b.rollNumber))
  };
};

const getAdminDashboardStats = async () => {
  const todayStr = getTodayDateStr();

  const { count: totalStudents } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true);
  const { count: inactiveStudents } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', false);

  const { data: todayRecords, error } = await supabase.from('attendance').select('*').eq('date_str', todayStr);
  if (error) throw error;

  const recs = todayRecords || [];
  const todayPresent = recs.filter((r) => r.status === 'Present').length;
  const todayAbsent = recs.filter((r) => r.status === 'Absent').length;
  const todayMarked = recs.length;
  const todayPercentage = todayMarked > 0 ? Math.round((todayPresent / todayMarked) * 100) : 0;

  const teamStats = await Promise.all(
    TEAMS.map(async (teamName) => {
      const { count: teamCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('club_name', teamName).eq('is_active', true);
      const teamRecs = recs.filter((r) => r.club_name === teamName);
      const present = teamRecs.filter((r) => r.status === 'Present').length;
      const absent = teamRecs.filter((r) => r.status === 'Absent').length;
      const marked = teamRecs.length;

      return {
        team: teamName,
        totalStudents: teamCount || 0,
        markedCount: marked,
        present,
        absent,
        percentage: marked > 0 ? Math.round((present / marked) * 100) : 0,
        isCompleted: (teamCount || 0) > 0 && marked >= (teamCount || 0)
      };
    })
  );

  return {
    todayStr,
    totalStudents: totalStudents || 0,
    inactiveStudents: inactiveStudents || 0,
    todayMarked,
    todayPresent,
    todayAbsent,
    todayPercentage,
    teamStats
  };
};

module.exports = {
  findUserByIdentifier,
  createStudentAccount,
  getUserById,
  getAllStudents,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  resetStudentPassword,
  deleteStudent,
  getAttendanceRoster,
  markBulkAttendance,
  getStudentStats,
  getTeamSummary,
  getAdminDashboardStats
};
