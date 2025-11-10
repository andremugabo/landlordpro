const sequelize = require('./db');
const models = require('./src/models'); 

(async () => {
  try {
    console.log('⚡ Syncing database schema...');

    // Update tables to match models without dropping data
    await sequelize.sync({ alter: true });

    console.log('✅ Database schema synced successfully!');
    process.exit(0); // exit after successful sync
  } catch (err) {
    console.error('❌ Sync error:', err);
    process.exit(1);
  }
})();
