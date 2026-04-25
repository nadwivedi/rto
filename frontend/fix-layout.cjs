const fs = require('fs');
const p = 'c:/Users/Naray/OneDrive/Desktop/code/rto2/frontend/src/pages/DrivingLicence/components/ApplicationDetailModal.jsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('grid-cols-2 md:grid-cols-3', 'grid-cols-2 md:grid-cols-4');
c = c.replace(/<div className='bg-white\/80 p-2 rounded-lg col-span-2'>\s*<label className='text-\[10px\] md:text-xs font-semibold text-gray-600'>Full Name<\/label>/g, "<div className='bg-white/80 p-2 rounded-lg'>\n                  <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Full Name</label>");
c = c.replace(/<div className='bg-white\/80 p-2 rounded-lg col-span-2'>\s*<label className='text-\[10px\] md:text-xs font-semibold text-gray-600'>Father's Name<\/label>/g, "<div className='bg-white/80 p-2 rounded-lg'>\n                  <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Father's Name</label>");
c = c.replace('col-span-2 md:col-span-3', 'col-span-2 md:col-span-4');
fs.writeFileSync(p, c);
