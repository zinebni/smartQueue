import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <header class="header">
        <div class="header-content">
          <a routerLink="/" class="logo">
            <span class="logo-icon">🎫</span>
            <span class="logo-text">Smart Queue</span>
          </a>
          
          <nav class="nav">
            <a routerLink="/create-ticket" routerLinkActive="active">
              <span class="material-icons">add_circle</span>
              Nouveau Ticket
            </a>
            <a routerLink="/ticket-status" routerLinkActive="active">
              <span class="material-icons">search</span>
              Suivre Ticket
            </a>
            
            @if (authService.isLoggedIn()) {
              <a routerLink="/agent" routerLinkActive="active">
                <span class="material-icons">support_agent</span>
                Console Agent
              </a>
              @if (authService.isAdmin()) {
                <a routerLink="/admin" routerLinkActive="active">
                  <span class="material-icons">dashboard</span>
                  Admin
                </a>
              }
              <button class="btn-logout" (click)="logout()">
                <span class="material-icons">logout</span>
              </button>
            } @else {
              <a routerLink="/login" routerLinkActive="active" class="btn-login">
                <span class="material-icons">login</span>
                Connexion
              </a>
            }
          </nav>
        </div>
      </header>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      
      <footer class="footer">
        <p>© 2026 Smart Queue - Gestion Intelligente des Files d'Attente</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%);
      color: white;
      padding: 1rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      text-decoration: none;
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .logo-icon { font-size: 2rem; }
    
    .nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .nav a {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      color: rgba(255,255,255,0.9);
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s;
      font-weight: 500;
    }
    
    .nav a:hover, .nav a.active {
      background: rgba(255,255,255,0.2);
      color: white;
    }
    
    .btn-logout, .btn-login {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    
    .btn-logout:hover { background: rgba(255,255,255,0.2); }
    
    .main-content {
      flex: 1;
      padding: 2rem 1rem;
    }
    
    .footer {
      background: #1a202c;
      color: #a0aec0;
      text-align: center;
      padding: 1.5rem;
      margin-top: auto;
    }
    
    @media (max-width: 768px) {
      .header-content { flex-direction: column; gap: 1rem; }
      .nav { flex-wrap: wrap; justify-content: center; }
      .logo-text { display: none; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    public authService: AuthService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit() {
    this.socketService.connect();
  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}

