const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

// Public routes
// POST /api/tickets - Create a new ticket (public - pour kiosques/clients)
router.post('/', ticketController.createTicket);

// CORRECTION: Ajouter protection pour filtrer par services de l'agent
// GET /api/tickets - Get tickets (PROTÉGÉ - filtrage par service automatique)
router.get('/', protect, ticketController.getTickets);

// GET /api/tickets/:id - Get single ticket by ID (PROTÉGÉ - vérification permissions)
router.get('/:id', protect, ticketController.getTicketById);

// GET /api/tickets/number/:ticketNumber - Get ticket by ticket number (PUBLIC - pour clients)
router.get('/number/:ticketNumber', ticketController.getTicketByNumber);

// POST /api/tickets/:id/checkin - Check-in ticket (PUBLIC - pour kiosques)
router.post('/:id/checkin', ticketController.checkinTicket);

// POST /api/tickets/:id/cancel - Cancel ticket (PROTÉGÉ - agents seulement)
router.post('/:id/cancel', protect, ticketController.cancelTicket);

module.exports = router;

