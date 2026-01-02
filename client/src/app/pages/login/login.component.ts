import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="card login-card">
        <div class="login-header">
          <h1>SmartSaf</h1>
          <p>Espace Agent / Administrateur</p>
        </div>
        
        <form (ngSubmit)="login()">
          <div class="form-group">
            <label for="username">
              <span class="material-icons">person</span>
              Nom d'utilisateur
            </label>
            <input 
              type="text" 
              id="username"
              [(ngModel)]="username"
              name="username"
              placeholder="Entrez votre nom d'utilisateur"
              required
              autocomplete="username">
          </div>
          
          <div class="form-group">
            <label for="password">
              <span class="material-icons">lock</span>
              Mot de passe
            </label>
            <input 
              type="password" 
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Entrez votre mot de passe"
              required
              autocomplete="current-password">
          </div>
          
          @if (error) {
            <div class="alert alert-error">
              <span class="material-icons">error</span>
              {{ error }}
            </div>
          }
          
          <button type="submit" class="btn btn-primary btn-lg full-width" [disabled]="loading">
            @if (loading) {
              <span class="material-icons spinning">sync</span>
              Connexion en cours...
            } @else {
              <span class="material-icons">login</span>
              Se connecter
            }
          </button>
        </form>
        
        <div class="login-footer">
          <p>Accès réservé au personnel autorisé</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    
    .login-card {
      width: 100%;
      max-width: 450px;
      padding: 3rem;
      box-shadow: 0 10px 40px rgba(20, 184, 166, 0.12);
      border-top: 4px solid #14B8A6;
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 2.5rem;
      padding-bottom: 2rem;
      border-bottom: 3px solid #14B8A6;
    }
    
    .login-header h1 {
      color: #1F2933;
      margin: 0 0 0.5rem;
      font-weight: 700;
      font-size: 2.25rem;
      letter-spacing: -0.02em;
    }
    
    .login-header p { color: #6B7280; font-size: 1rem; }
    
    .form-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #111827;
      font-weight: 500;
    }
    
    .form-group label .material-icons {
      font-size: 1.25rem;
      color: #14B8A6;
    }
    
    .full-width { width: 100%; }
    
    .alert-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fed7d7;
      color: #c53030;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    
    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
      color: #a0aec0;
      font-size: 0.875rem;
    }
    
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';
  private returnUrl = '/agent';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/agent';
    
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  login() {
    if (!this.username || !this.password) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.router.navigate([this.returnUrl]);
        } else {
          this.error = response.message || 'Erreur de connexion';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Erreur de connexion au serveur';
      }
    });
  }
}

