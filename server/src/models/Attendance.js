const mongoose = require('mongoose');
const { TEAMS } = require('./User');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required']
    },
    team: {
      type: String,
      enum: TEAMS,
      required: [true, 'Team is required']
    },
    // Normalized YYYY-MM-DD string for strict date-based indexing and zero timezone ambiguity
    dateStr: {
      type: String,
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD']
    },
    // Standard Date object for range queries (weekly/monthly aggregation)
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Leave'],
      required: [true, 'Attendance status is required']
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Enforce unique attendance record per student per date
attendanceSchema.index({ student: 1, dateStr: 1 }, { unique: true });

// Optimize team + date queries
attendanceSchema.index({ team: 1, dateStr: 1 });
attendanceSchema.index({ student: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
