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
          <h1>Système Intelligent de Gestion</h1>
          <p>Solution professionnelle pour optimiser vos files d'attente</p>
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
    .home-page { 
      max-width: 1200px; 
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .hero {
      background: linear-gradient(135deg, #1F2933 0%, #14B8A6 100%);
      color: white;
      padding: 5rem 2rem;
      border-radius: 20px;
      text-align: center;
      margin-bottom: 3rem;
      box-shadow: 0 20px 25px -5px rgba(20, 184, 166, 0.2), 0 10px 10px -5px rgba(20, 184, 166, 0.1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        animation: pulse 8s ease-in-out infinite;
      }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    .hero-content {
      position: relative;
      z-index: 1;
    }
    
    .hero h1 { 
      font-size: 3rem; 
      margin-bottom: 1rem; 
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    
    .hero p { 
      font-size: 1.35rem; 
      opacity: 0.95; 
      margin-bottom: 2.5rem;
      font-weight: 400;
    }
    
    .hero-actions {
      display: flex;
      gap: 1.25rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .hero-actions a {
      text-decoration: none !important;
    }

    .hero-actions a:hover {
      text-decoration: none !important;
    }

    .hero-actions a:active {
      text-decoration: none !important;
    }

    .hero-actions a:focus {
      text-decoration: none !important;
    }
    
    .hero-actions .btn { 
      min-width: 220px;
      padding: 1rem 2rem;
      font-size: 1.125rem;
      position: relative;
      overflow: hidden;
      text-decoration: none !important;
    }

    .hero-actions .btn-primary {
      background: #ffffff !important;
      color: #000000 !important;
      box-shadow: 0 4px 6px -1px rgba(255, 255, 255, 0.4);
    }

    .hero-actions .btn-primary:hover {
      background: #f0f0f0 !important;
      box-shadow: 0 10px 15px -3px rgba(255, 255, 255, 0.5);
    }

    .hero-actions .btn::before {
      display: none !important;
    }

    .hero-actions .btn:hover {
      transform: none !important;
      text-decoration: none !important;
    }
    
    .hero-actions .btn-outline { 
      border: 2px solid white; 
      color: white;
      background: transparent;
      backdrop-filter: blur(10px);
      text-decoration: none !important;
    }
    
    .hero-actions .btn-outline:hover { 
      background: rgba(255, 255, 255, 0.1); 
      color: white;
      border-color: white;
      transform: none !important;
      text-decoration: none !important;
    }
    
    .queue-display, .waiting-display { 
      margin-bottom: 2.5rem;
      padding: 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .queue-display h2, .waiting-display h2 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      color: #1F2933;
      font-weight: 700;
      font-size: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 3px solid #14B8A6;
    }
    
    .serving-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .serving-item {
      background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
      color: white;
      padding: 2rem;
      border-radius: 16px;
      text-align: center;
      animation: pulse-soft 2s infinite;
      box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.3), 0 4px 6px -2px rgba(34, 197, 94, 0.2);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
        animation: rotate 10s linear infinite;
      }
    }

    @keyframes pulse-soft {
      0%, 100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.3); }
      50% { transform: scale(1.03); box-shadow: 0 20px 25px -5px rgba(34, 197, 94, 0.4); }
    }

    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .ticket-number { 
      font-size: 2.25rem; 
      font-weight: 700;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .counter { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 0.5rem; 
      margin-top: 0.75rem;
      position: relative;
      z-index: 1;
      font-weight: 500;
    }
    
    .waiting-list { 
      display: flex; 
      flex-direction: column; 
      gap: 1rem; 
    }
    
    .waiting-item {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;
      background: #F9FAFB;
      border-radius: 12px;
      border-left: 4px solid #14B8A6;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateX(5px);
        box-shadow: 0 4px 6px -1px rgba(20, 184, 166, 0.1);
        background: white;
      }
    }
    
    .position {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #1F2933 0%, #14B8A6 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      box-shadow: 0 4px 6px -1px rgba(31, 41, 51, 0.3);
    }
    
    .ticket { 
      font-weight: 700; 
      font-size: 1.35rem; 
      color: #111827;
      letter-spacing: 0.025em;
    }
    .no-data { 
      color: #6B7280; 
      text-align: center; 
      padding: 3rem;
      font-size: 1.125rem;
      font-weight: 500;
    }
    
    .features { 
      margin-top: 4rem; 
      padding: 3rem 0;
    }
    
    .features h2 { 
      text-align: center; 
      margin-bottom: 3rem; 
      color: #1F2933; 
      font-weight: 800;
      font-size: 2.25rem;
      letter-spacing: -0.02em;
    }
    
    .feature-card {
      background: white;
      padding: 2.5rem;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(229, 231, 235, 0.5);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #14B8A6, #1F2933);
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }

      &:hover::before {
        transform: scaleX(1);
      }
    }
    
    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 25px -5px rgba(20, 184, 166, 0.15), 0 10px 10px -5px rgba(20, 184, 166, 0.1);
    }
    
    .feature-card .material-icons { 
      font-size: 3.5rem; 
      color: #14B8A6; 
      margin-bottom: 1.25rem;
    }
    
    .feature-card h3 { 
      margin-bottom: 0.75rem; 
      color: #1F2933; 
      font-weight: 700;
      font-size: 1.25rem;
    }
    
    .feature-card p { 
      color: #6B7280;
      line-height: 1.6;
      font-size: 1rem;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  queueStatus: QueueStatus | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private statsService: StatsService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.loadQueueStatus();
    
    // Subscribe to real-time updates
    this.subscriptions.push(
      this.socketService.onTicketCalled().subscribe(() => this.loadQueueStatus()),
      this.socketService.onTicketUpdated().subscribe(() => this.loadQueueStatus()),
      this.socketService.onTicketCreated().subscribe(() => this.loadQueueStatus())
    );

    // Refresh every 30 seconds
    const interval = setInterval(() => this.loadQueueStatus(), 30000);
    this.subscriptions.push({ unsubscribe: () => clearInterval(interval) } as Subscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadQueueStatus() {
    this.statsService.getQueueStatus().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.queueStatus = response.data;
        }
      }
    });
  }
}

