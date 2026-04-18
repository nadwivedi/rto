const mongoose = require('mongoose');
require('dotenv').config();
const WaSession = require('./models/WaSession');
const MessageLog = require('./models/MessageLog');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  await WaSession.deleteMany({});
  await MessageLog.deleteMany({ userId: { $exists: false } });
  console.log('Cleared old WaSession and MessageLogs without userId');
  process.exit(0);
}

run().catch(console.error);
