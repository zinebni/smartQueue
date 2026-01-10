import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { QueueStatus } from '../../models/stats.model';
import { SocketService } from '../../services/socket.service';
import { StatsService } from '../../services/stats.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-page">
      <section class="hero">
        <div class="hero-content">
          <h1>Bienvenue chez Smart Queue</h1>
          <p>Système de gestion intelligente des files d'attente pour un service optimal</p>
          <div class="hero-actions">
            <a routerLink="/create-ticket" class="btn btn-primary btn-lg">
              <span class="material-icons">add_circle</span>
              Prendre un Ticket
            </a>
            <a routerLink="/ticket-status" class="btn btn-outline btn-lg">
              <span class="material-icons">search</span>
              Suivre mon Ticket
            </a>
          </div>
        </div>
      </section>

      <section class="queue-display card">
        <h2>
          <span class="material-icons">campaign</span>
          En cours de service
        </h2>
        
        @if (queueStatus?.nowServing?.length) {
          <div class="serving-list">
            @for (item of queueStatus!.nowServing!; track item._id) {
              <div class="serving-item">
                <div class="ticket-number">{{ item.ticketNumber }}</div>
                <div class="counter">
                  <span class="material-icons">meeting_room</span>
                  Guichet {{ item.counterNumber || '-' }}
                </div>
              </div>
            }
          </div>
        } @else {
          <p class="no-data">Aucun ticket en cours de service</p>
        }
      </section>

      <section class="waiting-display card">
        <h2>
          <span class="material-icons">schedule</span>
          Prochains en attente
        </h2>
        
        @if (queueStatus?.nextInQueue?.length) {
          <div class="waiting-list">
            @for (ticket of queueStatus!.nextInQueue!.slice(0, 5); track ticket._id; let i = $index) {
              <div class="waiting-item">
                <span class="position">{{ i + 1 }}</span>
                <span class="ticket">{{ ticket.ticketNumber }}</span>
                <span class="service badge badge-{{ ticket.serviceType }}">{{ ticket.serviceType }}</span>
              </div>
            }
          </div>
        } @else {
          <p class="no-data">Aucun ticket en attente</p>
        }
      </section>

      <section class="features">
        <h2>Nos Services</h2>
        <div class="grid grid-3">
          <div class="feature-card">
            <span class="material-icons">account_balance</span>
            <h3>Gestion de Compte</h3>
            <p>Ouverture, modification, consultation de compte</p>
          </div>
          <div class="feature-card">
            <span class="material-icons">payments</span>
            <h3>Crédit & Prêt</h3>
            <p>Demande de crédit, simulation, suivi</p>
          </div>
          <div class="feature-card">
            <span class="material-icons">how_to_reg</span>
            <h3>Inscription</h3>
            <p>Inscription aux services et programmes</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-page { max-width: 1200px; margin: 0 auto; }
    
    .hero {
      background: linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%);
      color: white;
      padding: 4rem 2rem;
      border-radius: 16px;
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .hero h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    .hero p { font-size: 1.25rem; opacity: 0.9; margin-bottom: 2rem; }
    
    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .hero-actions .btn { min-width: 200px; text-decoration: none; }
    .hero-actions .btn:hover { text-decoration: none; }
    .hero-actions .btn-outline { border-color: white; color: white; }
    .hero-actions .btn-outline:hover { background: white; color: #1a365d; }
    
    .queue-display, .waiting-display { margin-bottom: 2rem; }
    
    .queue-display h2, .waiting-display h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      color: #1a365d;
    }
    
    .serving-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .serving-item {
      background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
      animation: pulse 2s infinite;
    }
    
    .ticket-number { font-size: 2rem; font-weight: 700; }
    .counter { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.5rem; }
    
    .waiting-list { display: flex; flex-direction: column; gap: 0.75rem; }
    
    .waiting-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f7fafc;
      border-radius: 8px;
    }
    
    .position {
      width: 30px;
      height: 30px;
      background: #1a365d;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
    
    .ticket { font-weight: 600; font-size: 1.25rem; }
    .no-data { color: #718096; text-align: center; padding: 2rem; }
    
    .features { margin-top: 3rem; }
    .features h2 { text-align: center; margin-bottom: 2rem; color: #1a365d; }
    
    .feature-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .feature-card .material-icons { font-size: 3rem; color: #2b6cb0; margin-bottom: 1rem; }
    .feature-card h3 { margin-bottom: 0.5rem; color: #1a365d; }
    .feature-card p { color: #718096; }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `]
})
/**
 * Composant de la page d'accueil
 * Affiche l'état actuel de la file d'attente et les services disponibles
 */
export class HomeComponent implements OnInit, OnDestroy {
  /** État actuel de la file d'attente */
  queueStatus: QueueStatus | null = null;
  
  /** Liste des souscriptions pour le nettoyage */
  private subscriptions: Subscription[] = [];

  /**
   * Constructeur
   * @param statsService Service pour récupérer les statistiques
   * @param socketService Service pour les mises à jour en temps réel
   */
  constructor(
    private statsService: StatsService,
    private socketService: SocketService
  ) {}

  /**
   * Initialisation du composant
   * - Charge l'état initial de la file
   * - S'abonne aux événements temps réel
   * - Configure le rafraîchissement automatique
   */
  ngOnInit() {
    // Chargement initial de l'état de la file
    this.loadQueueStatus();
    
    // Souscription aux mises à jour temps réel via WebSocket
    this.subscriptions.push(
      // Mise à jour quand un ticket est appelé
      this.socketService.onTicketCalled().subscribe(() => this.loadQueueStatus()),
      // Mise à jour quand un ticket est modifié
      this.socketService.onTicketUpdated().subscribe(() => this.loadQueueStatus()),
      // Mise à jour quand un nouveau ticket est créé
      this.socketService.onTicketCreated().subscribe(() => this.loadQueueStatus())
    );

    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(() => this.loadQueueStatus(), 30000);
    this.subscriptions.push({ unsubscribe: () => clearInterval(interval) } as Subscription);
  }

  /**
   * Nettoyage lors de la destruction du composant
   * Désabonnement de tous les observables pour éviter les fuites mémoire
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Charge l'état actuel de la file d'attente
   * Récupère les tickets en cours de service et les prochains en attente
   */
  loadQueueStatus() {
    this.statsService.getQueueStatus().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.queueStatus = response.data;
        }
      }
    });
  }
}

