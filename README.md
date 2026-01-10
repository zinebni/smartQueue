# 🎫 Smart Queue - Système de Gestion des Files d'Attente

Système complet de gestion intelligente des files d'attente avec **filtrage par service** pour banques, universités et agences professionnelles.

## 📋 Table des matières
- [Fonctionnalités](#-fonctionnalités-principales)
- [Installation](#-installation)
- [Technologies](#-technologies-utilisées)
- [Architecture](#-architecture-du-projet)

## ✨ Fonctionnalités Principales

### 🎯 Gestion des Services par Agent
- **Assignation de services spécifiques** à chaque agent
- **Filtrage automatique** : les agents ne voient que les tickets de leurs services
- **Services partagés** : plusieurs agents peuvent gérer le même service
- **Accès complet** pour les administrateurs et superviseurs

### 🔒 Sécurité Renforcée
- Authentification JWT avec validation stricte
- Vérification des permissions par service
- Protection contre les accès non autorisés
- Validation complète des inputs côté serveur

### ⚡ Temps Réel avec Socket.io
- Synchronisation instantanée via salles de service
- Notifications ciblées par type de service
- Mise à jour automatique des files d'attente
- Performance optimisée

### 📊 Autres Fonctionnalités
- Création et gestion de tickets
- File d'attente intelligente avec priorités
- Statistiques en temps réel
- Interface agent intuitive
- Affichage public pour les clients
- Responsive design

---

## 📋 Stack Technique

- **Frontend**: Angular 17 (Standalone Components + Signals)
- **Backend**: Node.js + Express (Architecture MVC)
- **Base de données**: MongoDB avec Mongoose
- **Temps réel**: Socket.io avec système de salles
- **Authentification**: JWT avec middleware de sécurité
- **Containerisation**: Docker + Docker Compose

---

## 🚀 Démarrage Rapide

### Option 1: Docker (Recommandé) 🐳

**Tout est conteneurisé - Simple et rapide**

```powershell
# Démarrer
.\start.ps1

# OU manuellement
docker-compose up --build -d

# Initialiser la base de données (première fois)
docker exec smartqueue-backend npm run seed

# Arrêter
docker-compose down
```

**Accès**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

### Option 2: Développement Local ⚡

**Pour développer avec hot-reload**

```powershell
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
ng serve
```

**Accès**: http://localhost:4200

**Prérequis**:
- MongoDB installé et démarré localement
- Node.js v20+
- Angular CLI

---

## 🔧 Commandes Utiles

### Docker

```bash
# Démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Initialiser la DB
docker exec smartqueue-backend npm run seed

# Arrêter
docker-compose down
```

### Local

```bash
# Backend
cd server
npm install
npm run seed
npm run dev

# Frontend
cd client
npm install
ng serve
```

---

## 👤 Comptes par Défaut

Après avoir exécuté `npm run seed` dans le dossier server:

| Rôle | Username | Password | Services |
|------|----------|----------|----------|
| Admin | admin | admin123 | Tous les services |
| Supervisor | supervisor | supervisor123 | Tous les services |
| Agent 1 | agent1 | agent123 | account, general |
| Agent 2 | agent2 | agent123 | loan, consultation |
| Agent 3 | agent3 | agent123 | registration, payment |
| Agent 4 | agent4 | agent123 | general, consultation |

### Types de Services Disponibles
- **account** : Gestion de compte
- **loan** : Prêts et crédits
- **general** : Services généraux
- **registration** : Inscriptions
- **consultation** : Consultations
- **payment** : Paiements

---

## 📡 API Endpoints

### Public (Pas d'authentification)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/tickets` | Créer un ticket |
| GET | `/api/tickets/number/:num` | Ticket par numéro |
| GET | `/api/stats/queue` | Statut de la file |

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Utilisateur courant |
| POST | `/api/auth/logout` | Déconnexion |

### Agent (Authentifié - JWT Required)
| Méthode | Endpoint | Description | Note |
|---------|----------|-------------|------|
| GET | `/api/tickets` | Liste des tickets | Filtrés par services de l'agent |
| GET | `/api/tickets/:id` | Détails d'un ticket | Vérifie permissions |
| POST | `/api/admin/next` | Appeler suivant | Uniquement tickets des services assignés |
| POST | `/api/admin/serve` | Commencer service | |
| POST | `/api/admin/complete` | Terminer ticket | |
| POST | `/api/admin/no-show` | Marquer absent | |

### Admin (Admin/Supervisor uniquement)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stats` | Statistiques complètes |
| GET | `/api/stats/agents` | Stats agents |
| GET | `/api/admin/agents` | Liste agents |
| POST | `/api/auth/register` | Créer agent |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Paramètres | Description |
|-------|------------|-------------|
| `join:room` | `room: string` | Rejoindre une room générale |
| `join:service` | `serviceType: string` | Rejoindre une salle de service |
| `leave:service` | `serviceType: string` | Quitter une salle de service |
| `agent:online` | `{ agentId, services }` | Agent connecté avec ses services |
| `agent:offline` | `{ agentId, services }` | Agent déconnecté |
| `ticket:subscribe` | `ticketId: string` | S'abonner aux updates d'un ticket |
| `ticket:unsubscribe` | `ticketId: string` | Se désabonner |

### Server → Client
| Event | Données | Rooms ciblées |
|-------|---------|---------------|
| `ticket:created` | `ticket` | `all`, `service:{type}` |
| `ticket:updated` | `ticket` | `all`, `service:{type}`, `ticket:{id}` |
| `ticket:called` | `{ ticket, agent }` | `all`, `service:{type}` |
| `queue:updated` | `queueData` | `all`, `service:{type}` |
| `agent:status` | `{ agentId, status }` | `all` |
| `stats:updated` | `stats` | `admin` |

---

## 📁 Structure du Projet

```
smart-queue/
├── server/                    # Backend Node.js + Express
│   ├── config/               # Configuration (DB, JWT, env)
│   ├── controllers/          # Contrôleurs (logique métier)
│   │   ├── ticket.controller.js    # CRUD tickets + validation
│   │   ├── admin.controller.js     # Gestion file d'attente
│   │   ├── auth.controller.js      # Authentification
│   │   └── stats.controller.js     # Statistiques
│   ├── middleware/           # Middlewares de sécurité
│   │   └── auth.middleware.js      # JWT + permissions services
│   ├── models/               # Modèles Mongoose
│   │   ├── Agent.js               # Agents avec services
│   │   └── Ticket.js              # Tickets
│   ├── routes/               # Routes API REST
│   ├── services/             # Services métier
│   │   └── socket.service.js      # Socket.io + salles services
│   ├── scripts/              # Scripts utilitaires
│   │   └── seed.js               # Seed agents avec services
│   ├── .env.example          # Template variables d'environnement
│   └── server.js             # Point d'entrée
│
├── client/                    # Frontend Angular 17
│   ├── src/
│   │   ├── app/
│   │   │   ├── guards/           # Guards (auth, admin)
│   │   │   ├── interceptors/     # HTTP interceptors (JWT)
│   │   │   ├── models/           # Interfaces TypeScript
│   │   │   ├── pages/            # Composants pages
│   │   │   │   ├── agent-console/      # Console agent (filtrage services)
│   │   │   │   ├── admin-dashboard/    # Dashboard admin
│   │   │   │   ├── create-ticket/      # Création tickets
│   │   │   │   ├── queue-display/      # Affichage public
│   │   │   │   ├── ticket-status/      # Statut ticket client
│   │   │   │   └── login/              # Connexion
│   │   │   └── services/         # Services Angular
│   │   │       ├── socket.service.ts   # Socket.io client + salles
│   │   │       ├── auth.service.ts     # Authentification
│   │   │       ├── ticket.service.ts   # API tickets
│   │   │       └── admin.service.ts    # API admin
│   │   └── environments/     # Configuration environnement
│   └── angular.json          # Config Angular
│
├── docker-compose.yml         # Configuration Docker
├── start.ps1                  # Script de démarrage Docker
├── GUIDE_SIMPLE.md            # 📚 Guide complet
└── README.md                  # Ce fichier
```

---

## 🛠️ Scripts Disponibles

### Backend (server/)
```bash
npm run dev          # Démarrage développement avec nodemon
npm start            # Démarrage production
npm run seed         # Initialiser agents avec services
```

### Frontend (client/)
```bash
npm start            # ng serve sur http://localhost:4200
npm run build        # Build production
npm run build:prod   # Build optimisé
```

---

## 🐛 Debugging

### Logs serveur
Les logs incluent des emojis pour identification rapide:
- ✅ : Succès
- ❌ : Erreur
- 📤 : Émission Socket.io
- 📩 : Réception Socket.io
- 🔌 : Connexion/Déconnexion
- 📍 : Join room/service

### Console navigateur
Ouvrir la console développeur (F12) pour voir:
- Événements Socket.io
- Requêtes HTTP
- Erreurs JavaScript

---

## 📦 Variables d'Environnement

Le fichier `server/.env` est déjà configuré pour le développement local:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smartqueue
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:4200,http://localhost:3000,http://localhost
```

Pour Docker, les variables sont définies dans `docker-compose.yml`.

---

## 📚 Documentation Complète

Pour plus de détails, consultez **[GUIDE_SIMPLE.md](GUIDE_SIMPLE.md)** qui contient:
- Guide complet Docker et développement local
- Comparaison des modes
- Résolution des problèmes courants
- Commandes utiles

---

## 🐛 Problèmes Courants

### Port déjà utilisé
```bash
# Trouver le processus
netstat -ano | findstr :5000

# Tuer le processus
taskkill /PID <PID> /F
```

### MongoDB non connecté (Local)
```bash
# Vérifier MongoDB
mongosh

# Démarrer MongoDB
net start MongoDB
```

### Erreur CORS
Vérifier que `CLIENT_URL` dans `.env` ou `docker-compose.yml` contient l'URL du frontend.

---

## 🚀 Déploiement Production

### Avec Docker

```bash
# Démarrer
docker-compose up -d

# Initialiser la DB
docker exec smartqueue-backend npm run seed

# Logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Ports en Production

Modifier `docker-compose.yml` pour changer les ports:

```yaml
frontend:
  ports:
    - "80:80"  # Port 80 au lieu de 3000
```

---

## 🎨 Pages de l'Application

- `/` - Page d'accueil avec file d'attente
- `/create-ticket` - Créer un nouveau ticket
- `/ticket-status` - Suivre son ticket
- `/login` - Connexion agent/admin
- `/agent` - Console agent
- `/admin` - Tableau de bord admin
- `/display` - Affichage public (écran)

---

## 📄 Licence

MIT

---

