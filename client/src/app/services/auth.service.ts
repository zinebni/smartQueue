/**
 * Service d'authentification et gestion des sessions
 * Gère la connexion, déconnexion et vérification des permissions des agents
 * @author Smart Queue Team
 * @version 1.0.0
 */
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Agent, ApiResponse } from '../models/ticket.model';

interface LoginResponse {
  token: string;
  agent: Agent;
}
// Service to handle authentication logic

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private currentAgent = signal<Agent | null>(null);
  private token = signal<string | null>(null);
  
  agent = computed(() => this.currentAgent());
  
  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('token');
    const agent = localStorage.getItem('agent');
    
    if (token && agent) {
      this.token.set(token);
      this.currentAgent.set(JSON.parse(agent));
    }
  }
  // Method to log in a user it takes username and password and returns an observable based on the API response
  login(username: string, password: string): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.token.set(response.data.token);
            this.currentAgent.set(response.data.agent);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('agent', JSON.stringify(response.data.agent));
          }
        })
      );
  }

  // Method to log out a user it returns an observable based on the API response
  logout(): Observable<any> {
    const token = this.token();
    if (!token) {
      this.clearAuth();
      return of({ success: true });
    }

    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearAuth()),
      catchError(() => {
        this.clearAuth();
        return of({ success: true });
      })
    );
  }

  private clearAuth() {
    this.token.set(null);
    this.currentAgent.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('agent');
  }

  //c'est la page d'accueil 
  getMe(): Observable<ApiResponse<Agent>> {
    return this.http.get<ApiResponse<Agent>>(`${this.apiUrl}/me`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.currentAgent.set(response.data);
          localStorage.setItem('agent', JSON.stringify(response.data));
        }
      })
    );
  }

  getToken(): string | null {
    return this.token();
  }

  // returns true if the user is logged in, false otherwise thanks to !!this.token() !! means convert to boolean
  isLoggedIn(): boolean {
    return !!this.token();
  }
  //check if the user is admin or supervisor : returns true if the user is admin or supervisor, false otherwise
  isAdmin(): boolean {
    const agent = this.currentAgent();
    return agent?.role === 'admin' || agent?.role === 'supervisor';
  }
  // returns the role of the user as a string or null if no user is logged in
  getRole(): string | null {
    return this.currentAgent()?.role || null;
  }
}

