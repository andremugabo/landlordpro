const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Auth
router.post('/register', authenticate, adminOnly, userController.registerUser); // Admin-only user creation
router.post('/auth/login', userController.loginUser);                           // Public login

// Users
router.get('/users', authenticate, adminOnly, userController.getAllUsers);     // Admin: list all users
router.put('/users/:id', authenticate, adminOnly, userController.updateUser);  // Admin: update user
router.put('/users/:id/disable', authenticate, adminOnly, userController.disableUser);
router.put('/users/:id/enable', authenticate, adminOnly, userController.enableUser);

// Notifications
router.get('/notifications', authenticate, userController.getNotifications);          // Logged-in user's notifications
router.get('/notifications/unread', authenticate, userController.getUnreadNotifications);
router.put('/notifications/:id/read', authenticate, userController.markNotificationRead);

// Admin-only: view all notifications across system
router.get('/notifications/all', authenticate, adminOnly, userController.getAllNotifications);

module.exports = router;
