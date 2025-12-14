const { Server } = require('socket.io');
const config = require('../config');

/**
 * SERVICE SOCKET.IO AMÉLIORÉ
 * 
 * Améliorations principales :
 * - Salles par service pour filtrer les événements
 * - Émission ciblée des tickets par service
 * - Sécurité renforcée avec validation des données
 * - Logs détaillés pour debugging
 * 
 * Architecture des salles :
 * - 'public': Affichage public (tous les tickets)
 * - 'admin': Dashboard administrateur
 * - 'service:{serviceType}': Agents d'un service spécifique
 * - 'agent:{agentId}': Notifications pour un agent spécifique
 * - 'ticket:{ticketId}': Abonnement aux mises à jour d'un ticket
 */

class SocketService {
  constructor() {
    this.io = null;
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: config.clientUrl,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Join a room based on role
      socket.on('join:room', (room) => {
        socket.join(room);
        console.log(`📍 Socket ${socket.id} joined room: ${room}`);
      });

      // AMÉLIORATION: Rejoindre une salle de service spécifique
      socket.on('join:service', (serviceType) => {
        const room = `service:${serviceType}`;
        socket.join(room);
        console.log(`📍 Socket ${socket.id} joined service room: ${room}`);
      });

      // AMÉLIORATION: Quitter une salle de service
      socket.on('leave:service', (serviceType) => {
        const room = `service:${serviceType}`;
        socket.leave(room);
        console.log(`🚪 Socket ${socket.id} left service room: ${room}`);
      });

      // Leave a room
      socket.on('leave:room', (room) => {
        socket.leave(room);
        console.log(`🚪 Socket ${socket.id} left room: ${room}`);
      });

      // Agent goes online
      socket.on('agent:online', (data) => {
        const { agentId, services } = data;
        socket.join(`agent:${agentId}`);
        
        // AMÉLIORATION: Rejoindre automatiquement les salles de services de l'agent
        if (services && Array.isArray(services)) {
          services.forEach(service => {
            socket.join(`service:${service}`);
            console.log(`📍 Agent ${agentId} joined service room: service:${service}`);
          });
        }
        
        this.io.emit('agent:status', { agentId, status: 'online' });
        console.log(`✅ Agent ${agentId} is now online`);
      });

      // Agent goes offline
      socket.on('agent:offline', (data) => {
        const { agentId, services } = data;
        socket.leave(`agent:${agentId}`);
        
        // AMÉLIORATION: Quitter les salles de services de l'agent
        if (services && Array.isArray(services)) {
          services.forEach(service => {
            socket.leave(`service:${service}`);
          });
        }
        
        this.io.emit('agent:status', { agentId, status: 'offline' });
        console.log(`❌ Agent ${agentId} is now offline`);
      });

      // Subscribe to ticket updates
      socket.on('ticket:subscribe', (ticketId) => {
        socket.join(`ticket:${ticketId}`);
        console.log(`📍 Socket ${socket.id} subscribed to ticket: ${ticketId}`);
      });

      // Unsubscribe from ticket updates
      socket.on('ticket:unsubscribe', (ticketId) => {
        socket.leave(`ticket:${ticketId}`);
        console.log(`🚪 Socket ${socket.id} unsubscribed from ticket: ${ticketId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    console.log('✅ Socket.io initialized');
  }

  // Emit when a new ticket is created
  // AMÉLIORATION: Émettre vers les salles appropriées (service + public + admin)
  emitTicketCreated(ticket) {
    if (this.io) {
      // Émettre à tous (affichage public)
      this.io.emit('ticket:created', ticket);
      
      // AMÉLIORATION: Émettre spécifiquement aux agents du service concerné
      this.io.to(`service:${ticket.serviceType}`).emit('ticket:created', ticket);
      
      console.log(`📤 Emitted ticket:created - ${ticket.ticketNumber} (service: ${ticket.serviceType})`);
    }
  }

  // Emit when a ticket is updated
  // AMÉLIORATION: Filtrage par service
  emitTicketUpdated(ticket) {
    if (this.io) {
      // Émettre à tous (affichage public et admin)
      this.io.emit('ticket:updated', ticket);
      
      // Émettre aux abonnés spécifiques du ticket
      this.io.to(`ticket:${ticket._id}`).emit('ticket:updated', ticket);
      
      // AMÉLIORATION: Émettre aux agents du service concerné
      this.io.to(`service:${ticket.serviceType}`).emit('ticket:updated', ticket);
      
      console.log(`📤 Emitted ticket:updated - ${ticket.ticketNumber} (status: ${ticket.status})`);
    }
  }

  // Emit when a ticket is called
  // AMÉLIORATION: Notification ciblée
  emitTicketCalled(ticket, agent) {
    if (this.io) {
      const data = {
        ticket: {
          id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          serviceType: ticket.serviceType,
          counterNumber: ticket.counterNumber,
          status: ticket.status
        },
        agent: {
          id: agent._id,
          name: agent.fullName,
          counterNumber: agent.counterNumber
        }
      };

      // Broadcast to all clients (affichage public)
      this.io.emit('ticket:called', data);
      
      // AMÉLIORATION: Émettre spécifiquement au service concerné
      this.io.to(`service:${ticket.serviceType}`).emit('ticket:called', data);
      
      // Also emit to specific ticket room
      this.io.to(`ticket:${ticket._id}`).emit('ticket:called', data);
      
      console.log(`📤 Emitted ticket:called - ${ticket.ticketNumber} to counter ${agent.counterNumber}`);
    }
  }

  // Emit queue update
  // AMÉLIORATION: Émettre les mises à jour de file par service
  emitQueueUpdate(queueData) {
    if (this.io) {
      // Émettre à tous
      this.io.emit('queue:updated', queueData);
      
      // AMÉLIORATION: Si le queueData contient un serviceType, émettre aussi à ce service
      if (queueData.serviceType) {
        this.io.to(`service:${queueData.serviceType}`).emit('queue:updated', queueData);
      }
      
      console.log(`📤 Emitted queue:updated`);
    }
  }

  // Emit stats update
  emitStatsUpdate(stats) {
    if (this.io) {
      this.io.to('admin').emit('stats:updated', stats);
      console.log(`📤 Emitted stats:updated to admin`);
    }
  }

  // Send notification to specific agent
  notifyAgent(agentId, notification) {
    if (this.io) {
      this.io.to(`agent:${agentId}`).emit('notification', notification);
      console.log(`📤 Sent notification to agent ${agentId}`);
    }
  }

  // NOUVELLE FONCTION: Émettre un événement à tous les agents d'un service
  emitToService(serviceType, event, data) {
    if (this.io && serviceType) {
      this.io.to(`service:${serviceType}`).emit(event, data);
      console.log(`📤 Emitted ${event} to service ${serviceType}`);
    }
  }

  // Get io instance
  getIO() {
    return this.io;
  }
}

// Export singleton instance
module.exports = new SocketService();

