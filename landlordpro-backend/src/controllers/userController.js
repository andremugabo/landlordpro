const {
    registerUser: registerService,
    loginUser: loginService,
    getAllUsers: getAllUsersService,
    updateUser: updateService,
    disableUser: disableService,
    enableUser: enableService,
    getAllNotifications: getAllNotificationsService
} = require('../services/userService');
const { Notification, User } = require('../models');

// Register user (only admin in routes)
async function registerUser(req, res) {
    try {
        const user = await registerService(req.body);
        const { password_hash, ...userData } = user.toJSON();
        res.status(201).json({ success: true, user: userData });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// Login
async function loginUser(req, res) {
    try {
        const { user, token } = await loginService(req.body);
        const { password_hash, ...userData } = user.toJSON();
        res.status(200).json({ success: true, user: userData, token });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// Get all users (with pagination)
async function getAllUsers(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await getAllUsersService({ limit, offset });

        res.status(200).json({
            success: true,
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            users: rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Update user
async function updateUser(req, res) {
    try {
        const user = await updateService(req.params.id, req.body);
        const { password_hash, ...userData } = user.toJSON();
        res.status(200).json({ success: true, user: userData });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// Disable user
async function disableUser(req, res) {
    try {
        const user = await disableService(req.params.id);
        const { password_hash, ...userData } = user.toJSON();
        res.status(200).json({ success: true, user: userData });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// Get user notifications (with pagination)
async function getNotifications(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Notification.findAndCountAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.status(200).json({
            success: true,
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            notifications: rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Mark notification as read
async function markNotificationRead(req, res) {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });
        if (!notification) throw new Error('Notification not found');

        await notification.update({ is_read: true });
        res.status(200).json({ success: true, notification });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// Get unread notifications (with pagination)
async function getUnreadNotifications(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Notification.findAndCountAll({
            where: { user_id: req.user.id, is_read: false },
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.status(200).json({
            success: true,
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            notifications: rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Enable user
async function enableUser(req, res) {
    try {
        const user = await enableService(req.params.id);
        const { password_hash, ...userData } = user.toJSON();
        res.status(200).json({ success: true, user: userData });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// Get all notifications (admin, with pagination)
async function getAllNotifications(req, res) {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await getAllNotificationsService({ limit, offset });

        res.status(200).json({
            success: true,
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            notifications: rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    updateUser,
    disableUser,
    getNotifications,
    markNotificationRead,
    enableUser,
    getAllNotifications,
    getUnreadNotifications
};
