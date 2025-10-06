const sequelize = require('./db');
const models = require('./src/models'); // only index.js

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema synced successfully!');
  } catch (err) {
    console.error('❌ Sync error:', err);
  }
})();
