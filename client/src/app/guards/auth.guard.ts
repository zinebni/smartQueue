/**
 * Guard d'authentification
 * Protège les routes nécessitant une authentification
 * Redirige vers la page de connexion si l'utilisateur n'est pas connecté
 * @author Smart Queue Team
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Vérifie si l'utilisateur est authentifié avant d'activer une route
 * @param route - La route à activer
 * @param state - L'état actuel du routeur
 * @returns true si authentifié, false sinon (avec redirection)
 * 
 * Utilisation dans les routes:
 * { path: 'agent-console', component: AgentConsoleComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = (route, state) => {
  // Injection des services nécessaires
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérification de l'état de connexion
  if (authService.isLoggedIn()) {
    // Utilisateur authentifié - accès autorisé
    return true;
  }

  // Utilisateur non authentifié - redirection vers login
  // Sauvegarde de l'URL demandée pour redirection après connexion
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

