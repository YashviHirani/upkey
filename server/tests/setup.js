const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Spins up a real (but temporary, in-memory) MongoDB instance for tests.
// Set generous timeout for embedded MongoDB startup
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}
let mongoServer;

async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

// Wipes all collections between tests so one test's data can't leak into another.
async function clearTestDB() {
  const { collections } = mongoose.connection;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
}

async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}

module.exports = { connectTestDB, clearTestDB, closeTestDB };
