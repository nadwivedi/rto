const pdfParse = require('pdf-parse');
const fs = require('fs');
const buf = fs.readFileSync('../frontend/public/insurance/AISHNA CREATORS CG04MN8533.pdf');
pdfParse(buf).then(d => {
  const text = d.text.replace(/[\u0900-\u097F]+/g, '');
  
  // Simulate what AI would return for productType
  const lines = text.split('\n').filter(l => l.trim().length > 3);
  console.log('Product type relevant lines:');
  lines.forEach(l => {
    if (/two.wheel|two wheeler|private car|goods|gcv|pcv|taxi|scooter|motorcycle/i.test(l)) {
      console.log(' -', l.trim().substring(0, 120));
    }
  });
  
  // Check UIN line (likely where "Digit Two-Wheeler Insurance" appears)
  const uinMatch = text.match(/UIN No[.:]?\s*([^\n]+)/i);
  console.log('\nUIN line:', uinMatch ? uinMatch[1].trim() : 'not found');

  // Body type
  const bodyMatch = text.match(/Body\s*Type\s*([^\n]+)/i);
  console.log('Body Type line:', bodyMatch ? bodyMatch[0].trim() : 'not found');

  // Test the regex match logic
  const testCases = ['Two-Wheeler', 'Digit Two-Wheeler Insurance', 'Two Wheeler', 'Scooter', 'Private Car', 'GCV'];
  console.log('\nRegex match tests:');
  testCases.forEach(raw => {
    const t = raw.toUpperCase().replace(/-/g, ' ');
    let result = '';
    if (/PRIVATE\s*CAR|PRIVATE\s*VEHICLE|PRIVATE\s*MOTORCAR|PKG\s*OD/.test(t)) result = 'Pvt. Car';
    else if (/TWO\s*WHEEL|2\s*WHEEL|MOTOR\s*CYCLE|BIKE|SCOOTER|MOTORCYCLE/.test(t)) result = 'Two Wheeler';
    else if (/GCV\s*3W|GOODS.*THREE\s*WHEEL|THREE\s*WHEEL.*GOODS/.test(t)) result = 'GCV-3W';
    else if (/GCV|GOODS\s*CARR|GOODS\s*VEHICLE/.test(t)) result = 'GCV';
    else result = '(no match)';
    console.log(`  "${raw}" -> normalized: "${t}" -> "${result}"`);
  });
});
