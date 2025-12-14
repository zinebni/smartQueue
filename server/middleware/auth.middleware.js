const jwt = require('jsonwebtoken');
const Agent = require('../models/Agent');
const config = require('../config');

/**
 * MIDDLEWARE D'AUTHENTIFICATION AMÉLIORÉ
 * 
 * Améliorations de sécurité :
 * - Validation stricte des tokens JWT
 * - Vérification de l'état actif de l'agent
 * - Messages d'erreur détaillés mais sécurisés
 * - Logs pour le debugging
 */

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // AMÉLIORATION: Vérification plus stricte du token
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // AMÉLIORATION: Vérifier la structure du token décodé
      if (!decoded.id) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }

      // Get agent from token
      const agent = await Agent.findById(decoded.id).select('+password');

      if (!agent) {
        return res.status(401).json({
          success: false,
          message: 'Agent not found. Token may be invalid.'
        });
      }

      // AMÉLIORATION: Vérifier que l'agent est actif
      if (!agent.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact an administrator.'
        });
      }

      // Ajouter l'agent à la requête pour utilisation dans les controllers
      req.agent = agent;
      next();
    } catch (err) {
      // AMÉLIORATION: Messages d'erreur plus détaillés selon le type d'erreur
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token is invalid. Please login again.'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }
    }
  } catch (error) {
    console.error('❌ Authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message
    });
  }
};

// Authorize by role
// AMÉLIORATION: Messages d'erreur plus explicites
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.agent) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.agent.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.agent.role}`
      });
    }
    next();
  };
};

// NOUVELLE FONCTION: Vérifier si l'agent peut gérer un service spécifique
// Utilisé pour valider les permissions sur les endpoints de tickets
exports.authorizeService = (req, res, next) => {
  try {
    const { serviceType } = req.body || req.query || req.params;

    // Admin et supervisor peuvent gérer tous les services
    if (req.agent.role === 'admin' || req.agent.role === 'supervisor') {
      return next();
    }

    // Pour les agents, vérifier qu'ils peuvent gérer le service
    if (serviceType && req.agent.role === 'agent') {
      if (!req.agent.canHandleService(serviceType)) {
        return res.status(403).json({
          success: false,
          message: `You are not authorized to handle '${serviceType}' service. Your services: ${req.agent.services.join(', ')}`
        });
      }
    }

    next();
  } catch (error) {
    console.error('❌ Service authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message
    });
  }
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const agent = await Agent.findById(decoded.id);
        if (agent && agent.isActive) {
          req.agent = agent;
        }
      } catch (err) {
        // Token invalid, continue without auth
      }
    }

    next();
  } catch (error) {
    next();
  }
};

