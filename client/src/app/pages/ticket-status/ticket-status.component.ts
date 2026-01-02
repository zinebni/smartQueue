import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TicketService } from '../../services/ticket.service';
import { SocketService } from '../../services/socket.service';
import { Ticket, STATUS_LABELS, SERVICE_TYPES } from '../../models/ticket.model';

@Component({
  selector: 'app-ticket-status',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ticket-status-page">
      <div class="card search-card">
        <h1>
          <span class="material-icons">search</span>
          Suivre mon Ticket
        </h1>
        
        <div class="search-form">
          <input 
            type="text" 
            [(ngModel)]="ticketNumber"
            placeholder="Entrez votre numéro de ticket (ex: G001)"
            (keyup.enter)="searchTicket()">
          <button class="btn btn-primary" (click)="searchTicket()" [disabled]="loading">
            <span class="material-icons">{{ loading ? 'sync' : 'search' }}</span>
          </button>
        </div>
        
        @if (error) {
          <div class="alert alert-error">{{ error }}</div>
        }
      </div>
      
      @if (ticket) {
        <div class="card ticket-details fade-in">
          <div class="ticket-header">
            <div class="ticket-number-display">{{ ticket.ticketNumber }}</div>
            <span class="badge {{ getStatusClass(ticket.status) }}">
              {{ getStatusLabel(ticket.status) }}
            </span>
          </div>
          
          <div class="ticket-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="material-icons">category</span>
                <div>
                  <label>Service</label>
                  <strong>{{ getServiceLabel(ticket.serviceType) }}</strong>
                </div>
              </div>
              
              <div class="info-item">
                <span class="material-icons">schedule</span>
                <div>
                  <label>Position dans la file</label>
                  <strong>{{ ticket.queuePosition || '-' }}</strong>
                </div>
              </div>
              
              <div class="info-item">
                <span class="material-icons">timer</span>
                <div>
                  <label>Temps d'attente estimé</label>
                  <strong>~{{ ticket.estimatedWaitTime }} min</strong>
                </div>
              </div>
              
              <div class="info-item">
                <span class="material-icons">access_time</span>
                <div>
                  <label>Créé à</label>
                  <strong>{{ ticket.createdAt | date:'HH:mm' }}</strong>
                </div>
              </div>
              
              @if (ticket.counterNumber) {
                <div class="info-item highlight">
                  <span class="material-icons">meeting_room</span>
                  <div>
                    <label>Guichet</label>
                    <strong>{{ ticket.counterNumber }}</strong>
                  </div>
                </div>
              }
            </div>
            
            @if (ticket.status === 'called') {
              <div class="alert-called">
                <span class="material-icons">campaign</span>
                <div>
                  <strong>C'est votre tour !</strong>
                  <p>Veuillez vous rendre au guichet {{ ticket.counterNumber }}</p>
                </div>
              </div>
            }
            
            @if (ticket.status === 'waiting') {
              <button class="btn btn-danger" (click)="cancelTicket()">
                <span class="material-icons">cancel</span>
                Annuler mon ticket
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .ticket-status-page { max-width: 650px; margin: 0 auto; padding: 1rem; }
    
    .search-card h1 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1F2933;
      margin-bottom: 1.5rem;
      font-weight: 700;
    }
    
    .search-form {
      display: flex;
      gap: 0.75rem;
    }
    
    .search-form input {
      flex: 1;
      padding: 1.25rem 1.5rem;
      border: 2px solid #E5E7EB;
      border-radius: 12px;
      font-size: 1.125rem;
      text-transform: uppercase;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .search-form input:focus {
      border-color: #14B8A6;
      outline: none;
      box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1), 0 4px 6px -1px rgba(20, 184, 166, 0.1);
      transform: translateY(-2px);
    }
    
    .search-form .btn { 
      padding: 1.25rem 2rem;
      font-weight: 600;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(20, 184, 166, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(20, 184, 166, 0.4);
      }
    }
    
    .ticket-details { margin-top: 1.5rem; }
    
    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e8eaf0;
      margin-bottom: 1.5rem;
    }
    
    .ticket-number-display {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1F2933;
      letter-spacing: 0.05em;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: #F9FAFB;
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid transparent;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #14B8A6, #0D9488);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
      }

      &:hover::before {
        transform: scaleX(1);
      }

      &:hover {
        background: white;
        border-color: #14B8A6;
        transform: translateY(-3px);
        box-shadow: 0 10px 15px -3px rgba(20, 184, 166, 0.1);
      }
    }
    
    .info-item .material-icons {
      color: #14B8A6;
      margin-top: 0.25rem;
      font-size: 2rem;
      transition: transform 0.3s ease;
    }

    .info-item:hover .material-icons {
      transform: scale(1.2);
    }
    
    .info-item label {
      display: block;
      color: #6B7280;
      font-size: 0.875rem;
    }
    
    .info-item strong { color: #111827; font-weight: 600; }
    
    .info-item.highlight {
      grid-column: span 2;
      background: linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(31, 41, 51, 0.03));
      padding: 1rem;
      border-radius: 8px;
      border: 2px solid #14B8A6;
    }
    
    .alert-called {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      margin: 1.5rem 0;
      animation: pulse 2s infinite;
    }
    
    .alert-called .material-icons { font-size: 2.5rem; }
    .alert-called strong { font-size: 1.25rem; }
    .alert-called p { margin-top: 0.25rem; opacity: 0.9; }
    
    .alert-error {
      background: #fed7d7;
      color: #c53030;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    
    @media (max-width: 480px) {
      .info-grid { grid-template-columns: 1fr; }
      .info-item.highlight { grid-column: span 1; }
    }
  `]
})
export class TicketStatusComponent implements OnInit, OnDestroy {
  ticketNumber = '';
  ticket: Ticket | null = null;
  loading = false;
  error = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    // Check for ticket number in query params
    this.route.queryParams.subscribe(params => {
      if (params['ticket']) {
        this.ticketNumber = params['ticket'];
        this.searchTicket();
      }
    });

    // Subscribe to ticket updates
    this.subscriptions.push(
      this.socketService.onTicketUpdated().subscribe(updated => {
        if (this.ticket && updated._id === this.ticket._id) {
          this.ticket = { ...this.ticket, ...updated };
        }
      }),
      this.socketService.onTicketCalled().subscribe(data => {
        if (this.ticket && data.ticket.id === this.ticket._id) {
          this.searchTicket(); // Refresh
        }
      })
    );
  }

  ngOnDestroy() {
    if (this.ticket) {
      this.socketService.unsubscribeFromTicket(this.ticket._id);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  searchTicket() {
    if (!this.ticketNumber.trim()) return;
    
    this.loading = true;
    this.error = '';
    
    this.ticketService.getTicketByNumber(this.ticketNumber.toUpperCase()).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          if (this.ticket) {
            this.socketService.unsubscribeFromTicket(this.ticket._id);
          }
          this.ticket = response.data;
          this.socketService.subscribeToTicket(this.ticket._id);
        } else {
          this.error = 'Ticket non trouvé';
          this.ticket = null;
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Ticket non trouvé';
        this.ticket = null;
      }
    });
  }

  cancelTicket() {
    if (!this.ticket || !confirm('Êtes-vous sûr de vouloir annuler ce ticket ?')) return;
    
    this.ticketService.cancelTicket(this.ticket._id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ticket = response.data;
        }
      }
    });
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

