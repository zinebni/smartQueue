/**
 * Service de gestion des tickets
 * Gère toutes les opérations CRUD liées aux tickets de la file d'attente
 * @author Smart Queue Team
 * @version 1.0.0
 */import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ticket, CreateTicketRequest, ApiResponse, TicketStatus, ServiceType } from '../models/ticket.model';

// Service to handle ticket-related API calls
@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  // Create a new ticket
  createTicket(data: CreateTicketRequest): Observable<ApiResponse<Ticket>> {
    return this.http.post<ApiResponse<Ticket>>(this.apiUrl, data);
  }

  // Get tickets with optional filters
  getTickets(options?: {
    status?: TicketStatus;
    serviceType?: ServiceType;
    limit?: number;
  }): Observable<ApiResponse<Ticket[]>> {
    let params = new HttpParams();
    
    if (options?.status) {
      params = params.set('status', options.status);
    }
    if (options?.serviceType) {
      params = params.set('serviceType', options.serviceType);
    }
    if (options?.limit) {
      params = params.set('limit', options.limit.toString());
    }

    return this.http.get<ApiResponse<Ticket[]>>(this.apiUrl, { params });
  }

  // Get ticket by ID
  getTicketById(id: string): Observable<ApiResponse<Ticket>> {
    return this.http.get<ApiResponse<Ticket>>(`${this.apiUrl}/${id}`);
  }

  // Get ticket by ticket number
  getTicketByNumber(ticketNumber: string): Observable<ApiResponse<Ticket>> {
    return this.http.get<ApiResponse<Ticket>>(`${this.apiUrl}/number/${ticketNumber}`);
  }

  // Check-in ticket
  checkinTicket(id: string): Observable<ApiResponse<Ticket>> {
    return this.http.post<ApiResponse<Ticket>>(`${this.apiUrl}/${id}/checkin`, {});
  }

  // Cancel ticket
  cancelTicket(id: string): Observable<ApiResponse<Ticket>> {
    return this.http.post<ApiResponse<Ticket>>(`${this.apiUrl}/${id}/cancel`, {});
  }

  // Get waiting tickets
  getWaitingTickets(): Observable<ApiResponse<Ticket[]>> {
    return this.getTickets({ status: 'waiting' });
  }
}

