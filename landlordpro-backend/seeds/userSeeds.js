const User = require('../src/models/User');
const bcrypt = require('bcrypt');

module.exports = async function seedUsers() {
  const count = await User.count();
  if (count > 0) {
    console.log('👤 Users already seeded, skipping.');
    return;
  }

  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);

  await User.bulkCreate([
    {
      email: 'admin@example.com',
      password_hash: adminPass,
      full_name: 'System Admin',
      role: 'admin',
      is_active: true,
    },
    {
      email: 'user@example.com',
      password_hash: userPass,
      full_name: 'Normal User',
      role: 'user',
      is_active: true,
    },
  ]);

  console.log('✅ Users seeded');
};
