require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const { User } = require('./models/User');
const Attendance = require('./models/Attendance');
const { getStudentsFromExcel } = require('./import_excel');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing Users and Attendance data...');

    await User.deleteMany({});
    await Attendance.deleteMany({});

    // 1. Create Admin
    const adminPasswordHash = await User.hashPassword('admin123');
    const adminUser = await User.create({
      name: 'MITRA Super Admin',
      email: 'admin@mitra.edu',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isActive: true
    });
    console.log(`[Seed] Created Admin user: ${adminUser.email} (Password: admin123)`);

    // 2. Load students from Excel sheet
    const studentsFromExcel = getStudentsFromExcel();
    console.log(`[Seed] Loading ${studentsFromExcel.length} students from Excel datasheet...`);

    const studentPasswordHash = await User.hashPassword('student123');
    const createdStudents = [];

    for (const studentData of studentsFromExcel) {
      const student = await User.create({
        name: studentData.name,
        email: studentData.email,
        rollNumber: studentData.rollNumber,
        team: studentData.team,
        passwordHash: studentPasswordHash,
        role: 'student',
        isActive: true
      });
      createdStudents.push(student);
    }
    console.log(`[Seed] Successfully created ${createdStudents.length} real students from Excel dataset.`);

    // 3. Generate historical attendance records for the past 14 days
    console.log('[Seed] Generating historical attendance records for all 68 students...');
    const now = new Date();
    const attendanceDocs = [];

    for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);

      // Skip Sundays
      if (d.getUTCDay() === 0) continue;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      const parsedDate = new Date(Date.UTC(year, d.getMonth(), d.getDate(), 0, 0, 0, 0));

      createdStudents.forEach((st, idx) => {
        // High attendance rate ~88%
        const isPresent = (idx + dayOffset) % 8 !== 0;
        const status = isPresent ? 'Present' : 'Absent';

        attendanceDocs.push({
          student: st._id,
          team: st.team,
          dateStr,
          date: parsedDate,
          status,
          markedBy: adminUser._id,
          remarks: isPresent ? 'Active participant' : 'Prior leave'
        });
      });
    }

    await Attendance.insertMany(attendanceDocs);
    console.log(`[Seed] Successfully inserted ${attendanceDocs.length} attendance records.`);
    console.log('[Seed] Database seeding completed successfully with all Excel datasheet students!');
  } catch (err) {
    console.error('[Seed] Error during database seeding:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
