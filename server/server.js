const path = require('path');

// CORRECTION: Charger les variables d'environnement depuis le bon fichier
require('dotenv').config({
  path: path.resolve(__dirname, '.env.example'),
});

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config');
const socketService = require('./services/socket.service');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
socketService.init(server);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    server.listen(config.port, () => {
      console.log('🚀 ================================');
      console.log(`🚀 Smart Queue API Server`);
      console.log(`🚀 Environment: ${config.nodeEnv}`);
      console.log(`🚀 Port: ${config.port}`);
      console.log(`🚀 API: http://localhost:${config.port}/api`);
      console.log('🚀 ================================');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

