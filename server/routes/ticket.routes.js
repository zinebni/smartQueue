/**
 * Routes pour la gestion des tickets
 * Définit tous les endpoints API pour les opérations sur les tickets
 * @module TicketRoutes
 */
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

/**
 * Routes publiques (accessibles sans authentification)
 */

/**
 * Création d'un nouveau ticket
 * @route POST /api/tickets
 * @access Public - Accessible depuis les kiosques/clients
 */
router.post('/', ticketController.createTicket);

/**
 * Routes protégées (nécessitent authentification)
 */

/**
 * Récupération de la liste des tickets
 * @route GET /api/tickets
 * @access Protégé - Filtrage automatique par service de l'agent
 */
router.get('/', protect, ticketController.getTickets);

/**
 * Récupération d'un ticket par son ID
 * @route GET /api/tickets/:id
 * @access Protégé - Vérification des permissions
 */
router.get('/:id', protect, ticketController.getTicketById);

/**
 * Récupération d'un ticket par son numéro
 * @route GET /api/tickets/number/:ticketNumber
 * @access Public - Pour que les clients vérifient leur statut
 */
router.get('/number/:ticketNumber', ticketController.getTicketByNumber);

/**
 * Enregistrement de l'arrivée d'un client (check-in)
 * @route POST /api/tickets/:id/checkin
 * @access Public - Pour kiosques d'enregistrement
 */
router.post('/:id/checkin', ticketController.checkinTicket);

/**
 * Annulation d'un ticket
 * @route POST /api/tickets/:id/cancel
 * @access Protégé - Agents uniquement
 */
router.post('/:id/cancel', protect, ticketController.cancelTicket);

module.exports = router;

