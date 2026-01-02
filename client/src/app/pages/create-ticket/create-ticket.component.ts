import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { CreateTicketRequest, SERVICE_TYPES, Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="create-ticket-page">
      <div class="card ticket-form-card">
        <h1>
          <span class="material-icons">confirmation_number</span>
          Prendre un Ticket
        </h1>
        
        @if (!createdTicket) {
          <form (ngSubmit)="createTicket()">
            <div class="form-group">
              <label for="serviceType">Type de Service *</label>
              <div class="service-grid">
                @for (service of serviceTypes; track service.value) {
                  <div 
                    class="service-option"
                    [class.selected]="ticketData.serviceType === service.value"
                    (click)="ticketData.serviceType = service.value">
                    <span class="material-icons">{{ service.icon }}</span>
                    <span>{{ service.label }}</span>
                  </div>
                }
              </div>
            </div>
            
            <div class="form-group">
              <label for="customerName">Votre Nom (optionnel)</label>
              <input 
                type="text" 
                id="customerName"
                [(ngModel)]="ticketData.customerName"
                name="customerName"
                placeholder="Ex: Prenom Nom">
            </div>
            
            <div class="form-group">
              <label for="customerPhone">Téléphone (optionnel)</label>
              <input 
                type="tel" 
                id="customerPhone"
                [(ngModel)]="ticketData.customerPhone"
                name="customerPhone"
                placeholder="Ex: 0612345678">
            </div>
            
            @if (error) {
              <div class="alert alert-error">{{ error }}</div>
            }
            
            <button type="submit" class="btn btn-primary btn-lg full-width" [disabled]="loading">
              @if (loading) {
                <span class="material-icons spinning">sync</span>
                Création en cours...
              } @else {
                <span class="material-icons">print</span>
                Générer mon Ticket
              }
            </button>
          </form>
        } @else {
          <div class="ticket-created">
            <div class="success-icon">
              <span class="material-icons">check_circle</span>
            </div>
            <h2>Votre ticket a été créé !</h2>
            
            <div class="ticket-display">
              <div class="ticket-number-large">{{ createdTicket.ticketNumber }}</div>
              <div class="ticket-service">{{ getServiceLabel(createdTicket.serviceType) }}</div>
            </div>
            
            <div class="ticket-info">
              <div class="info-row">
                <span class="material-icons">schedule</span>
                <span>Temps d'attente estimé: <strong>~{{ createdTicket.estimatedWaitTime }} min</strong></span>
              </div>
              <div class="info-row">
                <span class="material-icons">access_time</span>
                <span>Créé à: <strong>{{ createdTicket.createdAt | date:'HH:mm' }}</strong></span>
              </div>
            </div>
            
            <div class="ticket-actions">
              <button class="btn btn-primary" (click)="trackTicket()">
                <span class="material-icons">visibility</span>
                Suivre mon ticket
              </button>
              <button class="btn btn-outline" (click)="createAnother()">
                <span class="material-icons">add</span>
                Nouveau ticket
              </button>
            </div>
            
            <p class="notice">
              <span class="material-icons">info</span>
              Conservez votre numéro de ticket. Vous serez appelé sur l'écran d'affichage.
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .create-ticket-page { max-width: 650px; margin: 0 auto; padding: 1rem; }
    
    .ticket-form-card { padding: 2.5rem; }
    
    h1 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1F2933;
      margin-bottom: 2rem;
      font-weight: 700;
      font-size: 1.75rem;
    }
    
    .service-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    
    .service-option {
      padding: 2rem;
      border: 2px solid #E5E7EB;
      border-radius: 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: white;
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.1), transparent);
        transition: left 0.5s ease;
      }

      &:hover::after {
        left: 100%;
      }
    }
    
    .service-option:hover { 
      border-color: #14B8A6;
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(20, 184, 166, 0.2);
    }
    
    .service-option.selected {
      border-color: #14B8A6;
      background: linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(31, 41, 51, 0.05));
      box-shadow: 0 8px 20px rgba(20, 184, 166, 0.25);
      border-width: 3px;
    }
    
    .service-option .material-icons {
      display: block;
      font-size: 3rem;
      color: #14B8A6;
      margin-bottom: 0.75rem;
      transition: transform 0.3s ease;
    }

    .service-option:hover .material-icons {
      transform: scale(1.15) rotate(5deg);
    }
    
    .full-width { width: 100%; }
    
    .ticket-created { text-align: center; }
    
    .success-icon .material-icons {
      font-size: 4.5rem;
      color: #22C55E;
      animation: scaleIn 0.3s ease-out;
    }
    
    .ticket-display {
      background: linear-gradient(135deg, #1F2933 0%, #14B8A6 100%);
      color: white;
      padding: 3.5rem 2.5rem;
      border-radius: 20px;
      margin: 1.5rem 0;
      box-shadow: 0 25px 50px -12px rgba(20, 184, 166, 0.4);
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
        animation: rotate 20s linear infinite;
      }

      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    }
    
    .ticket-number-large {
      font-size: 5rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      position: relative;
      z-index: 1;
    }
    
    .ticket-service { 
      font-size: 1.35rem; 
      opacity: 0.95; 
      margin-top: 0.75rem; 
      font-weight: 600;
      position: relative;
      z-index: 1;
    }
    
    .ticket-info { 
      margin: 2rem 0;
      position: relative;
      z-index: 1;
    }
    
    .info-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 10px;
      margin-bottom: 0.75rem;
    }
    
    .ticket-actions { display: flex; gap: 1rem; justify-content: center; margin: 1.5rem 0; }
    
    .notice {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #718096;
      font-size: 0.875rem;
      margin-top: 1.5rem;
    }
    
    .alert-error {
      background: #fed7d7;
      color: #c53030;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    
    .spinning { animation: spin 1s linear infinite; }
    
    @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    @media (max-width: 480px) {
      .service-grid { grid-template-columns: 1fr; }
      .ticket-actions { flex-direction: column; }
    }
  `]
})
export class CreateTicketComponent {
  serviceTypes = SERVICE_TYPES;
  ticketData: CreateTicketRequest = { serviceType: 'general' };
  createdTicket: Ticket | null = null;
  loading = false;
  error = '';

  constructor(
    private ticketService: TicketService,
    private router: Router
  ) {}

  createTicket() {
    this.loading = true;
    this.error = '';

    this.ticketService.createTicket(this.ticketData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.createdTicket = response.data;
        } else {
          this.error = response.message || 'Erreur lors de la création du ticket';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Erreur de connexion au serveur';
      }
    });
  }

  getServiceLabel(value: string): string {
    return this.serviceTypes.find(s => s.value === value)?.label || value;
  }

  trackTicket() {
    if (this.createdTicket) {
      this.router.navigate(['/ticket-status'], { 
        queryParams: { ticket: this.createdTicket.ticketNumber } 
      });
    }
  }

  createAnother() {
    this.createdTicket = null;
    this.ticketData = { serviceType: 'general' };
  }
}

