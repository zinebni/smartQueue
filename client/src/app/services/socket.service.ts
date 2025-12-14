import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Ticket } from '../models/ticket.model';

/**
 * SERVICE SOCKET AMÉLIORÉ
 * 
 * Améliorations :
 * - Support des salles de service pour filtrage
 * - Gestion améliorée de la connexion/déconnexion des agents
 * - Émission des services de l'agent lors de la connexion
 * - Logs détaillés pour debugging
 */

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connected = signal(false);
  
  isConnected = this.connected.asReadonly();

  // Event subjects
  private ticketCreated$ = new Subject<Ticket>();
  private ticketUpdated$ = new Subject<Ticket>();
  private ticketCalled$ = new Subject<{ ticket: any; agent: any }>();
  private queueUpdated$ = new Subject<any>();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      this.connected.set(true);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      this.connected.set(false);
    });

    // Listen to events
    this.socket.on('ticket:created', (ticket: Ticket) => {
      console.log('📩 Ticket created:', ticket.ticketNumber);
      this.ticketCreated$.next(ticket);
    });

    this.socket.on('ticket:updated', (ticket: Ticket) => {
      console.log('📩 Ticket updated:', ticket.ticketNumber);
      this.ticketUpdated$.next(ticket);
    });

    this.socket.on('ticket:called', (data: { ticket: any; agent: any }) => {
      console.log('📩 Ticket called:', data.ticket.ticketNumber);
      this.ticketCalled$.next(data);
      this.playCallSound();
    });

    this.socket.on('queue:updated', (data: any) => {
      this.queueUpdated$.next(data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected.set(false);
    }
  }

  // Subscribe to specific ticket
  subscribeToTicket(ticketId: string) {
    this.socket?.emit('ticket:subscribe', ticketId);
  }

  unsubscribeFromTicket(ticketId: string) {
    this.socket?.emit('ticket:unsubscribe', ticketId);
  }

  // Join room (e.g., 'admin', 'agents')
  joinRoom(room: string) {
    this.socket?.emit('join:room', room);
    console.log(`📍 Joined room: ${room}`);
  }

  leaveRoom(room: string) {
    this.socket?.emit('leave:room', room);
    console.log(`🚪 Left room: ${room}`);
  }

  // AMÉLIORATION: Rejoindre une salle de service
  joinService(serviceType: string) {
    this.socket?.emit('join:service', serviceType);
    console.log(`📍 Joined service: ${serviceType}`);
  }

  leaveService(serviceType: string) {
    this.socket?.emit('leave:service', serviceType);
    console.log(`🚪 Left service: ${serviceType}`);
  }

  // AMÉLIORATION: Agent status avec services
  setAgentOnline(agentId: string, services?: string[]) {
    this.socket?.emit('agent:online', { agentId, services });
    console.log(`✅ Agent ${agentId} online with services:`, services);
  }

  setAgentOffline(agentId: string, services?: string[]) {
    this.socket?.emit('agent:offline', { agentId, services });
    console.log(`❌ Agent ${agentId} offline`);
  }

  // Observable getters
  onTicketCreated(): Observable<Ticket> {
    return this.ticketCreated$.asObservable();
  }

  onTicketUpdated(): Observable<Ticket> {
    return this.ticketUpdated$.asObservable();
  }

  onTicketCalled(): Observable<{ ticket: any; agent: any }> {
    return this.ticketCalled$.asObservable();
  }

  onQueueUpdated(): Observable<any> {
    return this.queueUpdated$.asObservable();
  }

  private playCallSound() {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      // Audio not available
    }
  }
}

