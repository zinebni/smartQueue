/**
 * Service de statistiques et rapports
 * Gère la récupération des données statistiques de la file d'attente
 * @author Smart Queue Team
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { QueueStats, QueueStatus } from '../models/stats.model';
import { Agent, ApiResponse } from '../models/ticket.model';

/**
 * Service pour gérer les statistiques et rapports
 * Fournit des méthodes pour accéder aux données de performance
 */
@Injectable({
  providedIn: 'root'
})
export class StatsService {
  /** URL de base de l'API des statistiques */
  private apiUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les statistiques globales du système
   * @returns Observable contenant les statistiques complètes
   * @access Protégé - Nécessite authentification
   */
  getStats(): Observable<ApiResponse<QueueStats>> {
    return this.http.get<ApiResponse<QueueStats>>(this.apiUrl);
  }

  // Get queue status (public - for display)
  getQueueStatus(): Observable<ApiResponse<QueueStatus>> {
    return this.http.get<ApiResponse<QueueStatus>>(`${this.apiUrl}/queue`);
  }

  /**
   * Récupère les statistiques de performance des agents
   * @returns Observable contenant les données de tous les agents
   * @access Admin/Supervisor - Accès restreint
   */
  getAgentStats(): Observable<ApiResponse<Agent[]>> {
    return this.http.get<ApiResponse<Agent[]>>(`${this.apiUrl}/agents`);
  }
}

