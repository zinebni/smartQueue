/**
 * Point d'entrée du serveur Smart Queue
 * Configure et démarre le serveur HTTP avec Socket.IO
 * Gère la connexion à MongoDB et l'initialisation des services
 * @module Server
 */
const path = require('path');

/**
 * Chargement des variables d'environnement
 * Utilise .env pour la configuration (fallback vers .env.example pour dev)
 */
require('dotenv').config({
  path: path.resolve(__dirname, '.env'),
});

// Dépendances principales
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config');
const socketService = require('./services/socket.service');

/**
 * Création du serveur HTTP
 * Enveloppe l'application Express pour supporter Socket.IO
 */
const server = http.createServer(app);

/**
 * Initialisation de Socket.IO
 * Configure la communication temps réel pour les mises à jour de tickets
 */
socketService.init(server);

/**
 * Démarrage du serveur
 * 1. Connexion à MongoDB
 * 2. Démarrage du serveur HTTP
 * 3. Affichage des informations de démarrage
 */
const startServer = async () => {
  try {
    // Étape 1: Connexion à la base de données
    await connectDB();

    // Étape 2: Démarrage du serveur sur le port configuré
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

