const Ticket = require('../models/Ticket');
const Agent = require('../models/Agent');
const socketService = require('../services/socket.service');

/**
 * CONTRÔLEUR ADMIN AMÉLIORÉ
 * 
 * Améliorations principales :
 * - Filtrage des tickets par service de l'agent
 * - Validation des permissions avant de prendre un ticket
 * - Messages d'erreur clairs et informatifs
 * - Logs détaillés pour le debugging
 * - Empêcher un agent de prendre des tickets d'autres services
 */

// Call next ticket
// AMÉLIORATION CRITIQUE: Filtrage par services de l'agent
exports.callNextTicket = async (req, res) => {
  try {
    const agentId = req.agent.id;
    const { serviceType } = req.body;

    // Get agent info
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // AMÉLIORATION: Vérifier que l'agent est actif
    if (!agent.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact an administrator.'
      });
    }

    // Check if agent is already serving a ticket
    if (agent.currentTicket) {
      return res.status(400).json({
        success: false,
        message: 'Please complete current ticket before calling next'
      });
    }

    // AMÉLIORATION: Vérifier que l'agent a des services assignés
    if (!agent.services || agent.services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No services assigned to this agent. Please contact an administrator.'
      });
    }

    // Build query for next ticket
    const query = { status: 'waiting' };
    
    // AMÉLIORATION CRITIQUE: Filtrage par services de l'agent
    if (serviceType) {
      // Vérifier que l'agent peut gérer ce service
      if (!agent.canHandleService(serviceType)) {
        return res.status(403).json({
          success: false,
          message: `You are not authorized to handle '${serviceType}' service. Your services: ${agent.services.join(', ')}`
        });
      }
      query.serviceType = serviceType;
    } else {
      // Si pas de service spécifié, chercher parmi tous les services de l'agent
      query.serviceType = { $in: agent.services };
    }

    console.log(`🔍 Agent ${agent.username} searching for tickets with query:`, query);

    // Find next ticket (highest priority, earliest created)
    const ticket = await Ticket.findOne(query)
      .sort({ priority: -1, createdAt: 1 });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `No tickets waiting in queue for your services: ${agent.services.join(', ')}`
      });
    }

    // Update ticket status
    ticket.status = 'called';
    ticket.calledAt = new Date();
    ticket.servedBy = agentId;
    ticket.counterNumber = agent.counterNumber;
    await ticket.save();

    // Update agent's current ticket
    agent.currentTicket = ticket._id;
    await agent.save();

    // Emit socket event for ticket called
    socketService.emitTicketCalled(ticket, agent);

    console.log(`✅ Ticket called: ${ticket.ticketNumber} by agent ${agent.username}`);

    res.json({
      success: true,
      message: 'Ticket called successfully',
      data: ticket
    });
  } catch (error) {
    console.error('❌ Error calling next ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error calling next ticket',
      error: error.message
    });
  }
};

// Start serving ticket
// AMÉLIORATION: Validation et messages clairs
exports.startServing = async (req, res) => {
  try {
    const agentId = req.agent.id;
    const agent = await Agent.findById(agentId).populate('currentTicket');

    if (!agent.currentTicket) {
      return res.status(400).json({
        success: false,
        message: 'No ticket to serve. Please call a ticket first.'
      });
    }

    const ticket = await Ticket.findById(agent.currentTicket._id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // AMÉLIORATION: Vérifier le statut du ticket
    if (ticket.status !== 'called') {
      return res.status(400).json({
        success: false,
        message: `Cannot start serving. Ticket status is '${ticket.status}'. Expected 'called'.`
      });
    }

    ticket.status = 'serving';
    ticket.servedAt = new Date();
    await ticket.save();

    socketService.emitTicketUpdated(ticket);

    console.log(`✅ Started serving ticket: ${ticket.ticketNumber} by agent ${agent.username}`);

    res.json({
      success: true,
      message: 'Started serving ticket',
      data: ticket
    });
  } catch (error) {
    console.error('❌ Error starting service:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting service',
      error: error.message
    });
  }
};

// Complete ticket
// AMÉLIORATION: Validation et calcul correct des statistiques
exports.completeTicket = async (req, res) => {
  try {
    const agentId = req.agent.id;
    const { notes } = req.body;

    const agent = await Agent.findById(agentId);
    if (!agent.currentTicket) {
      return res.status(400).json({
        success: false,
        message: 'No ticket to complete. Please call a ticket first.'
      });
    }

    const ticket = await Ticket.findById(agent.currentTicket);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // AMÉLIORATION: Vérifier que le ticket est en cours de service
    if (ticket.status !== 'serving' && ticket.status !== 'called') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete ticket. Current status: '${ticket.status}'. Expected 'serving' or 'called'.`
      });
    }

    ticket.status = 'completed';
    ticket.completedAt = new Date();
    if (notes) {
      ticket.notes = ticket.notes ? `${ticket.notes}\n${notes}` : notes;
    }
    await ticket.save();

    // Update agent stats
    agent.currentTicket = null;
    agent.ticketsServedToday += 1;
    
    // AMÉLIORATION: Calcul correct du temps de service moyen
    const serviceDuration = ticket.serviceDuration || 0;
    const totalTickets = agent.ticketsServedToday;
    if (serviceDuration > 0) {
      agent.averageServiceTime = Math.round(
        ((agent.averageServiceTime * (totalTickets - 1)) + serviceDuration) / totalTickets
      );
    }
    await agent.save();

    socketService.emitTicketUpdated(ticket);

    console.log(`✅ Ticket completed: ${ticket.ticketNumber} by agent ${agent.username}`);

    res.json({
      success: true,
      message: 'Ticket completed successfully',
      data: ticket
    });
  } catch (error) {
    console.error('❌ Error completing ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing ticket',
      error: error.message
    });
  }
};

// Mark ticket as no-show
exports.markNoShow = async (req, res) => {
  try {
    const agentId = req.agent.id;
    const agent = await Agent.findById(agentId);

    if (!agent.currentTicket) {
      return res.status(400).json({ success: false, message: 'No ticket assigned' });
    }

    const ticket = await Ticket.findById(agent.currentTicket);
    ticket.status = 'no-show';
    ticket.completedAt = new Date();
    await ticket.save();

    agent.currentTicket = null;
    await agent.save();

    socketService.emitTicketUpdated(ticket);

    res.json({ success: true, message: 'Ticket marked as no-show', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

// Get all agents
exports.getAgents = async (req, res) => {
  try {
    const agents = await Agent.find({ isActive: true })
      .select('-password')
      .populate('currentTicket');

    res.json({ success: true, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching agents', error: error.message });
  }
};

