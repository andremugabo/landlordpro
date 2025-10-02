const { User, registerSchema, loginSchema, updateSchema, disableSchema } = require('../models/User');
const { Notification } = require('../models/Notification');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user
async function registerUser(data) {
    const { error, value } = registerSchema.validate(data);
    if (error) throw new Error(error.details[0].message);

    const hashed = await bcrypt.hash(value.password, 10);
    return await User.create({ ...value, password_hash: hashed });
}

// Login
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

// Get all users
async function getAllUsers() {
    return await User.findAll({ attributes: { exclude: ['password_hash'] } });
}

// Update user by ID
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

    // Optional: Create notification
    await Notification.create({
        user_id: id,
        message: 'Your account has been updated.',
        type: 'user_update'
    });

    return user;
}

// Disable user by ID
async function disableUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');

    await user.update({ is_active: false });

    // Optional: Create notification
    await Notification.create({
        user_id: id,
        message: 'Your account has been disabled.',
        type: 'user_disable'
    });

    return user;
}

// Enable user by ID (service)
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

// Get all notifications (service) - Admin only
async function getAllNotifications() {
    return await Notification.findAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }],
        order: [['created_at', 'DESC']]
    });
}


module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    updateUser,
    disableUser,
    enableUser,
    getAllNotifications
};
