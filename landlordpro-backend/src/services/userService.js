const { User, Notification } = require('../models');
const { registerSchema, loginSchema, updateSchema } = require('../models/User'); // adjust if needed
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- Auth Services ---

async function registerUser(data) {
    const { error, value } = registerSchema.validate(data);
    if (error) throw new Error(error.details[0].message);

    const hashed = await bcrypt.hash(value.password, 10);
    return await User.create({ ...value, password_hash: hashed });
}

async function loginUser(data) {
    const { error, value } = loginSchema.validate(data);
    if (error) throw new Error(error.details[0].message);

    const user = await User.findOne({ where: { email: value.email } });
    if (!user) throw new Error('Invalid email');

    const match = await bcrypt.compare(value.password, user.password_hash);
    if (!match) throw new Error('Invalid password');

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return { user, token };
}

// --- User Management ---

async function getAllUsers({ page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const users = await User.findAndCountAll({
        attributes: { exclude: ['password_hash'] },
        limit,
        offset,
        order: [['created_at', 'DESC']]
    });
    return users;
}

async function updateUser(id, data) {
    const { error, value } = updateSchema.validate(data);
    if (error) throw new Error(error.details[0].message);

    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');

    await user.update({
        full_name: value.full_name,
        email: value.email,
        role: value.role
    });

    await Notification.create({
        user_id: id,
        message: 'Your account has been updated.',
        type: 'user_update'
    });

    return user;
}

async function disableUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');

    await user.update({ is_active: false });

    await Notification.create({
        user_id: id,
        message: 'Your account has been disabled.',
        type: 'user_disable'
    });

    return user;
}

async function enableUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');

    await user.update({ is_active: true });

    await Notification.create({
        user_id: id,
        message: 'Your account has been enabled.',
        type: 'user_enable'
    });

    return user;
}

// --- Notifications ---

async function getAllNotifications({ page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Notification.findAndCountAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });
    return { count, rows };
}

async function getUnreadNotifications({ userId, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Notification.findAndCountAll({
        where: { user_id: userId, is_read: false },
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });
    return { count, rows };
}

async function markNotificationRead(id, userId) {
    const notification = await Notification.findOne({ where: { id, user_id: userId } });
    if (!notification) throw new Error('Notification not found');

    await notification.update({ is_read: true });
    return notification;
}

// --- Export all services ---

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    updateUser,
    disableUser,
    enableUser,
    getAllNotifications,
    getUnreadNotifications,
    markNotificationRead,
};
