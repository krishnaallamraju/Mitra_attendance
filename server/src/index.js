require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { isSupabaseConfigured, testSupabaseConnection } = require('./config/supabase');
const { User } = require('./models/User');
const { getStudentsFromExcel } = require('./import_excel');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const attendanceRoutes = require('./routes/attendance.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log incoming requests in dev mode
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Base Health Check Route
app.get('/api/health', async (req, res) => {
  let supabaseStatus = { configured: isSupabaseConfigured() };
  if (supabaseStatus.configured) {
    supabaseStatus = await testSupabaseConnection();
  }

  res.status(200).json({
    status: 'ok',
    system: 'MITRA Club Attendance Management System API',
    databaseEngine: isSupabaseConfigured() ? 'Supabase PostgreSQL' : 'MongoDB (Local / Memory Fallback)',
    supabase: supabaseStatus,
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// Initialize the configured database and local seed data once per process.
const initializeDatabase = async () => {
  if (process.env.VERCEL && !isSupabaseConfigured()) {
    throw new Error('Supabase must be configured when running the API on Vercel.');
  }

  if (isSupabaseConfigured()) {
      console.log('[Server] Connecting to Supabase PostgreSQL...');
      const connection = await testSupabaseConnection();
      if (connection.connected) {
        console.log('[Server] Supabase PostgreSQL connected successfully.');
      } else {
        console.warn('[Server] Supabase ping returned:', connection.error || 'Check table schema');
      }
  } else {
      console.log('[Server] Initializing local database fallback...');
      await connectDB();

      // Ensure Admin and Excel dataset students exist
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        const adminPasswordHash = await User.hashPassword('admin123');
        await User.create({
          name: 'MITRA Super Admin',
          email: 'admin@mitra.edu',
          passwordHash: adminPasswordHash,
          role: 'admin',
          isActive: true
        });
        console.log('[Server] Created Super Admin account (admin@mitra.edu)');
      }

      const studentsFromExcel = getStudentsFromExcel();
      const studentPasswordHash = await User.hashPassword('student123');
      let createdCount = 0;

      for (const st of studentsFromExcel) {
        const exists = await User.findOne({
          $or: [{ email: st.email.toLowerCase() }, { rollNumber: st.rollNumber }]
        });
        if (!exists) {
          await User.create({
            name: st.name,
            email: st.email,
            rollNumber: st.rollNumber,
            team: st.team,
            passwordHash: studentPasswordHash,
            role: 'student',
            isActive: true
          });
          createdCount++;
        }
      }
      console.log(`[Server] Synced Excel dataset: ${studentsFromExcel.length} students loaded (${createdCount} newly inserted).`);
  }
};

// Start a normal HTTP server for local development.
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  MITRA Attendance Backend Server Running`);
      console.log(`  Local URL: http://localhost:${PORT}`);
      console.log(`  Database Engine: ${isSupabaseConfigured() ? 'Supabase PostgreSQL' : 'Local Persistent Engine'}`);
      console.log(`  API Status: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, initializeDatabase };
