const  User  = require('../models/User');
const jwt = require('jsonwebtoken');

async function authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
  
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // Attach the user to the request
      const user = await User.findOne({ where: { id: decoded.id } });
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  
      req.user = user; 
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }

function adminOnly(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    }
}

module.exports = {authenticate, adminOnly};
