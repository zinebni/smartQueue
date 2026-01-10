/**
 * Intercepteur HTTP d'authentification
 * Ajoute automatiquement le token JWT à toutes les requêtes HTTP sortantes
 * Gère les erreurs d'authentification (401) en déconnectant l'utilisateur
 * @author Smart Queue Team
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Intercepteur pour ajouter le token d'auth aux requêtes et gérer les erreurs 401
 * 
 * Fonctionnalités:
 * - Ajoute automatiquement le header Authorization avec le token JWT
 * - Intercepte les erreurs 401 (Non autorisé)
 * - Déconnecte l'utilisateur et redirige vers login en cas d'erreur 401
 * 
 * Utilisation: Déclaré dans app.config.ts comme intercepteur global
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Injection des services nécessaires
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Récupération du token JWT depuis le service d'auth
  const token = authService.getToken();
  
  // Clone de la requête pour éviter de muter l'original
  let authReq = req;
  
  // Si un token existe, l'ajouter au header Authorization
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  /**
   * Traitement de la requête et gestion des erreurs
   * Intercepte les erreurs 401 pour déconnecter automatiquement l'utilisateur
   */
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si erreur 401 (token expiré ou invalide)
      if (error.status === 401) {
        // Déconnexion de l'utilisateur
        authService.logout().subscribe();
        // Redirection vers la page de connexion
        router.navigate(['/login']);
      }
      // Propagation de l'erreur pour traitement supplémentaire si nécessaire
      return throwError(() => error);
    })
  );
};

