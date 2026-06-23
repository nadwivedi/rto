const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/rto').then(async () => {
  const Driving = require('./backend/models/Driving');
  const apps = await Driving.find({ "expenseBreakup": { $exists: true, $not: {$size: 0} } }).limit(2);
  console.log(JSON.stringify(apps, null, 2));
  process.exit(0);
});
