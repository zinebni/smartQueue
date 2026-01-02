import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/ticket.service';
import { AdminService } from '../../services/admin.service';
import { SocketService } from '../../services/socket.service';
import { Ticket, Agent, STATUS_LABELS, SERVICE_TYPES } from '../../models/ticket.model';

@Component({
  selector: 'app-agent-console',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="agent-console">
      <div class="console-header">
        <div class="agent-info">
          <h1>Console Agent - SmartSaf</h1>
          <p>
            <span class="material-icons">person</span>
            {{ agent?.firstName }} {{ agent?.lastName }}
            @if (agent?.counterNumber) {
              <span class="counter-badge">Guichet {{ agent?.counterNumber }}</span>
            }
          </p>
        </div>
        <div class="stats-mini">
          <div class="stat">
            <span class="value">{{ agent?.ticketsServedToday || 0 }}</span>
            <span class="label">Servis aujourd'hui</span>
          </div>
        </div>
      </div>

      <div class="console-grid">
        <!-- Current Ticket -->
        <div class="card current-ticket-card">
          <h2>
            <span class="material-icons">confirmation_number</span>
            Ticket en cours
          </h2>
          
          @if (currentTicket) {
            <div class="current-ticket">
              <div class="ticket-number-large">{{ currentTicket.ticketNumber }}</div>
              <span class="badge {{ getStatusClass(currentTicket.status) }}">
                {{ getStatusLabel(currentTicket.status) }}
              </span>
              <p class="service-type">{{ getServiceLabel(currentTicket.serviceType) }}</p>
              
              @if (currentTicket.customerName) {
                <p class="customer-name">
                  <span class="material-icons">person</span>
                  {{ currentTicket.customerName }}
                </p>
              }
              
              <div class="ticket-actions">
                @if (currentTicket.status === 'called') {
                  <button class="btn btn-success" (click)="startServing()">
                    <span class="material-icons">play_arrow</span>
                    Commencer
                  </button>
                }
                
                @if (currentTicket.status === 'serving') {
                  <button class="btn btn-primary" (click)="completeTicket()">
                    <span class="material-icons">check</span>
                    Terminer
                  </button>
                }
                
                <button class="btn btn-warning" (click)="markNoShow()">
                  <span class="material-icons">person_off</span>
                  Absent
                </button>
              </div>
            </div>
          } @else {
            <div class="no-ticket">
              <span class="material-icons">hourglass_empty</span>
              <p>Aucun ticket en cours</p>
              <button class="btn btn-primary btn-lg" (click)="callNext()" [disabled]="loading">
                <span class="material-icons">{{ loading ? 'sync' : 'campaign' }}</span>
                Appeler suivant
              </button>
            </div>
          }
          
          @if (error) {
            <div class="alert alert-error">{{ error }}</div>
          }
        </div>

        <!-- Waiting Queue -->
        <div class="card queue-card">
          <h2>
            <span class="material-icons">queue</span>
            File d'attente
            <span class="count-badge">{{ waitingTickets.length }}</span>
          </h2>
          
          @if (waitingTickets.length) {
            <div class="queue-list">
              @for (ticket of waitingTickets; track ticket._id; let i = $index) {
                <div class="queue-item" [class.priority]="ticket.priority > 0">
                  <span class="position">{{ i + 1 }}</span>
                  <div class="ticket-info">
                    <span class="ticket-number">{{ ticket.ticketNumber }}</span>
                    <span class="service">{{ getServiceLabel(ticket.serviceType) }}</span>
                  </div>
                  <span class="wait-time">{{ getWaitTime(ticket) }} min</span>
                </div>
              }
            </div>
          } @else {
            <p class="no-data">Aucun ticket en attente</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .agent-console { max-width: 1200px; margin: 0 auto; }
    
    .console-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.75rem 2rem;
      background: linear-gradient(135deg, #1F2933 0%, #14B8A6 100%);
      border-radius: 16px;
      color: white;
      box-shadow: 0 10px 25px -5px rgba(20, 184, 166, 0.3);
    }
    
    .agent-info h1 { margin-bottom: 0.5rem; }
    .agent-info p { display: flex; align-items: center; gap: 0.5rem; opacity: 0.9; }
    
    .counter-badge {
      background: rgba(255,255,255,0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.875rem;
    }
    
    .stats-mini .stat {
      text-align: right;
    }
    .stats-mini .value { display: block; font-size: 2rem; font-weight: 700; }
    .stats-mini .label { font-size: 0.875rem; opacity: 0.8; }
    
    .console-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    
    .current-ticket-card h2, .queue-card h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1a365d;
      margin-bottom: 1.5rem;
    }
    
    .current-ticket { text-align: center; }
    
    .ticket-number-large {
      font-size: 4rem;
      font-weight: 700;
      color: #1a365d;
      letter-spacing: 0.05em;
    }
    
    .service-type { color: #718096; margin: 0.5rem 0; }
    .customer-name {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #4a5568;
    }
    
    .ticket-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.5rem;
    }
    
    .no-ticket {
      text-align: center;
      padding: 2rem;
      color: #718096;
    }
    
    .no-ticket .material-icons { font-size: 4rem; opacity: 0.3; }
    .no-ticket p { margin: 1rem 0; }
    
    .count-badge {
      background: #F9FAFB;
      color: #1F2933;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.875rem;
      margin-left: auto;
      font-weight: 600;
    }
    
    .queue-list { display: flex; flex-direction: column; gap: 0.75rem; }
    
    .queue-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #F9FAFB;
      border-radius: 8px;
      border-left: 4px solid #14B8A6;
    }
    
    .queue-item.priority { border-left-color: #F59E0B; }
    
    .position {
      width: 28px;
      height: 28px;
      background: #1F2933;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .ticket-info { flex: 1; }
    .ticket-number { font-weight: 600; display: block; }
    .service { font-size: 0.875rem; color: #718096; }
    .wait-time { color: #718096; font-size: 0.875rem; }
    
    .no-data { text-align: center; color: #a0aec0; padding: 2rem; }
    
    .alert-error {
      background: #fed7d7;
      color: #c53030;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      text-align: center;
    }
    
    @media (max-width: 768px) {
      .console-grid { grid-template-columns: 1fr; }
      .console-header { flex-direction: column; text-align: center; gap: 1rem; }
    }
  `]
})
export class AgentConsoleComponent implements OnInit, OnDestroy {
  agent: Agent | null = null;
  currentTicket: Ticket | null = null;
  waitingTickets: Ticket[] = [];
  loading = false;
  error = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private ticketService: TicketService,
    private adminService: AdminService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.agent = this.authService.agent();
    this.loadData();
    
    // AMÉLIORATION: Rejoindre les salles de services de l'agent
    if (this.agent) {
      // Émettre les services de l'agent lors de la connexion
      this.socketService.setAgentOnline(this.agent._id, this.agent.services);
      
      // Rejoindre les salles de chaque service
      if (this.agent.services && this.agent.services.length > 0) {
        this.agent.services.forEach(service => {
          this.socketService.joinService(service);
        });
      }
      
      console.log('✅ Agent console initialized for services:', this.agent.services);
    }
    
    // AMÉLIORATION: Recharger uniquement les données pertinentes lors des événements
    this.subscriptions.push(
      this.socketService.onTicketCreated().subscribe((ticket) => {
        // Vérifier si le ticket est pour un des services de l'agent
        if (this.agent?.services?.includes(ticket.serviceType)) {
          console.log('📩 New ticket for my service:', ticket.ticketNumber);
          this.loadWaitingTickets();
        }
      }),
      this.socketService.onTicketUpdated().subscribe((ticket) => {
        // Mettre à jour le ticket courant si c'est celui en cours
        if (this.currentTicket && ticket._id === this.currentTicket._id) {
          this.currentTicket = ticket;
        }
        // Recharger la file d'attente si c'est un ticket de nos services
        if (this.agent?.services?.includes(ticket.serviceType)) {
          this.loadWaitingTickets();
        }
      })
    );
  }

  ngOnDestroy() {
    // AMÉLIORATION: Quitter les salles de services lors de la déconnexion
    if (this.agent) {
      this.socketService.setAgentOffline(this.agent._id, this.agent.services);
      
      if (this.agent.services && this.agent.services.length > 0) {
        this.agent.services.forEach(service => {
          this.socketService.leaveService(service);
        });
      }
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData() {
    this.authService.getMe().subscribe({
      next: (response) => {
        if (response.data) {
          this.agent = response.data;
          this.currentTicket = response.data.currentTicket || null;
        }
      },
      error: (err) => {
        console.error('❌ Error loading agent data:', err);
        this.error = 'Erreur lors du chargement des données';
      }
    });
    this.loadWaitingTickets();
  }

  // AMÉLIORATION: Charger uniquement les tickets des services de l'agent
  loadWaitingTickets() {
    if (!this.agent || !this.agent.services || this.agent.services.length === 0) {
      console.warn('⚠️ No services assigned to agent');
      this.waitingTickets = [];
      return;
    }

    // Le backend filtrera automatiquement par services de l'agent
    this.ticketService.getWaitingTickets().subscribe({
      next: (response) => {
        if (response.data) {
          this.waitingTickets = response.data;
          console.log(`📋 Loaded ${this.waitingTickets.length} waiting tickets for my services`);
        }
      },
      error: (err) => {
        console.error('❌ Error loading waiting tickets:', err);
      }
    });
  }

  // AMÉLIORATION: Messages d'erreur plus clairs
  callNext() {
    this.loading = true;
    this.error = '';
    
    this.adminService.callNextTicket().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.currentTicket = response.data;
          this.loadWaitingTickets();
          console.log('✅ Called ticket:', response.data.ticketNumber);
        } else {
          this.error = response.message || 'Aucun ticket en attente';
        }
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || 'Erreur lors de l\'appel du ticket';
        this.error = errorMessage;
        console.error('❌ Error calling next ticket:', errorMessage);
      }
    });
  }

  startServing() {
    this.adminService.startServing().subscribe({
      next: (response) => {
        if (response.data) {
          this.currentTicket = response.data;
          console.log('✅ Started serving ticket:', response.data.ticketNumber);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du démarrage du service';
        console.error('❌ Error starting service:', err);
      }
    });
  }

  completeTicket() {
    this.adminService.completeTicket().subscribe({
      next: () => {
        console.log('✅ Ticket completed');
        this.currentTicket = null;
        this.loadData();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la complétion du ticket';
        console.error('❌ Error completing ticket:', err);
      }
    });
  }

  markNoShow() {
    if (!confirm('Marquer ce client comme absent ?')) return;
    
    this.adminService.markNoShow().subscribe({
      next: () => {
        console.log('✅ Ticket marked as no-show');
        this.currentTicket = null;
        this.loadData();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du marquage d\'absence';
        console.error('❌ Error marking no-show:', err);
      }
    });
  }

  getWaitTime(ticket: Ticket): number {
    const created = new Date(ticket.createdAt).getTime();
    return Math.round((Date.now() - created) / 1000 / 60);
  }

  getStatusLabel(status: string): string {
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS]?.label || status;
  }

  getStatusClass(status: string): string {
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS]?.class || '';
  }

  getServiceLabel(value: string): string {
    return SERVICE_TYPES.find(s => s.value === value)?.label || value;
  }
}

