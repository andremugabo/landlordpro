const User = require('../src/models/User');
const bcrypt = require('bcrypt');

module.exports = async function seedUsers() {
  const count = await User.count();
  if (count > 0) {
    console.log('👤 Users already seeded, skipping.');
    return;
  }

  const adminPass = await bcrypt.hash('123456', 10);
  const normalPass = await bcrypt.hash('123456', 10);

  // Make sure the enum in your DB allows 'normal' instead of 'user'
  await User.bulkCreate([
    {
      email: 'admin@landlordpro.com',
      password_hash: adminPass,
      full_name: 'System Admin',
      role: 'admin',      
      is_active: true,
    },
    {
      email: 'manager@landlordpro.com',
      password_hash: normalPass,
      full_name: 'Manager User',
      role: 'manager',    
      is_active: true,
    },
  ]);

  console.log('✅ Users seeded');
};
