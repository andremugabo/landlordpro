const {
  registerUser: registerService,
  loginUser: loginService,
  getAllUsers: getAllUsersService,
  updateUser: updateService,
  updateUserPassword: updatePasswordService,
  updateUserPicture: updatePictureService,
  disableUser: disableService,
  enableUser: enableService,
  getAllNotifications: getAllNotificationsService,
  getUnreadNotifications: getUnreadNotificationsService,
  markNotificationRead: markNotificationReadService,
} = require('../services/userService');

// --- Auth Controllers ---

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

async function loginUser(req, res) {
  try {
    const { user, token } = await loginService(req.body);
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

// --- Separate controllers for password & picture ---

// Update user password
async function updatePassword(req, res) {
  try {
    const userId = req.user?.role === 'admin' && req.body.userId ? req.body.userId : req.user.id;
    const { oldPassword, newPassword } = req.body;

    const result = await updatePasswordService(userId, { oldPassword, newPassword });
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
}

// Update user profile picture
async function updatePicture(req, res) {
  try {
    const userId = req.user.id;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const picturePath = `/uploads/avatars/${req.file.filename}`;
    const user = await updatePictureService(userId, picturePath);

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

async function markNotificationRead(req, res) {
  try {
    const notification = await markNotificationReadService(req.params.id, req.user.id);
    res.status(200).json({ success: true, notification });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
}

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

// --- Profile Controllers ---

async function getProfile(req, res) {
  try {
    const user = req.user;
    const { password_hash, ...userData } = user.toJSON();
    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

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
  updatePassword,
  updatePicture,
  disableUser,
  enableUser,
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  getAllNotifications,
  getProfile,
  updateProfile,
};
