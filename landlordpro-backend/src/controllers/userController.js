const {
  registerUser: registerService,
  loginUser: loginService,
  getAllUsers: getAllUsersService,
  updateUser: updateService,
  disableUser: disableService,
  enableUser: enableService,
  getAllNotifications: getAllNotificationsService,
  getUnreadNotifications: getUnreadNotificationsService,
  markNotificationRead: markNotificationReadService,
} = require('../services/userService');

// --- Auth Controllers ---

// Register new user (Admin only)
async function registerUser(req, res) {
  try {
    if (req.user?.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const user = await registerService(req.body);
    const { password_hash, ...userData } = user.toJSON();
    res.status(201).json({ success: true, user: userData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// Login user
async function loginUser(req, res) {
  try {
    const { user, token } = await loginService(req.body); // user already sanitized
    res.status(200).json({ success: true, user, token });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// --- User Management Controllers ---

async function getAllUsers(req, res) {
  try {
    if (req.user?.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const users = await getAllUsersService({ page, limit });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function updateUser(req, res) {
  try {
    if (req.user?.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const user = await updateService(req.params.id, req.body);
    const { password_hash, ...userData } = user.toJSON();
    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function disableUser(req, res) {
  try {
    if (req.user?.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const user = await disableService(req.params.id);
    const { password_hash, ...userData } = user.toJSON();
    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
}

async function enableUser(req, res) {
  try {
    if (req.user?.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const user = await enableService(req.params.id);
    const { password_hash, ...userData } = user.toJSON();
    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
}

// --- Notifications Controllers ---

// ✅ Get all notifications for logged-in user (read + unread)
async function getNotifications(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { count, rows } = await getAllNotificationsService({ page, limit });
    res.status(200).json({
      success: true,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      notifications: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get unread notifications for logged-in user
async function getUnreadNotifications(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { count, rows } = await getUnreadNotificationsService({
      userId: req.user.id,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      notifications: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Mark notification as read
async function markNotificationRead(req, res) {
  try {
    const notification = await markNotificationReadService(req.params.id, req.user.id);
    res.status(200).json({ success: true, notification });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
}

// Get all notifications (Admin)
async function getAllNotifications(req, res) {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { count, rows } = await getAllNotificationsService({ page, limit });
    res.status(200).json({
      success: true,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      notifications: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


// Get current user profile
async function getProfile(req, res) {
  try {
    const user = req.user; // already attached by authenticate middleware
    const { password_hash, ...userData } = user.toJSON();
    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update current user profile
async function updateProfile(req, res) {
  try {
    const user = req.user;
    const { full_name, email, phone, avatar } = req.body;

    await user.update({ full_name, email, phone, avatar });
    const { password_hash, ...userData } = user.toJSON();

    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  updateUser,
  disableUser,
  enableUser,
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  getAllNotifications,
  getProfile,
  updateProfile,
};
