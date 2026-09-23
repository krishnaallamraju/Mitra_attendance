require('dotenv').config();
const { supabase, isSupabaseConfigured } = require('./config/supabase');
const { getStudentsFromExcel } = require('./import_excel');
const bcrypt = require('bcryptjs');

const clubsData = [
  { name: 'Vibe Coding', code: 'VC', description: 'Software development and modern web apps' },
  { name: 'AI Team', code: 'AI', description: 'Machine learning and deep tech research' },
  { name: 'Industry Connect', code: 'IC', description: 'Corporate partnerships and hackathons' },
  { name: 'Marketing', code: 'MKT', description: 'Club branding, creative design, and promos' }
];

const seedSupabase = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[Seed Supabase] Supabase credentials (SUPABASE_URL, SUPABASE_KEY) are not set in .env.');
    console.log('[Seed Supabase] Please set your Supabase credentials in server/.env to run migrations against your remote project.');
    process.exit(0);
  }

  try {
    console.log('[Seed Supabase] Seeding clubs into Supabase PostgreSQL...');
    for (const club of clubsData) {
      await supabase.from('clubs').upsert(club, { onConflict: 'name' });
    }

    // Seed Admin
    console.log('[Seed Supabase] Creating default Admin user...');
    const adminSalt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', adminSalt);

    const { data: adminUser, error: aErr } = await supabase
      .from('users')
      .upsert(
        {
          name: 'MITRA Super Admin',
          email: 'admin@mitra.edu',
          role: 'admin',
          password_hash: adminPasswordHash,
          is_active: true
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (aErr) throw aErr;
    console.log(`[Seed Supabase] Admin user seeded: ${adminUser.email}`);

    // Seed Students from Excel
    const studentsFromExcel = getStudentsFromExcel();
    console.log(`[Seed Supabase] Creating ${studentsFromExcel.length} students from Excel datasheet...`);
    const studentSalt = await bcrypt.genSalt(10);
    const studentPasswordHash = await bcrypt.hash('student123', studentSalt);

    const createdStudentIds = [];

    for (const st of studentsFromExcel) {
      const { data: stUser, error: sErr } = await supabase
        .from('users')
        .upsert(
          {
            name: st.name,
            email: st.email,
            roll_number: st.rollNumber,
            club_name: st.team,
            role: 'student',
            password_hash: studentPasswordHash,
            is_active: true
          },
          { onConflict: 'email' }
        )
        .select()
        .single();

      if (sErr) throw sErr;
      createdStudentIds.push({ id: stUser.id, team: st.team });

      await supabase.from('students').upsert(
        {
          user_id: stUser.id,
          roll_number: st.rollNumber,
          club_name: st.team
        },
        { onConflict: 'user_id' }
      );
    }
    console.log(`[Seed Supabase] Seeded ${createdStudentIds.length} students into Supabase.`);

    // Historical attendance records
    console.log('[Seed Supabase] Seeding historical attendance logs for all 68 students...');
    const now = new Date();
    const attendanceRows = [];

    for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      if (d.getUTCDay() === 0) continue; // Skip Sundays

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;

      createdStudentIds.forEach((st, idx) => {
        const isPresent = (idx + dayOffset) % 8 !== 0;
        const status = isPresent ? 'Present' : 'Absent';

        attendanceRows.push({
          student_id: st.id,
          club_name: st.team,
          date_str: dateStr,
          date: dateStr,
          time_str: isPresent ? '09:15:00' : '00:00:00',
          status,
          remarks: isPresent ? 'Active participant' : 'Prior leave',
          marked_by: adminUser.id
        });
      });
    }

    const { error: attErr } = await supabase
      .from('attendance')
      .upsert(attendanceRows, { onConflict: 'student_id,date_str' });

    if (attErr) throw attErr;

    console.log(`[Seed Supabase] Successfully inserted ${attendanceRows.length} attendance records into Supabase PostgreSQL.`);
    console.log('[Seed Supabase] Seeding complete! Database is fully populated with Excel datasheet data.');
  } catch (err) {
    console.error('[Seed Supabase] Error during seeding:', err.message);
  } finally {
    process.exit(0);
  }
};

if (require.main === module) {
  seedSupabase();
}

module.exports = seedSupabase;
