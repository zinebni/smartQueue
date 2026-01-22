import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { QueueStatus } from '../../models/stats.model';
import { SocketService } from '../../services/socket.service';
import { StatsService } from '../../services/stats.service';

@Component({
  selector: 'app-queue-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="queue-display-page">
      <header class="display-header">
        <div class="logo">
          <span class="logo-icon">🎫</span>
          <span class="logo-text">Smart Queue</span>
        </div>
        <div class="service-badge">
          <span class="material-icons">{{ getServiceIcon() }}</span>
          {{ getServiceName() }}
        </div>
        <div class="time">{{ currentTime | date:'HH:mm:ss' }}</div>
      </header>
      
      <main class="display-content">
        <section class="now-serving">
          <h2>
            <span class="material-icons">campaign</span>
            EN COURS DE SERVICE
          </h2>
          
          @if (queueStatus?.nowServing?.length) {
            <div class="serving-grid">
              @for (item of queueStatus!.nowServing!; track item._id) {
                <div class="serving-card" [class.pulse]="isRecent(item.calledAt)">
                  <div class="ticket-number">{{ item.ticketNumber }}</div>
                  <div class="counter-info">
                    <span class="material-icons">meeting_room</span>
                    Guichet {{ item.counterNumber || '-' }}
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="no-tickets">
              <span class="material-icons">hourglass_empty</span>
              <p>Aucun ticket en cours</p>
            </div>
          }
        </section>
        
        <section class="waiting-section">
          <h2>
            <span class="material-icons">schedule</span>
            PROCHAINS APPELS
          </h2>
          
          @if (queueStatus?.nextInQueue?.length) {
            <div class="waiting-list">
              @for (ticket of queueStatus!.nextInQueue!.slice(0, 8); track ticket._id; let i = $index) {
                <div class="waiting-item">
                  <span class="position">{{ i + 1 }}</span>
                  <span class="ticket-num">{{ ticket.ticketNumber }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="no-waiting">Aucun ticket en attente</p>
          }
        </section>
      </main>
      
      <footer class="display-footer">
        <p>Merci de patienter - Votre ticket sera appelé prochainement</p>
      </footer>
    </div>
  `,
  styles: [`
    .queue-display-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a365d 0%, #0d1b2a 100%);
      color: white;
      display: flex;
      flex-direction: column;
    }
    
    .display-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #2c5282 0%, #1e3a5f 100%);
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }
    
    .logo-icon {
      font-size: 2rem;
    }
    
    .logo-text {
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    .service-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #48bb78;
      color: white;
      padding: 0.75rem 2rem;
      border-radius: 12px;
      font-size: 1.25rem;
      font-weight: bold;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .service-badge .material-icons {
      font-size: 1.75rem;
    }
    
    .time { 
      font-size: 1.75rem; 
      font-family: monospace; 
      font-weight: bold;
      flex: 1;
      text-align: right;
    }
    
    .display-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: rgba(0,0,0,0.2);
    }
    
    .display-header h1 { font-size: 2rem; }
    .time { font-size: 2rem; font-family: monospace; }
    
    .display-content {
      flex: 1;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      padding: 2rem;
    }
    
    .now-serving, .waiting-section {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 2rem;
    }
    
    h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .serving-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    
    .serving-card {
      background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
      padding: 2rem;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .serving-card.pulse { animation: pulse 2s infinite; }
    
    .ticket-number {
      font-size: 4rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .counter-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 1.5rem;
      margin-top: 1rem;
      opacity: 0.9;
    }
    
    .waiting-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .waiting-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255,255,255,0.1);
      padding: 1rem 1.5rem;
      border-radius: 8px;
    }
    
    .position {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
    
    .ticket-num {
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    
    .no-tickets, .no-waiting {
      text-align: center;
      opacity: 0.5;
      padding: 3rem;
    }
    
    .no-tickets .material-icons { font-size: 4rem; }
    
    .display-footer {
      text-align: center;
      padding: 1rem;
      background: rgba(0,0,0,0.2);
      opacity: 0.7;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
      50% { transform: scale(1.02); box-shadow: 0 15px 40px rgba(56, 161, 105, 0.4); }
    }
    
    @media (max-width: 768px) {
      .display-content { grid-template-columns: 1fr; }
      .ticket-number { font-size: 3rem; }
    }
  `]
})
export class QueueDisplayComponent implements OnInit, OnDestroy {
  queueStatus: QueueStatus | null = null;
  currentTime = new Date();
  service: string = '';
  private subscriptions: Subscription[] = [];

  private serviceNames: Record<string, string> = {
    'account': 'Gestion de Compte',
    'loan': 'Gestion de Prêt',
    'payment': 'Gestion de Paiement',
    'general': 'Service Général',
    'registration': 'Inscription',
    'consultation': 'Consultation'
  };

  private serviceIcons: Record<string, string> = {
    'account': 'account_balance',
    'loan': 'payments',
    'payment': 'payment',
    'general': 'help',
    'registration': 'how_to_reg',
    'consultation': 'contact_support'
  };

  constructor(
    private statsService: StatsService,
    private socketService: SocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.service = this.route.snapshot.paramMap.get('service') || '';
    this.loadQueueStatus();
    
    // Update time every second
    this.subscriptions.push({
      unsubscribe: () => clearInterval(setInterval(() => this.currentTime = new Date(), 1000))
    } as Subscription);
    
    setInterval(() => this.currentTime = new Date(), 1000);
    
    // Subscribe to real-time updates
    this.subscriptions.push(
      this.socketService.onTicketCalled().subscribe(() => this.loadQueueStatus()),
      this.socketService.onTicketUpdated().subscribe(() => this.loadQueueStatus()),
      this.socketService.onTicketCreated().subscribe(() => this.loadQueueStatus())
    );
    
    // Refresh every 30 seconds as backup
    const refreshInterval = setInterval(() => this.loadQueueStatus(), 30000);
    this.subscriptions.push({ unsubscribe: () => clearInterval(refreshInterval) } as Subscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadQueueStatus() {
    this.statsService.getQueueStatus(this.service).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.queueStatus = response.data;
        }
      }
    });
  }

  isRecent(calledAt: string | undefined): boolean {
    if (!calledAt) return false;
    const diff = Date.now() - new Date(calledAt).getTime();
    return diff < 30000; // Less than 30 seconds ago
  }

  getServiceName(): string {
    return this.serviceNames[this.service] || 'Service';
  }

  getServiceIcon(): string {
    return this.serviceIcons[this.service] || 'help';
  }
}

