const sequelize = require('./db');

// Load models first
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

// Import seeders
const seedUsers = require('./seeds/userSeeds');
// const seedPaymentModes = require('./seeds/paymentModeSeeds');
// const seedTenants = require('./seeds/tenantSeeds');
// Add more as needed...

(async () => {
  try {
    console.log('🌱 Seeding started...');

    // Make sure DB schema exists
    await sequelize.sync();

    // Run seeds in logical order
    await seedUsers();
    // await seedPaymentModes();
    // await seedTenants();
    // ... add property, local, lease, etc

    console.log('🌱 All seeds completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
})();
