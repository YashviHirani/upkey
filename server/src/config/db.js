const dns = require('dns');
const mongoose = require('mongoose');

// Configure public DNS resolvers (Google & Cloudflare) to ensure reliable
// SRV resolution for MongoDB Atlas across diverse network/ISP environments.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Gracefully continue with system default DNS if custom server setting is restricted
}

/**
 * MongoDB Atlas Connection Configuration
 * 
 * Best Practices Implemented:
 * 1. Connection Pooling: Keeps a pool of open sockets (minPoolSize / maxPoolSize)
 *    to eliminate handshake latency on API requests and prevent connection spikes.
 * 2. Fast Failover / Timeout: Sets serverSelectionTimeoutMS to 5000ms so that
 *    connection failures or DNS issues report immediately rather than hanging for 30s.
 * 3. Connection Event Monitoring: Listens for connected, error, and disconnected events
 *    for observability and production stability.
 * 4. Clear Diagnostic Guidance: Provides clear troubleshooting steps for DNS (querySrv),
 *    authentication failures, and IP whitelist issues.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  // 1. Verify MONGODB_URI presence
  if (!uri || !uri.trim()) {
    throw new Error(
      '\n' +
      '======================================================================\n' +
      '❌ MONGODB_URI is missing!\n\n' +
      '👉 HOW TO FIX:\n' +
      '1. Open your server/.env (or root .env) file.\n' +
      '2. Add your MongoDB Atlas connection string:\n' +
      '   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.<hash>.mongodb.net/<database_name>?retryWrites=true&w=majority\n' +
      '======================================================================\n'
    );
  }

  // 2. Check for leftover placeholder values in URI
  if (uri.includes('<username>') || uri.includes('<password>') || uri.includes('<database>')) {
    throw new Error(
      '\n' +
      '======================================================================\n' +
      '❌ MONGODB_URI contains unconfigured placeholders (<username>, <password>, etc.)!\n\n' +
      '👉 HOW TO FIX:\n' +
      '1. Open server/.env (or root .env).\n' +
      '2. Replace placeholder tokens with your real credentials from MongoDB Atlas.\n' +
      '======================================================================\n'
    );
  }

  // 3. Performance & Connection Pooling Options
  // In modern Mongoose (v8 / v9+), deprecated options like useNewUrlParser and
  // useUnifiedTopology are enabled by default and must NOT be passed.
  const mongooseOptions = {
    // maxPoolSize: Maximum number of concurrent connections in the socket pool.
    // 10 is optimal for typical Express apps to prevent exceeding Atlas tier limits.
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,

    // minPoolSize: Pre-warms socket connections so initial API calls don't incur
    // connection handshake and TLS latency overhead.
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE) || 2,

    // serverSelectionTimeoutMS: How long (in ms) the driver attempts to find an active server
    // before throwing an error. Set to 5000ms for fast feedback during startup.
    serverSelectionTimeoutMS: 5000,

    // socketTimeoutMS: Maximum time an idle socket connection stays open before being cleaned up.
    socketTimeoutMS: 45000,

    // Optional database name override if not specified inside the URI path
    ...(process.env.MONGODB_DB_NAME ? { dbName: process.env.MONGODB_DB_NAME } : {})
  };

  // 4. Attach lifecycle listeners for monitoring and debugging
  mongoose.connection.on('connected', () => {
    console.log(`📡 Mongoose connected to database: ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('🚨 Mongoose connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Mongoose disconnected from database');
  });

  // 5. Connect to MongoDB Atlas
  try {
    await mongoose.connect(uri, mongooseOptions);
    console.log(`✅ MongoDB Atlas connected successfully! (Database: ${mongoose.connection.name})`);
  } catch (err) {
    let extraHelp = '';

    // DNS SRV resolution issue (e.g., cluster still provisioning, typo in URL, or ISP DNS block)
    if (err.message && err.message.includes('querySrv ENOTFOUND')) {
      extraHelp =
        '\n💡 Tip: DNS lookup failed for your cluster URL (querySrv ENOTFOUND).\n' +
        '  • If you just created this cluster in MongoDB Atlas, please wait 2-5 minutes for DNS provisioning to complete.\n' +
        '  • Double-check the cluster address for any typos (e.g. cluster0.c1y5osg.mongodb.net).\n' +
        '  • If your ISP/router blocks SRV lookups, test switching DNS to 8.8.8.8 or use the non-SRV standard connection string from Atlas.';
    }
    // Authentication failure
    else if (err.message && (err.message.includes('bad auth') || err.message.includes('Authentication failed'))) {
      extraHelp =
        '\n💡 Tip: Authentication failed.\n' +
        '  • Verify your database username and password in MongoDB Atlas -> Database Access.\n' +
        '  • If your password contains special characters, ensure they are URL-encoded.';
    }
    // IP Whitelist / Network Access issue
    else if (err.name === 'MongooseServerSelectionError') {
      extraHelp =
        '\n💡 Tip: Connection timed out reaching MongoDB Atlas.\n' +
        '  • Verify your IP address is whitelisted in MongoDB Atlas -> Security -> Network Access.\n' +
        '  • For development, adding 0.0.0.0/0 allows access from anywhere.';
    }

    throw new Error(
      '\n' +
      '======================================================================\n' +
      `❌ Failed to connect to MongoDB Atlas: ${err.message}${extraHelp}\n\n` +
      '👉 Checklist:\n' +
      '  1. Verify database username & password in MONGODB_URI.\n' +
      '  2. Check cluster provisioning status in MongoDB Atlas dashboard.\n' +
      '  3. Check MongoDB Atlas -> Network Access (IP Whitelist / 0.0.0.0/0).\n' +
      '======================================================================\n',
      { cause: err }
    );
  }
}

module.exports = connectDB;
