import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { QueueStats } from '../../models/stats.model';
import { Agent } from '../../models/ticket.model';
import { SocketService } from '../../services/socket.service';
import { StatsService } from '../../services/stats.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h1>
          <span class="material-icons">dashboard</span>
          Tableau de Bord
        </h1>
        <p>Mise à jour en temps réel</p>
      </div>

      @if (stats) {
        <!-- Overview Cards -->
        <div class="stats-grid">
          <div class="stat-card waiting">
            <span class="material-icons">hourglass_empty</span>
            <div class="stat-content">
              <span class="value">{{ stats.overview.waiting }}</span>
              <span class="label">En attente</span>
            </div>
          </div>
          <div class="stat-card serving">
            <span class="material-icons">support_agent</span>
            <div class="stat-content">
              <span class="value">{{ stats.overview.serving }}</span>
              <span class="label">En cours</span>
            </div>
          </div>
          <div class="stat-card completed">
            <span class="material-icons">check_circle</span>
            <div class="stat-content">
              <span class="value">{{ stats.overview.completed }}</span>
              <span class="label">Terminés</span>
            </div>
          </div>
          <div class="stat-card total">
            <span class="material-icons">confirmation_number</span>
            <div class="stat-content">
              <span class="value">{{ stats.overview.totalToday }}</span>
              <span class="label">Total aujourd'hui</span>
            </div>
          </div>
        </div>

        <!-- Performance -->
        <div class="grid grid-3">
          <div class="card perf-card">
            <h3>
              <span class="material-icons">timer</span>
              Temps moyen d'attente
            </h3>
            <div class="perf-value">{{ stats.performance.avgWaitTime }} min</div>
          </div>
          <div class="card perf-card">
            <h3>
              <span class="material-icons">speed</span>
              Temps moyen de service
            </h3>
            <div class="perf-value">{{ stats.performance.avgServiceTime }} min</div>
          </div>
          <div class="card perf-card">
            <h3>
              <span class="material-icons">groups</span>
              Agents en ligne
            </h3>
            <div class="perf-value">{{ stats.agents.online }} / {{ stats.agents.total }}</div>
          </div>
        </div>

        <!-- Agents -->
        <div class="card">
          <h2>
            <span class="material-icons">support_agent</span>
            Agents
          </h2>
          
          @if (agents.length) {
            <div class="agents-table">
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Guichet</th>
                    <th>Services</th>
                    <th>Statut</th>
                    <th>Ticket actuel</th>
                    <th>Servis</th>
                    <th>Temps moy.</th>
                  </tr>
                </thead>
                <tbody>
                  @for (agent of agents; track agent._id) {
                    <tr>
                      <td>{{ agent.firstName }} {{ agent.lastName }}</td>
                      <td>{{ agent.counterNumber || '-' }}</td>
                      <td>
                        <div class="services-tags">
                          @for (service of agent.services; track service) {
                            <span class="service-tag" [attr.data-service]="service">
                              {{ getServiceLabel(service) }}
                            </span>
                          }
                        </div>
                      </td>
                      <td>
                        <span class="status-dot" [class.online]="agent.isOnline"></span>
                        {{ agent.isOnline ? 'En ligne' : 'Hors ligne' }}
                      </td>
                      <td>{{ agent.currentTicket?.ticketNumber || '-' }}</td>
                      <td>{{ agent.ticketsServedToday }}</td>
                      <td>{{ agent.averageServiceTime }} min</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="no-data">Aucun agent trouvé</p>
          }
        </div>

        <!-- By Service -->
        <div class="card">
          <h2>
            <span class="material-icons">category</span>
            Par service
          </h2>
          <div class="service-bars">
            @for (item of getServiceStats(); track item.service) {
              <div class="service-bar">
                <span class="service-name">{{ item.label }}</span>
                <div class="bar-container">
                  <div class="bar" [style.width.%]="item.percentage"></div>
                </div>
                <span class="service-count">{{ item.count }}</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="loading">Chargement...</div>
      }
    </div>
  `,
  styles: [`
    .admin-dashboard { max-width: 1200px; margin: 0 auto; }
    
    .dashboard-header {
      margin-bottom: 2rem;
    }
    
    .dashboard-header h1 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1a365d;
    }
    
    .dashboard-header p { color: #718096; }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 12px;
      color: white;
    }
    
    .stat-card.waiting { background: linear-gradient(135deg, #dd6b20, #c05621); }
    .stat-card.serving { background: linear-gradient(135deg, #2b6cb0, #2c5282); }
    .stat-card.completed { background: linear-gradient(135deg, #38a169, #2f855a); }
    .stat-card.total { background: linear-gradient(135deg, #1a365d, #2d3748); }
    
    .stat-card .material-icons { font-size: 2.5rem; opacity: 0.9; }
    .stat-card .value { display: block; font-size: 2rem; font-weight: 700; }
    .stat-card .label { font-size: 0.875rem; opacity: 0.9; }
    
    .perf-card h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #4a5568;
      margin-bottom: 1rem;
    }
    
    .perf-value { font-size: 2rem; font-weight: 700; color: #1a365d; }
    
    .card h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1a365d;
      margin-bottom: 1.5rem;
    }
    
    .agents-table { overflow-x: auto; }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    th { background: #f7fafc; font-weight: 600; color: #4a5568; }
    
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #cbd5e0;
      margin-right: 0.5rem;
    }
    
    .status-dot.online { background: #38a169; }
    
    .services-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    
    .service-tag {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }
    
    .service-tag[data-service="account"] { background: #bee3f8; color: #2c5282; }
    .service-tag[data-service="loan"] { background: #fbd38d; color: #7c2d12; }
    .service-tag[data-service="general"] { background: #c6f6d5; color: #22543d; }
    .service-tag[data-service="registration"] { background: #fed7d7; color: #742a2a; }
    .service-tag[data-service="consultation"] { background: #e9d8fd; color: #44337a; }
    .service-tag[data-service="payment"] { background: #feebc8; color: #7c2d12; }
    
    .service-bars { display: flex; flex-direction: column; gap: 1rem; }
    
    .service-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .service-name { width: 150px; font-weight: 500; }
    
    .bar-container {
      flex: 1;
      height: 24px;
      background: #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .bar {
      height: 100%;
      background: linear-gradient(90deg, #2b6cb0, #1a365d);
      border-radius: 12px;
      transition: width 0.3s ease;
    }
    
    .service-count { width: 40px; text-align: right; font-weight: 600; }
    
    .no-data, .loading { text-align: center; color: #a0aec0; padding: 2rem; }
    
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .grid-3 { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: QueueStats | null = null;
  agents: Agent[] = [];
  private subscriptions: Subscription[] = [];

  private serviceLabels: Record<string, string> = {
    general: 'Général',
    account: 'Compte',
    loan: 'Crédit',
    registration: 'Inscription',
    consultation: 'Consultation',
    payment: 'Paiement'
  };

  constructor(
    private statsService: StatsService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.socketService.joinRoom('admin');
    this.loadStats();
    this.loadAgents();
    
    // Auto-refresh every 15 seconds
    this.subscriptions.push(
      interval(15000).subscribe(() => {
        this.loadStats();
        this.loadAgents();
      })
    );
    
    this.subscriptions.push(
      this.socketService.onTicketCreated().subscribe(() => this.loadStats()),
      this.socketService.onTicketUpdated().subscribe(() => this.loadStats())
    );
  }

  ngOnDestroy() {
    this.socketService.leaveRoom('admin');
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadStats() {
    this.statsService.getStats().subscribe({
      next: (response) => {
        if (response.data) this.stats = response.data;
      }
    });
  }

  loadAgents() {
    this.statsService.getAgentStats().subscribe({
      next: (response) => {
        if (response.data) this.agents = response.data;
      }
    });
  }

  getServiceStats(): { service: string; label: string; count: number; percentage: number }[] {
    if (!this.stats?.byService) return [];
    
    const total = Object.values(this.stats.byService).reduce((a, b) => a + b, 0) || 1;
    
    return Object.entries(this.stats.byService).map(([service, count]) => ({
      service,
      label: this.serviceLabels[service] || service,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  getServiceLabel(service: string): string {
    return this.serviceLabels[service] || service;
  }
}

