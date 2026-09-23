const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.resolve(__dirname, '../../teams allocation.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

console.log('--- ALL ROWS FROM EXCEL ---');
rows.forEach((r, idx) => {
  const regd = (r['Regd No'] || '').toString().trim();
  const name = (r['Name'] || '').toString().trim();
  const branch = (r['Branch'] || '').toString().trim();
  const team = (r['Team'] || '').toString().trim();
  console.log(`${idx + 1}. [${regd}] ${name} | Branch: ${branch} | Team: "${team}"`);
});
