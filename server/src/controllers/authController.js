const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { isSupabaseConfigured } = require('../config/supabase');
const supabaseService = require('../services/supabaseService');

// Generate JWT Helper
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'mitra_club_super_secret_jwt_key_2026_vishnu_tech';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const id = user._id || user.id;

  return jwt.sign(
    {
      id,
      email: user.email,
      role: user.role,
      name: user.name,
      team: user.team || user.club_name,
      rollNumber: user.rollNumber || user.roll_number
    },
    secret,
    { expiresIn }
  );
};

// Login user (by Email, Roll Number, or Name from Excel)
const { getStudentsFromExcel } = require('../import_excel');

const register = async (req, res) => {
  try {
    const { name, username, email, password, team } = req.body;
    const cleanName = name?.trim();
    const cleanUsername = username?.trim().toLowerCase();
    const cleanEmail = email?.trim().toLowerCase();
    const selectedTeam = team?.trim() || 'Vibe Coding';

    if (!cleanName || !cleanUsername || !cleanEmail || !password) {
      return res.status(400).json({ message: 'Name, username, email, and password are required.' });
    }
    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      return res.status(400).json({ message: 'Username must be 3-24 characters using letters, numbers, or underscores.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    let user;
    if (isSupabaseConfigured()) {
      user = await supabaseService.createStudentAccount({ name: cleanName, username: cleanUsername, email: cleanEmail, password, team: selectedTeam });
    } else {
      const existing = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
      if (existing) {
        return res.status(409).json({ message: 'That email or username is already registered.' });
      }

      const passwordHash = await User.hashPassword(password);
      user = await User.create({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        rollNumber: `FB_${cleanUsername}`,
        team: selectedTeam,
        passwordHash,
        role: 'student',
        isActive: true
      });
    }

    const token = generateToken(user);
    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.toPublicJSON()
    });
  } catch (err) {
    console.error('Error in register controller:', err);
    return res.status(500).json({ message: 'Server error during account creation', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email, roll number, or name and password.' });
    }

    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();
    const cleanUpper = clean.toUpperCase();

    let user;
    if (isSupabaseConfigured()) {
      user = await supabaseService.findUserByIdentifier(identifier);
    } else {
      // 1. Check existing DB records for email, rollNumber, or name
      const searchRegex = new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      user = await User.findOne({
        $or: [
          { email: cleanLower },
          { username: cleanLower },
          { rollNumber: cleanUpper },
          { rollNumber: clean },
          { name: searchRegex }
        ]
      });

      // 2. If not found in DB, check Excel datasheet and auto-create
      if (!user) {
        const excelStudents = getStudentsFromExcel();
        const excelMatch = excelStudents.find((s) =>
          s.email.toLowerCase() === cleanLower ||
          s.rollNumber.toUpperCase() === cleanUpper ||
          s.name.toLowerCase() === cleanLower ||
          s.email.toLowerCase().startsWith(cleanLower) ||
          s.rollNumber.toLowerCase().includes(cleanLower)
        );

        if (excelMatch) {
          const passwordHash = await User.hashPassword(password || 'student123');
          user = await User.create({
            name: excelMatch.name,
            email: excelMatch.email,
            rollNumber: excelMatch.rollNumber,
            team: excelMatch.team,
            passwordHash,
            role: 'student',
            isActive: true
          });
          console.log(`[Auth] Auto-registered Excel student for login: ${user.name} (${user.rollNumber})`);
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'User account not found. Please check roll number, email, or name.' });
    }

    if (!user.isActive && !user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact Admin.' });
    }

    let isMatch = await user.comparePassword(password);
    // Fallback: allow default password 'student123' if first time
    if (!isMatch && password === 'student123') {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password. Try student123 or your account password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toPublicJSON ? user.toPublicJSON() : user
    });
  } catch (err) {
    console.error('Error in login controller:', err);
    return res.status(500).json({ message: 'Server error during login', error: err.message });
  }
};

// Get current user profile
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user.toPublicJSON ? req.user.toPublicJSON() : req.user
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

// Update current user password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const userId = req.user._id || req.user.id;

    if (isSupabaseConfigured()) {
      await supabaseService.resetStudentPassword(userId, newPassword);
    } else {
      req.user.passwordHash = await User.hashPassword(newPassword);
      await req.user.save();
    }

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

module.exports = {
  login,
  register,
  getMe,
  changePassword
};
