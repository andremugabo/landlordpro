const User = require('../models/User');
const { registerSchema, loginSchema, updateSchema } = User.schemas;
const { Notification } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- Auth Services ---

async function registerUser(data) {
  const { error, value } = registerSchema.validate(data);
  if (error) throw new Error(error.details[0].message);

  const existing = await User.findOne({ where: { email: value.email } });
  if (existing) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(value.password, 10);

  const user = await User.create({
    ...value,
    password_hash: hashed,
  });

  await Notification.create({
    user_id: user.id,
    message: 'Welcome! Your account has been created successfully.',
    type: 'user_register',
  });

  return user;
}

async function loginUser(data) {
  const { error, value } = loginSchema.validate(data);
  if (error) throw new Error(error.details[0].message);

  const user = await User.findOne({ where: { email: value.email } });
  if (!user) throw new Error('Invalid email or password');

  const match = await bcrypt.compare(value.password, user.password_hash);
  if (!match) throw new Error('Invalid email or password');

  if (!user.is_active) throw new Error('Your account is disabled. Please contact the administrator.');

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const { password_hash, ...safeUser } = user.toJSON();
  return { user: safeUser, token };
}

// --- User Management Services ---

async function getAllUsers({ page = 1, limit = 10 } = {}) {
  const offset = (page - 1) * limit;
  return await User.findAndCountAll({
    attributes: { exclude: ['password_hash'] },
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });
}

async function updateUser(id, data) {
  const { error, value } = updateSchema.validate(data);
  if (error) throw new Error(error.details[0].message);

  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');

  await user.update(value);

  await Notification.create({
    user_id: id,
    message: 'Your account has been updated.',
    type: 'user_update',
  });

  return user;
}

// --- Separate password update ---
async function updateUserPassword(id, { oldPassword, newPassword }) {
  if (!newPassword) throw new Error('New password is required');

  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');

  const isDefaultPassword = await bcrypt.compare('123456', user.password_hash);

  if (!isDefaultPassword) {
    if (!oldPassword) throw new Error('Old password is required');
    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match) throw new Error('Old password is incorrect');
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password_hash = hashed;
  await user.save();

  await Notification.create({
    user_id: user.id,
    message: 'Your password has been updated successfully.',
    type: 'user_update_password',
  });

  return { message: 'Password updated successfully' };
}

// --- Separate profile picture update ---
async function updateUserPicture(id, picturePath) {
  if (!picturePath) throw new Error('Picture path is required');

  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');

  user.profile_picture = picturePath;
  await user.save();

  await Notification.create({
    user_id: id,
    message: 'Your profile picture has been updated.',
    type: 'user_update_picture',
  });

  return user;
}

async function disableUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');
  if (!user.is_active) throw new Error('User is already disabled');

  await user.update({ is_active: false });

  await Notification.create({
    user_id: id,
    message: 'Your account has been disabled.',
    type: 'user_disable',
  });

  return user;
}

async function enableUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');
  if (user.is_active) throw new Error('User is already enabled');

  await user.update({ is_active: true });

  await Notification.create({
    user_id: id,
    message: 'Your account has been enabled.',
    type: 'user_enable',
  });

  return user;
}

// --- Notifications Services ---

async function getAllNotifications({ page = 1, limit = 10 } = {}) {
  const offset = (page - 1) * limit;
  const { count, rows } = await Notification.findAndCountAll({
    include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  return { count, rows };
}

async function getUnreadNotifications({ userId, page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;
  const { count, rows } = await Notification.findAndCountAll({
    where: { user_id: userId, is_read: false },
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  return { count, rows };
}

async function markNotificationRead(id, userId) {
  const notification = await Notification.findOne({ where: { id, user_id: userId } });
  if (!notification) throw new Error('Notification not found');

  await notification.update({ is_read: true });
  return notification;
}

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  updateUser,
  updateUserPassword,
  updateUserPicture,
  disableUser,
  enableUser,
  getAllNotifications,
  getUnreadNotifications,
  markNotificationRead,
};
