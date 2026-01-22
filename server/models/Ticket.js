/**
 * Modèle de données Ticket
 * Représente un ticket dans la file d'attente
 * @module TicketModel
 * @author Smart Queue Team
 * @version 1.0.0
 */
const mongoose = require('mongoose');

/**
 * Schéma du ticket
 * @typedef {Object} TicketSchema
 */
const ticketSchema = new mongoose.Schema({
  // Ticket number (auto-generated, e.g., A001, B002)
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Service type (e.g., 'account', 'loan', 'general', 'registration')
  serviceType: {
    type: String,
    required: true,
    enum: ['account', 'loan', 'general', 'registration', 'consultation', 'payment'],
    default: 'general'
  },
  
  // Ticket status
  status: {
    type: String,
    enum: ['waiting', 'called', 'serving', 'completed', 'cancelled', 'no-show'],
    default: 'waiting'
  },
  
  // Priority (higher number = higher priority)
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  
  // Customer information (optional)
  customerName: {
    type: String,
    trim: true,
    default: ''
  },
  
  customerPhone: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Counter/desk number where ticket is being served
  counterNumber: {
    type: Number,
    default: null
  },
  
  // Agent serving this ticket
  servedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  calledAt: {
    type: Date,
    default: null
  },
  
  servedAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  // Estimated wait time in minutes
  estimatedWaitTime: {
    type: Number,
    default: 0
  },
  
  // Notes
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for wait duration
ticketSchema.virtual('waitDuration').get(function() {
  if (this.calledAt && this.createdAt) {
    return Math.round((this.calledAt - this.createdAt) / 1000 / 60);
  }
  if (this.status === 'waiting') {
    return Math.round((Date.now() - this.createdAt) / 1000 / 60);
  }
  return 0;
});

// Virtual for service duration
ticketSchema.virtual('serviceDuration').get(function() {
  if (this.completedAt && this.servedAt) {
    return Math.round((this.completedAt - this.servedAt) / 1000 / 60);
  }
  return 0;
});

// Index for faster queries
ticketSchema.index({ status: 1, createdAt: 1 });
ticketSchema.index({ serviceType: 1, status: 1 });
ticketSchema.index({ ticketNumber: 1 });

// Static method to generate ticket number
ticketSchema.statics.generateTicketNumber = async function(serviceType) {
  const prefixes = {
    account: 'A',
    loan: 'L',
    general: 'G',
    registration: 'R',
    consultation: 'C',
    payment: 'P'
  };
  
  const prefix = prefixes[serviceType] || 'G';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find the last ticket of this type created today to get the highest number
  const lastTicket = await this.findOne({
    serviceType,
    createdAt: { $gte: today }
  }).sort({ ticketNumber: -1 });
  
  let nextNumber = 1;
  
  if (lastTicket && lastTicket.ticketNumber) {
    // Extract the number from the ticket (e.g., "G005" -> 5)
    const currentNumber = parseInt(lastTicket.ticketNumber.substring(1), 10);
    if (!isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }
  
  const number = String(nextNumber).padStart(3, '0');
  return `${prefix}${number}`;
};

module.exports = mongoose.model('Ticket', ticketSchema);

