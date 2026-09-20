// ==============================================================================
// Server Entry Point
// ==============================================================================

const path = require('path');

// 1. Load environment variables from .env
// We attempt loading from current working directory first, and then fallback to
// the server directory so running either from project root or server/ works seamlessly.
require('dotenv').config({ quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

// Server listening port (default: 5000)
const PORT = process.env.PORT || 5000;

// 2. Connect to MongoDB Atlas first, then start listening for HTTP requests.
// Ensuring the database is connected before accepting traffic prevents cold-start
// requests from failing due to an unready database state.
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // 3. Graceful shutdown handler
    // Ensures in-flight HTTP requests complete and MongoDB connections close cleanly.
    const handleShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log('🔒 Closed HTTP server.');
        try {
          await mongoose.connection.close(false);
          console.log('📦 Closed MongoDB connection.');
          process.exit(0);
        } catch (closeErr) {
          console.error('Error closing MongoDB connection:', closeErr);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
