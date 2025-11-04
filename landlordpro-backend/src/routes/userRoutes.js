// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');
const { uploadProof, processProof, uploadAvatar, processAvatar } = require('../utils/fileUpload');

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
 * PROFILE ROUTES
 */
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);

// 🔑 Update password (self or admin)
router.put('/profile/password', authenticate, userController.updatePassword);

// 🖼 Update profile picture (uses dedicated avatar upload)
router.put(
  '/profile/picture',
  authenticate,
  uploadAvatar.single('avatar'), // Multer memory storage for avatars
  processAvatar,                 // Sharp resize/compress for avatars
  userController.updatePicture
);

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

module.exports = router;
