const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TEAMS = ['Vibe Coding', 'AI Team', 'Industry Connect', 'Marketing'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    },
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true, // allows null/undefined for admins while ensuring uniqueness for students
      required: function () {
        return this.role === 'student';
      }
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      enum: ['admin', 'student'],
      default: 'student'
    },
    team: {
      type: String,
      enum: TEAMS,
      required: function () {
        return this.role === 'student';
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash passwords
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// JSON representation without sensitive fields
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = { User, TEAMS };
