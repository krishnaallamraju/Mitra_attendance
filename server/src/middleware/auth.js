const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { isSupabaseConfigured } = require('../config/supabase');
const supabaseService = require('../services/supabaseService');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'mitra_club_super_secret_jwt_key_2026_vishnu_tech';

    const decoded = jwt.verify(token, secret);

    let user;
    if (isSupabaseConfigured()) {
      user = await supabaseService.getUserById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ message: 'User associated with token no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact Admin.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid or corrupted authorization token.' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires one of roles: [${roles.join(', ')}]` });
    }
    next();
  };
};

const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const requestedStudentId = req.params.studentId || req.query.studentId;

  if (req.user.role === 'admin') {
    return next();
  }

  const userIdStr = (req.user._id || req.user.id).toString();
  if (userIdStr === requestedStudentId) {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden. You can only access your own attendance records.' });
};

module.exports = {
  verifyToken,
  requireRole,
  requireSelfOrAdmin
};
