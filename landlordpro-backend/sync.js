const sequelize = require('./db');

require('./src/models/User');
// require('./src/models/Tenant');
// require('./src/models/Property');
// require('./src/models/Local');
// require('./src/models/Lease');
// require('./src/models/Payment');
// require('./src/models/PaymentMode');
// require('./src/models/Document');
// require('./src/models/Expense');
// require('./src/models/Notification');

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema synced successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync error:', err);
    process.exit(1);
  }
})();
