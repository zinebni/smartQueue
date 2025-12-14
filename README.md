# 🎫 Smart Queue - Système de Gestion des Files d'Attente

Système complet de gestion intelligente des files d'attente avec **filtrage par service** pour banques, universités et agences professionnelles.

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

### Option 1: Docker (Recommandé)

```bash
# Cloner et lancer
docker-compose up --build

# Accéder à l'application
# Frontend: http://localhost
# API: http://localhost:5000/api
```

### Option 2: Développement Local

#### Prérequis
- Node.js 18+
- MongoDB 6+ (local ou Docker)
- npm ou yarn

#### 1. Lancer MongoDB (avec Docker)
```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### 2. Backend
```bash
cd server
cp .env.example .env  # Configurer les variables
npm install
npm run seed          # Créer les utilisateurs par défaut avec services
npm run dev           # Lancer en mode développement
```

#### 3. Frontend
```bash
cd client
npm install
npm start             # http://localhost:4200
```

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
├── docker-compose.yml         # Docker production
├── docker-compose.dev.yml     # Docker développement
├── IMPROVEMENTS.md            # 📚 Documentation complète des améliorations
├── TESTING_GUIDE.md           # 🧪 Guide de test
└── README.md                  # Ce fichier
```

---

## 🎯 Améliorations Récentes

### ✅ Système de Filtrage par Service
- Chaque agent est assigné à des services spécifiques
- Filtrage automatique des tickets par service de l'agent
- Les agents ne voient et ne peuvent prendre que les tickets de leurs services
- Admin et superviseur ont accès à tous les services

### ✅ Sécurité Renforcée
- Validation stricte des inputs côté serveur
- Vérification des permissions par service
- Messages d'erreur informatifs mais sécurisés
- Middleware de validation des services

### ✅ Socket.io Optimisé
- Système de salles par service (`service:account`, `service:loan`, etc.)
- Émissions ciblées pour réduire le trafic
- Synchronisation en temps réel par service

### ✅ Code Documenté
- Commentaires détaillés dans tout le code
- Documentation des choix architecturaux
- Logs informatifs pour le debugging

**Pour plus de détails, consultez [IMPROVEMENTS.md](IMPROVEMENTS.md)**

---

## 🧪 Tests

Voir le guide de test complet : [TESTING_GUIDE.md](TESTING_GUIDE.md)

### Tests rapides

```bash
# Test de filtrage par service
1. Se connecter avec agent1 (services: account, general)
2. Créer un ticket "account" → agent1 le voit ✅
3. Créer un ticket "loan" → agent1 ne le voit PAS ✅

# Test de services partagés
1. Se connecter avec agent2 (loan, consultation)
2. Se connecter avec agent4 (general, consultation)
3. Créer ticket "consultation" → les deux agents le voient ✅

# Test de sécurité
1. Essayer via API d'appeler un ticket non autorisé
2. Résultat attendu: Erreur 403 ✅
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

Créer un fichier `.env` dans le dossier `server/`:

```env
# Serveur
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/smartqueue

# JWT
JWT_SECRET=votre_secret_jwt_tres_long_et_securise_ici
JWT_EXPIRE=7d

# Frontend URL (pour CORS)
CLIENT_URL=http://localhost:4200
```

---

## 🚀 Déploiement en Production

### Avec Docker

```bash
# Build et démarrage
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Configuration Nginx (optionnel)

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## 📚 Documentation Complète

- **[IMPROVEMENTS.md](IMPROVEMENTS.md)** : Documentation détaillée de toutes les améliorations
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** : Guide complet de test et validation
- **API Documentation** : Consultez les commentaires dans les controllers

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT.

---

## 👨‍💻 Support

Pour toute question ou problème:
1. Consultez [TESTING_GUIDE.md](TESTING_GUIDE.md) pour le debugging
2. Vérifiez [IMPROVEMENTS.md](IMPROVEMENTS.md) pour l'architecture
3. Consultez les logs serveur et console navigateur

---

**Fait avec ❤️ pour améliorer l'expérience des files d'attente**
├── client/                # Frontend Angular
│   └── src/
│       └── app/
│           ├── guards/    # Guards de route
│           ├── interceptors/
│           ├── models/    # Interfaces TypeScript
│           ├── pages/     # Composants de page
│           └── services/  # Services Angular
├── docker-compose.yml     # Docker production
└── docker-compose.dev.yml # Docker développement
```

## 🎨 Pages de l'Application

- `/` - Page d'accueil avec file d'attente
- `/create-ticket` - Créer un nouveau ticket
- `/ticket-status` - Suivre son ticket
- `/login` - Connexion agent/admin
- `/agent` - Console agent
- `/admin` - Tableau de bord admin
- `/display` - Affichage public (écran)

## 📄 Licence

MIT

