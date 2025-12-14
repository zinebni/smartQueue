require('dotenv').config();
const mongoose = require('mongoose');
const Agent = require('../models/Agent');
const config = require('../config');

/**
 * SEEDERS AMÉLIORÉS
 * 
 * Configuration détaillée des agents avec services spécifiques :
 * - Admin : Accès à tous les services pour la supervision complète
 * - Supervisor : Accès à tous les services avec rôle de supervision
 * - Agents spécialisés : Chaque agent a des services spécifiques assignés
 * 
 * Cette configuration permet de :
 * 1. Filtrer les tickets par service pour chaque agent
 * 2. Empêcher un agent de prendre des tickets d'autres services
 * 3. Permettre le partage de tickets entre agents du même service
 */
const seedAgents = [
  {
    username: 'admin',
    password: 'admin123',
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@smartqueue.com',
    role: 'admin',
    counterNumber: null,
    // Admin a accès à tous les services pour la gestion complète
    services: ['account', 'loan', 'general', 'registration', 'consultation', 'payment'],
    isActive: true
  },
  {
    username: 'agent1',
    password: 'agent123',
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'marie.dupont@smartqueue.com',
    role: 'agent',
    counterNumber: 1,
    // Agent spécialisé en comptes et services généraux
    services: ['account', 'general'],
    isActive: true
  },
  {
    username: 'agent2',
    password: 'agent123',
    firstName: 'Jean',
    lastName: 'Martin',
    email: 'jean.martin@smartqueue.com',
    role: 'agent',
    counterNumber: 2,
    // Agent spécialisé en prêts et consultations
    services: ['loan', 'consultation'],
    isActive: true
  },
  {
    username: 'agent3',
    password: 'agent123',
    firstName: 'Sophie',
    lastName: 'Bernard',
    email: 'sophie.bernard@smartqueue.com',
    role: 'agent',
    counterNumber: 3,
    // Agent spécialisé en inscriptions et paiements
    services: ['registration', 'payment'],
    isActive: true
  },
  {
    username: 'agent4',
    password: 'agent123',
    firstName: 'Luc',
    lastName: 'Moreau',
    email: 'luc.moreau@smartqueue.com',
    role: 'agent',
    counterNumber: 4,
    // Agent polyvalent gérant services généraux et consultations
    services: ['general', 'consultation'],
    isActive: true
  },
  {
    username: 'supervisor',
    password: 'supervisor123',
    firstName: 'Pierre',
    lastName: 'Durand',
    email: 'pierre.durand@smartqueue.com',
    role: 'supervisor',
    counterNumber: null,
    // Supervisor a accès à tous les services
    services: ['account', 'loan', 'general', 'registration', 'consultation', 'payment'],
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing agents
    await Agent.deleteMany({});
    console.log('🗑️  Cleared existing agents');

    // Create agents with validation
    for (const agentData of seedAgents) {
      try {
        const agent = new Agent(agentData);
        await agent.save();
        console.log(`✅ Created agent: ${agent.username} (${agent.role}) - Services: ${agent.services.join(', ')}`);
      } catch (error) {
        console.error(`❌ Error creating agent ${agentData.username}:`, error.message);
      }
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin: admin / admin123 (All services)');
    console.log('   Supervisor: supervisor / supervisor123 (All services)');
    console.log('   Agent 1: agent1 / agent123 (Account, General)');
    console.log('   Agent 2: agent2 / agent123 (Loan, Consultation)');
    console.log('   Agent 3: agent3 / agent123 (Registration, Payment)');
    console.log('   Agent 4: agent4 / agent123 (General, Consultation)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

