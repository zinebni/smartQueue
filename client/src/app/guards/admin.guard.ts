/**
 * Guard d'administration
 * Protège les routes réservées aux administrateurs
 * Vérifie que l'utilisateur est connecté ET possède le rôle admin
 * @author Smart Queue Team
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Vérifie si l'utilisateur est authentifié et possède le rôle admin
 * @param route - La route à activer
 * @param state - L'état actuel du routeur
 * @returns true si admin, false sinon (avec redirection vers console agent)
 * 
 * Utilisation dans les routes:
 * { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] }
 */
export const adminGuard: CanActivateFn = (route, state) => {
  // Injection des services nécessaires
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérification du rôle administrateur
  if (authService.isAdmin()) {
    // Utilisateur est admin - accès autorisé
    return true;
  }

  // Utilisateur non-admin - redirection vers la console agent
  router.navigate(['/agent']);
  return false;
};

