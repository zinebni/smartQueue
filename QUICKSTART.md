# ⚡ QUICK START - Smart Queue

## 🚀 Démarrage en 5 minutes

### Étape 1: Cloner et installer (2 min)

```bash
# Backend
cd server
npm install

# Frontend (nouveau terminal)
cd client
npm install
```

### Étape 2: Configuration (1 min)

```bash
# Dans le dossier server/
cp .env.example .env
```

**Éditez `.env` si nécessaire** (MongoDB local par défaut)

### Étape 3: Base de données (1 min)

**Option A - MongoDB local:**
```bash
# Assurez-vous que MongoDB est démarré
# Puis :
cd server
npm run seed
```

**Option B - MongoDB avec Docker:**
```bash
docker-compose -f docker-compose.dev.yml up -d
cd server
npm run seed
```

### Étape 4: Démarrer (1 min)

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

### Étape 5: Tester ! (30 sec)

1. Ouvrez http://localhost:4200
2. Connectez-vous avec **agent1 / agent123**
3. Ouvrez http://localhost:4200/create-ticket dans un autre onglet
4. Créez un ticket de type "Compte" (account)
5. Retournez à la console agent → le ticket apparaît !

---

## ✅ Vérification rapide

### Le serveur est démarré si vous voyez :
```
🚀 ================================
🚀 Smart Queue API Server
🚀 Environment: development
🚀 Port: 5000
🚀 API: http://localhost:5000/api
🚀 ================================
✅ Socket.io initialized
```

### Le frontend est démarré si vous voyez :
```
** Angular Live Development Server is listening on localhost:4200 **
```

---

## 🎯 Test rapide du filtrage

### Test 1: Agent spécialisé

1. **Connexion** : agent1 / agent123 (services: account, general)
2. **Créer tickets** :
   - Ticket type "Compte" (account) → ✅ Agent1 le voit
   - Ticket type "Prêt" (loan) → ❌ Agent1 ne le voit PAS
3. **Résultat** : Le filtrage fonctionne !

### Test 2: Services partagés

1. **Ouvrir 2 navigateurs** :
   - Navigateur 1: agent2 / agent123 (loan, consultation)
   - Navigateur 2: agent4 / agent123 (general, consultation)
2. **Créer ticket** type "Consultation" (consultation)
3. **Résultat** : Les 2 agents voient le ticket !

---

## 🎫 Comptes de test

| Username | Password | Services |
|----------|----------|----------|
| admin | admin123 | Tous |
| agent1 | agent123 | account, general |
| agent2 | agent123 | loan, consultation |
| agent3 | agent123 | registration, payment |
| agent4 | agent123 | general, consultation |

---

## 🔍 Logs à surveiller

### Console serveur (logs avec emojis) :
```
✅ Agent agent1 online with services: ['account', 'general']
📍 Agent agent1 joined service room: service:account
📤 Emitted ticket:created - A001 (service: account)
```

### Console navigateur (F12) :
```
🔌 Socket connected
✅ Agent agent1 online with services: ['account', 'general']
📩 Ticket created: A001
```

---

## ❌ Problèmes courants

### "Cannot connect to MongoDB"
```bash
# Vérifier que MongoDB est démarré :
# Avec Docker :
docker-compose -f docker-compose.dev.yml up -d

# Sans Docker :
# Démarrez MongoDB selon votre installation
```

### "Port 5000 already in use"
```bash
# Changer le port dans server/.env :
PORT=5001
```

### "Port 4200 already in use"
```bash
# Changer le port Angular :
ng serve --port 4201
```

---

## 📚 Documentation complète

- **IMPROVEMENTS.md** : Toutes les améliorations en détail
- **TESTING_GUIDE.md** : Guide de test complet
- **README.md** : Documentation API et déploiement
- **CHANGELOG.md** : Historique des modifications

---

## 🎉 C'est tout !

Votre Smart Queue est prêt à l'emploi avec :
- ✅ Filtrage par service fonctionnel
- ✅ Sécurité renforcée
- ✅ Socket.io optimisé
- ✅ Documentation complète

**Bon développement ! 🚀**
