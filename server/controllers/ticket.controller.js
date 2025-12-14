const Ticket = require('../models/Ticket');
const socketService = require('../services/socket.service');

/**
 * CONTRÔLEUR DE TICKETS AMÉLIORÉ
 * 
 * Améliorations de sécurité et validation :
 * - Validation complète des inputs
 * - Messages d'erreur clairs et informatifs
 * - Gestion robuste des erreurs
 * - Logs détaillés pour le debugging
 */

// Create a new ticket
exports.createTicket = async (req, res) => {
  try {
    const { serviceType, customerName, customerPhone, priority } = req.body;

    // AMÉLIORATION: Validation des inputs
    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Service type is required'
      });
    }

    // Vérifier que le service type est valide
    const validServices = ['account', 'loan', 'general', 'registration', 'consultation', 'payment'];
    if (!validServices.includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid service type. Must be one of: ${validServices.join(', ')}`
      });
    }

    // Validation optionnelle du téléphone
    if (customerPhone && !/^[\d\s\-+()]+$/.test(customerPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Generate ticket number
    const ticketNumber = await Ticket.generateTicketNumber(serviceType);

    // Calculate estimated wait time
    const waitingCount = await Ticket.countDocuments({ 
      status: 'waiting',
      serviceType: serviceType
    });
    const estimatedWaitTime = waitingCount * 5; // 5 minutes per ticket

    const ticket = new Ticket({
      ticketNumber,
      serviceType,
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      priority: priority || 0,
      estimatedWaitTime
    });

    await ticket.save();

    // AMÉLIORATION: Émettre l'événement avec le service type pour le filtrage
    socketService.emitTicketCreated(ticket);

    console.log(`✅ Ticket created: ${ticketNumber} for service: ${serviceType}`);

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  } catch (error) {
    console.error('❌ Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ticket',
      error: error.message
    });
  }
};

// Get tickets by status
// AMÉLIORATION: Filtrage par service pour les agents
exports.getTickets = async (req, res) => {
  try {
    const { status, serviceType, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;

    // AMÉLIORATION DE SÉCURITÉ: Si l'utilisateur est un agent (pas admin/supervisor),
    // filtrer les tickets uniquement pour ses services
    if (req.agent) {
      if (req.agent.role === 'agent') {
        // Agent ne peut voir que les tickets de ses services
        if (!filter.serviceType) {
          filter.serviceType = { $in: req.agent.services };
        } else {
          // Vérifier que le service demandé est dans ses services autorisés
          if (!req.agent.services.includes(filter.serviceType)) {
            return res.status(403).json({
              success: false,
              message: 'You are not authorized to view tickets for this service'
            });
          }
        }
      }
      // Admin et supervisor peuvent voir tous les tickets
    }

    const tickets = await Ticket.find(filter)
      .populate('servedBy', 'firstName lastName counterNumber')
      .sort({ priority: -1, createdAt: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    console.error('❌ Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message
    });
  }
};

// Get single ticket
// AMÉLIORATION: Vérification des permissions
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('servedBy', 'firstName lastName counterNumber');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // AMÉLIORATION DE SÉCURITÉ: Vérifier que l'agent a accès à ce service
    if (req.agent && req.agent.role === 'agent') {
      if (!req.agent.services.includes(ticket.serviceType)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this ticket'
        });
      }
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('❌ Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message
    });
  }
};

// Get ticket by ticket number
exports.getTicketByNumber = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketNumber: req.params.ticketNumber })
      .populate('servedBy', 'firstName lastName counterNumber');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Get position in queue
    const position = await Ticket.countDocuments({
      status: 'waiting',
      serviceType: ticket.serviceType,
      createdAt: { $lt: ticket.createdAt }
    }) + 1;

    res.json({
      success: true,
      data: { ...ticket.toJSON(), queuePosition: position }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message
    });
  }
};

// Check-in ticket (mark as arrived)
// AMÉLIORATION: Validation et messages d'erreur clairs
exports.checkinTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: `Cannot check-in ticket. Current status: ${ticket.status}. Only waiting tickets can be checked in.`
      });
    }

    // Update notes to indicate check-in
    ticket.notes = `Checked in at ${new Date().toLocaleString('fr-FR')}`;
    await ticket.save();

    socketService.emitTicketUpdated(ticket);

    res.json({
      success: true,
      message: 'Ticket checked in successfully',
      data: ticket
    });
  } catch (error) {
    console.error('❌ Error checking in ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking in ticket',
      error: error.message
    });
  }
};

// Cancel ticket
// AMÉLIORATION: Validation et logs
exports.cancelTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // AMÉLIORATION: Empêcher l'annulation de tickets déjà complétés
    if (ticket.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed ticket'
      });
    }

    // AMÉLIORATION: Empêcher l'annulation de tickets déjà annulés
    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is already cancelled'
      });
    }

    const previousStatus = ticket.status;
    ticket.status = 'cancelled';
    ticket.notes = `${ticket.notes ? ticket.notes + '\n' : ''}Cancelled at ${new Date().toLocaleString('fr-FR')}. Previous status: ${previousStatus}`;
    await ticket.save();

    socketService.emitTicketUpdated(ticket);

    console.log(`✅ Ticket cancelled: ${ticket.ticketNumber}`);

    res.json({ 
      success: true, 
      message: 'Ticket cancelled successfully', 
      data: ticket 
    });
  } catch (error) {
    console.error('❌ Error cancelling ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error cancelling ticket', 
      error: error.message 
    });
  }
};

