const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

/**
 * AUTH ROUTES
 */

// 🔒 Register (Admin only)
router.post('/auth/register', authenticate, adminOnly, userController.registerUser);

// 🔑 Login (Public)
router.post('/auth/login', userController.loginUser);

/**
 * USER MANAGEMENT ROUTES (Admin only)
 */
router.get('/users', authenticate, adminOnly, userController.getAllUsers);
router.put('/users/:id', authenticate, adminOnly, userController.updateUser);
router.put('/users/:id/disable', authenticate, adminOnly, userController.disableUser);
router.put('/users/:id/enable', authenticate, adminOnly, userController.enableUser);

/**
 * NOTIFICATION ROUTES
 */

// 👤 Get all notifications for the logged-in user (read + unread)
router.get('/notifications', authenticate, userController.getNotifications);

// 📬 Get only unread notifications
router.get('/notifications/unread', authenticate, userController.getUnreadNotifications);

// ✅ Mark notification as read
router.put('/notifications/:id/read', authenticate, userController.markNotificationRead);

// 🧭 Admin-only: Get all system notifications (for all users)
router.get('/notifications/all', authenticate, adminOnly, userController.getAllNotifications);

// Profile
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);


module.exports = router;
