const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Middleware: Verify JWT and attach user to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1️⃣ Check for missing or malformed Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token missing or malformed' });
    }

    // 2️⃣ Extract and verify JWT
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // 3️⃣ Find user in DB
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or removed' });
    }

    // 4️⃣ Check if account is disabled
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account disabled. Contact admin.' });
    }

    // ✅ Attach user to request
    if (user.role) {
      user.role = String(user.role).toLowerCase();
    }
    req.user = user;
    next();

  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
}

/**
 * Middleware: Restrict route to admin users
 */
function adminOnly(req, res, next) {
  const role = req.user?.role ? String(req.user.role).toLowerCase() : '';
  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
  }
  next();
}

/**
 * Middleware: Restrict route to admin or manager users
 */
function managerOrAdminOnly(req, res, next) {
  const role = req.user?.role ? String(req.user.role).toLowerCase() : '';
  if (role === 'admin' || role === 'manager') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied: Managers or admins only' });
}

module.exports = { authenticate, adminOnly, managerOrAdminOnly };
