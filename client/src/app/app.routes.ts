import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'create-ticket',
    loadComponent: () => import('./pages/create-ticket/create-ticket.component').then(m => m.CreateTicketComponent)
  },
  {
    path: 'ticket-status',
    loadComponent: () => import('./pages/ticket-status/ticket-status.component').then(m => m.TicketStatusComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'agent',
    loadComponent: () => import('./pages/agent-console/agent-console.component').then(m => m.AgentConsoleComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'display/:service',
    loadComponent: () => import('./pages/queue-display/queue-display.component').then(m => m.QueueDisplayComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

