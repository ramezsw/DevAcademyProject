
const { sequelize } = require('../src/models');


const setupTestDb = async () => {
  try {
    // force recreate all tables
    await sequelize.sync({ force: true });
    console.log('Test database synced');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
};


const teardownTestDb = async () => {
  try {
    // Close all connections
    await sequelize.close();
    console.log('Test database connections closed');
  } catch (error) {
    console.error('Test database teardown failed:', error);
    throw error;
  }
};

module.exports = {
  setupTestDb,
  teardownTestDb
};