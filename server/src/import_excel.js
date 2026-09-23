const XLSX = require('xlsx');
const path = require('path');

const getStudentsFromExcel = () => {
  const excelPath = path.resolve(__dirname, '../../teams allocation.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const teamCodeMap = {
    vc: 'Vibe Coding',
    ai: 'AI Team',
    ic: 'Industry Connect',
    mk: 'Marketing'
  };

  const defaultTeams = ['Vibe Coding', 'AI Team', 'Industry Connect', 'Marketing'];
  const students = [];

  rows.forEach((r, idx) => {
    const regdNo = (r['Regd No'] || r['regd no'] || r['RegdNo'] || '').toString().trim().toUpperCase();
    const name = (r['Name'] || r['name'] || '').toString().trim();
    const branch = (r['Branch'] || r['branch'] || '').toString().trim();
    const rawTeam = (r['Team'] || r['team'] || '').toString().trim().toLowerCase();

    // Skip empty row at the end
    if (!regdNo && !name) return;

    // Resolve team name
    let team = teamCodeMap[rawTeam];
    if (!team) {
      // If team not assigned in excel, distribute systematically across teams
      team = defaultTeams[idx % defaultTeams.length];
    }

    // Generate clean email
    const emailPrefix = regdNo ? regdNo.toLowerCase() : name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${emailPrefix}@vishnu.edu.in`;

    students.push({
      rollNumber: regdNo || `24VIT${String(idx + 1).padStart(3, '0')}`,
      name: name || `Student ${regdNo}`,
      branch,
      team,
      email
    });
  });

  return students;
};

module.exports = { getStudentsFromExcel };

if (require.main === module) {
  const list = getStudentsFromExcel();
  console.log(`Parsed ${list.length} students from teams allocation.xlsx`);
  console.log('Sample parsed records:');
  console.log(list.slice(0, 5));

  const teamCounts = {};
  list.forEach((s) => {
    teamCounts[s.team] = (teamCounts[s.team] || 0) + 1;
  });
  console.log('Students per team:', teamCounts);
}
