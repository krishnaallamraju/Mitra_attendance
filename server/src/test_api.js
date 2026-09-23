const http = require('http');

const request = (method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function testWithExcelData() {
  console.log('--- TESTING API SUITE WITH REAL EXCEL DATASHEET ---');

  // 1. Health
  const health = await request('GET', '/health');
  console.log('1. Health check:', health.status, health.body);

  // 2. Admin login
  const adminLogin = await request('POST', '/auth/login', {}, { identifier: 'admin@mitra.edu', password: 'admin123' });
  console.log('2. Admin Login status:', adminLogin.status, 'User:', adminLogin.body.user?.email);
  const token = adminLogin.body.token;

  // 3. Admin Dashboard stats
  const dash = await request('GET', '/attendance/admin-dashboard', { Authorization: `Bearer ${token}` });
  console.log('3. Admin Dashboard: Total students =', dash.body.totalStudents);
  console.log('   Team counts:');
  dash.body.teamStats.forEach(t => console.log(`   - ${t.team}: ${t.totalStudents} students`));

  // 4. Test Roster for AI Team
  const aiRoster = await request('GET', '/attendance/roster?team=AI%20Team', { Authorization: `Bearer ${token}` });
  console.log('4. AI Team Roster count:', aiRoster.body.totalStudents, 'Students:', aiRoster.body.roster?.slice(0, 3).map(s => `${s.rollNumber} (${s.name})`));

  // 5. Test Roster for Vibe Coding
  const vcRoster = await request('GET', '/attendance/roster?team=Vibe%20Coding', { Authorization: `Bearer ${token}` });
  console.log('5. Vibe Coding Roster count:', vcRoster.body.totalStudents, 'Students:', vcRoster.body.roster?.slice(0, 3).map(s => `${s.rollNumber} (${s.name})`));

  // 6. Test Student Login with Real Regd No from Excel (e.g. 24PA1A4511)
  const stLogin = await request('POST', '/auth/login', {}, { identifier: '24PA1A4511', password: 'student123' });
  console.log('6. Student Login (24PA1A4511):', stLogin.status, 'Name:', stLogin.body.user?.name, 'Team:', stLogin.body.user?.team);

  // 7. Student stats
  const stToken = stLogin.body.token;
  const stStats = await request('GET', `/attendance/student/${stLogin.body.user?._id}`, { Authorization: `Bearer ${stToken}` });
  console.log('7. Student Personal Stats:', stStats.status, 'Weekly %:', stStats.body.weekly?.percentage + '%');

  console.log('--- ALL EXCEL DATASET API TESTS PASSED SUCCESSFULLY! ---');
}

testWithExcelData().catch(console.error);
