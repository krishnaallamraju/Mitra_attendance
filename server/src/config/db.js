const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mitra_attendance';
  
  try {
    // Attempt standard MongoDB connection with 3s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected successfully to standard instance: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[MongoDB] Standard connection failed (${err.message}). Initializing MongoMemoryServer fallback...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      
      await mongoose.connect(memUri);
      console.log(`[MongoDB] Connected successfully to In-Memory Database: ${memUri}`);
    } catch (memErr) {
      console.error('[MongoDB] Failed to start In-Memory database fallback:', memErr.message);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
