const sequelize = require('./db');
const models = require('./src/models'); // make sure this points to your index.js with all models

(async () => {
  try {
    console.log('⚡ Dropping and recreating all tables...');

    // Drops all tables and recreates them from scratch
    await sequelize.sync({ force: true });

    console.log('✅ Database schema recreated successfully!');
    process.exit(0); // exit after successful sync
  } catch (err) {
    console.error('❌ Sync error:', err);
    process.exit(1);
  }
})();
