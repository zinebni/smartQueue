/**
 * Configuration principale de l'application Express
 * Définit les middlewares, routes et configuration CORS
 * @module App
 */
const express = require('express');
const cors = require('cors');
const config = require('./config');

// Import des routes
const ticketRoutes = require('./routes/ticket.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const statsRoutes = require('./routes/stats.routes');

// Initialisation de l'application Express
const app = express();

/**
 * Configuration CORS (Cross-Origin Resource Sharing)
 * Permet les requêtes depuis plusieurs origines (frontend)
 * Support de plusieurs domaines configurés via clientUrl
 */
const allowedOrigins = config.clientUrl.split(',').map(url => url.trim());
app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origine (apps mobiles, curl, etc.)
    if (!origin) return callback(null, true);

    // Vérifier si l'origine est dans la liste autorisée
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Autoriser les cookies et credentials
}));

/**
 * Middlewares globaux
 */
// Parser pour JSON et URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Middleware de logging des requêtes
 * Enregistre chaque requête avec timestamp, méthode et chemin
 */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Endpoint de vérification de santé (health check)
 * Utilisé pour monitoring et Docker healthcheck
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Smart Queue API'
  });
});

/**
 * Routes de l'API
 */
app.use('/api/tickets', ticketRoutes);   // Gestion des tickets
app.use('/api/auth', authRoutes);         // Authentification
app.use('/api/admin', adminRoutes);       // Administration
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

module.exports = app;

