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
      console.log('❌ Auth failed: Missing or malformed authorization header');
      return res.status(401).json({ success: false, message: 'Access token missing or malformed' });
    }

    // 2️⃣ Extract and verify JWT
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decoded:', { id: decoded.id, exp: new Date(decoded.exp * 1000) });
    } catch (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // 3️⃣ Find user in DB
    const user = await User.findByPk(decoded.id);
    if (!user) {
      console.log('❌ User not found in DB:', decoded.id);
      return res.status(401).json({ success: false, message: 'User not found or removed' });
    }

    // 4️⃣ Check if account is disabled
    if (!user.is_active) {
      console.log('❌ User account is inactive:', user.id);
      return res.status(403).json({ success: false, message: 'Account disabled. Contact admin.' });
    }

    // ✅ Attach user to request with proper field mapping
    const normalizedRole = user.role ? String(user.role).toLowerCase() : '';
    
    // Handle different possible username field names
    const username = user.username || user.user_name || user.name || user.email || 'unknown';
    
    // 🐛 DEBUG: Log the raw user object to see actual fields
    console.log('🔍 Raw user fields:', Object.keys(user.dataValues || user));
    
    // 🐛 DEBUG: Log the user being attached
    console.log('✅ User authenticated:', {
      id: user.id,
      username: username,
      role: normalizedRole,
      is_active: user.is_active
    });
    
    // Attach normalized user object to request
    req.user = {
      id: user.id,
      username: username,
      email: user.email,
      role: normalizedRole,
      is_active: user.is_active,
      // Keep reference to full model instance if needed
      _model: user
    };
    next();

  } catch (err) {
    console.error('❌ Auth error:', err.message);
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
}

/**
 * Middleware: Restrict route to admin users
 */
function adminOnly(req, res, next) {
  const role = req.user?.role ? String(req.user.role).toLowerCase() : '';
  
  console.log('🔒 adminOnly check:', { userId: req.user?.id, role });
  
  if (role !== 'admin') {
    console.log('❌ Access denied: Not an admin');
    return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
  }
  
  console.log('✅ Admin access granted');
  next();
}

/**
 * Middleware: Restrict route to admin or manager users
 */
function managerOrAdminOnly(req, res, next) {
  const role = req.user?.role ? String(req.user.role).toLowerCase() : '';
  
  // 🐛 DEBUG: Log the access check
  console.log('🔒 managerOrAdminOnly check:', {
    userId: req.user?.id,
    username: req.user?.username,
    role: role,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    hasAccess: role === 'admin' || role === 'manager'
  });
  
  if (role === 'admin' || role === 'manager') {
    console.log('✅ Manager/Admin access granted');
    return next();
  }
  
  console.log('❌ Access denied: Not a manager or admin');
  return res.status(403).json({ success: false, message: 'Access denied: Managers or admins only' });
}

module.exports = { authenticate, adminOnly, managerOrAdminOnly };