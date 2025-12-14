# 📋 Smart Queue - Guide de test et validation

## 🎯 Objectif
Ce guide vous permet de tester toutes les améliorations implémentées dans le projet Smart Queue.

---

## 🚀 Configuration initiale

### 1. Installation des dépendances

```bash
# Backend
cd server
npm install

# Frontend (dans un autre terminal)
cd client
npm install
```

### 2. Configuration de l'environnement

Créez un fichier `.env` dans le dossier `server/`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartqueue
JWT_SECRET=votre_secret_jwt_tres_securise_ici
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:4200
```

### 3. Initialisation de la base de données

```bash
cd server
npm run seed
```

Vous devriez voir:
```
✅ Connected to MongoDB
🗑️  Cleared existing agents
✅ Created agent: admin (admin) - Services: account, loan, general, registration, consultation, payment
✅ Created agent: agent1 (agent) - Services: account, general
✅ Created agent: agent2 (agent) - Services: loan, consultation
✅ Created agent: agent3 (agent) - Services: registration, payment
✅ Created agent: agent4 (agent) - Services: general, consultation
✅ Created agent: supervisor (supervisor) - Services: account, loan, general, registration, consultation, payment
```

---

## 🧪 Scénarios de test

### ✅ Scénario 1: Filtrage par service - Agent spécialisé

**Agent testé:** agent1 (services: account, general)

1. **Connexion**
   ```
   - Ouvrir http://localhost:4200/login
   - Username: agent1
   - Password: agent123
   - Cliquer sur "Se connecter"
   ```

2. **Vérifier l'affichage**
   ```
   - La console agent doit s'afficher
   - Vérifier que les services affichés sont "account" et "general"
   ```

3. **Créer des tickets de test**
   - Ouvrir un autre onglet sur http://localhost:4200/create-ticket
   - Créer les tickets suivants:
     - Ticket A: Service "Compte" (account) → agent1 DOIT le voir
     - Ticket B: Service "Général" (general) → agent1 DOIT le voir
     - Ticket C: Service "Prêt" (loan) → agent1 NE DOIT PAS le voir
     - Ticket D: Service "Consultation" (consultation) → agent1 NE DOIT PAS le voir

4. **Vérifier le filtrage**
   ```
   - Retourner sur la console agent (agent1)
   - Dans la file d'attente, vérifier que seuls les tickets A et B apparaissent
   - Les tickets C et D ne doivent PAS être visibles
   ```

5. **Tester la prise de ticket**
   ```
   - Cliquer sur "Appeler suivant"
   - Le système doit appeler le ticket A ou B (jamais C ou D)
   - Vérifier le message si aucun ticket n'est disponible pour vos services
   ```

**✅ Résultat attendu:** Agent1 ne voit et ne peut prendre que les tickets de type "account" et "general"

---

### ✅ Scénario 2: Services partagés entre agents

**Agents testés:** agent2 et agent4

1. **Ouvrir deux navigateurs/fenêtres**
   - Navigateur 1: Connexion avec agent2 (services: loan, consultation)
   - Navigateur 2: Connexion avec agent4 (services: general, consultation)

2. **Créer des tickets de test**
   - Ticket E: Service "Consultation" (consultation)
   - Ticket F: Service "Prêt" (loan)
   - Ticket G: Service "Général" (general)

3. **Vérifier la visibilité**
   - Agent2 doit voir les tickets E et F
   - Agent4 doit voir les tickets E et G
   - Les deux agents voient le ticket E (service partagé)

4. **Test de concurrence**
   ```
   - Agent2 appelle le ticket E
   - Le ticket E disparaît de la file de agent4
   - Agent4 ne peut plus prendre ce ticket
   ```

**✅ Résultat attendu:** Les agents peuvent partager des tickets du même service, mais seul le premier qui l'appelle peut le prendre

---

### ✅ Scénario 3: Permissions Admin/Supervisor

**Agent testé:** admin ou supervisor

1. **Connexion admin**
   ```
   - Username: admin
   - Password: admin123
   ```

2. **Vérifier l'accès complet**
   ```
   - Admin/Supervisor voit TOUS les tickets (tous services)
   - Peut appeler n'importe quel ticket
   - Peut voir les statistiques de tous les services
   ```

3. **Dashboard admin**
   ```
   - Accéder à http://localhost:4200/admin-dashboard
   - Vérifier que toutes les statistiques sont visibles
   - Vérifier l'accès à tous les services
   ```

**✅ Résultat attendu:** Admin et Supervisor ont un accès complet à tous les services

---

### ✅ Scénario 4: Sécurité et validations

#### 4.1 Test de création de ticket invalide

**Via l'interface:**
1. Aller sur http://localhost:4200/create-ticket
2. Essayer de créer un ticket sans sélectionner de service
3. **Résultat attendu:** Message d'erreur "Service type is required"

**Via API (Postman/cURL):**
```bash
curl -X POST http://localhost:5000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"serviceType": "invalid_service"}'
```
**Résultat attendu:** Erreur 400 avec message "Invalid service type"

#### 4.2 Test d'accès non autorisé

1. Se connecter avec agent1
2. Ouvrir la console développeur (F12)
3. Dans l'onglet Network, observer les requêtes
4. Essayer manuellement via API:

```bash
# Récupérer le token JWT de agent1 depuis localStorage
# Essayer d'appeler un ticket de type "loan" (non autorisé pour agent1)

curl -X POST http://localhost:5000/api/admin/call-next \
  -H "Authorization: Bearer <AGENT1_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"serviceType": "loan"}'
```

**Résultat attendu:** Erreur 403 avec message "You are not authorized to handle 'loan' service"

#### 4.3 Test de token expiré

1. Se connecter
2. Attendre l'expiration du token (ou modifier JWT_EXPIRE à 1s pour tester)
3. Essayer d'effectuer une action
4. **Résultat attendu:** Message "Token has expired. Please login again."

---

### ✅ Scénario 5: Workflow complet d'un ticket

1. **Créer un ticket**
   ```
   - Service: "Compte" (account)
   - Nom client: "Jean Dupont"
   - Téléphone: "0612345678"
   - Note le numéro de ticket généré (ex: A001)
   ```

2. **Consulter le statut (page publique)**
   ```
   - Aller sur http://localhost:4200/ticket-status
   - Entrer le numéro de ticket (A001)
   - Vérifier le statut "En attente"
   - Vérifier la position dans la file
   ```

3. **Agent appelle le ticket**
   ```
   - Se connecter avec agent1
   - Cliquer sur "Appeler suivant"
   - Le ticket A001 doit être appelé
   - Statut passe à "Appelé"
   ```

4. **Commencer le service**
   ```
   - Cliquer sur "Commencer"
   - Statut passe à "En cours de service"
   ```

5. **Terminer le service**
   ```
   - Cliquer sur "Terminer"
   - Ajouter une note (optionnel)
   - Statut passe à "Complété"
   - Le ticket disparaît de la console agent
   ```

6. **Vérifier les statistiques**
   ```
   - Le compteur "Servis aujourd'hui" doit augmenter
   - Le temps de service moyen doit être calculé
   ```

**✅ Résultat attendu:** Workflow complet sans erreur avec toutes les transitions d'état

---

### ✅ Scénario 6: Socket.io en temps réel

**Test de synchronisation temps réel:**

1. **Ouvrir plusieurs fenêtres**
   - Fenêtre 1: Console agent (agent1)
   - Fenêtre 2: Affichage public (http://localhost:4200/queue-display)
   - Fenêtre 3: Création de ticket (http://localhost:4200/create-ticket)

2. **Créer un ticket dans la fenêtre 3**
   ```
   - Service: "Compte" (account)
   - Créer le ticket
   ```

3. **Vérifier la synchronisation**
   ```
   - Le ticket doit apparaître IMMÉDIATEMENT dans:
     * La console agent (fenêtre 1)
     * L'affichage public (fenêtre 2)
   - Sans rafraîchir la page
   ```

4. **Appeler un ticket depuis la console agent**
   ```
   - Le statut doit se mettre à jour en temps réel sur l'affichage public
   - Le numéro de ticket doit s'afficher sur l'écran public
   ```

**✅ Résultat attendu:** Toutes les mises à jour sont synchronisées en temps réel sans rafraîchissement

---

## 🔍 Vérification des logs

### Backend (serveur Node.js)

Pendant les tests, vérifier la console serveur:

```
✅ Logs attendus lors de la connexion d'un agent:
🔌 Client connected: <socket_id>
📍 Socket <socket_id> joined room: agents
📍 Agent <agent_id> joined service room: service:account
📍 Agent <agent_id> joined service room: service:general
✅ Agent <agent_id> is now online

✅ Logs lors de la création d'un ticket:
✅ Ticket created: A001 for service: account
📤 Emitted ticket:created - A001 (service: account)

✅ Logs lors de l'appel d'un ticket:
🔍 Agent agent1 searching for tickets with query: { status: 'waiting', serviceType: { '$in': [ 'account', 'general' ] } }
✅ Ticket called: A001 by agent agent1
📤 Emitted ticket:called - A001 to counter 1
```

### Frontend (console navigateur)

Ouvrir la console développeur (F12) et vérifier:

```
✅ Connexion Socket.io:
🔌 Socket connected
✅ Agent agent1 online with services: ['account', 'general']
📍 Joined service: account
📍 Joined service: general

✅ Réception des événements:
📩 Ticket created: A001
📩 New ticket for my service: A001
📋 Loaded 3 waiting tickets for my services

✅ Actions agent:
✅ Called ticket: A001
✅ Started serving ticket: A001
✅ Ticket completed
```

---

## ❌ Tests d'erreurs

### Test 1: Agent sans service assigné
```
- Modifier manuellement un agent dans MongoDB pour enlever ses services
- Essayer de se connecter
- Résultat attendu: Message "No services assigned to this agent"
```

### Test 2: Ticket déjà en cours
```
- Agent1 a un ticket en cours
- Essayer d'appeler un autre ticket
- Résultat attendu: "Please complete current ticket before calling next"
```

### Test 3: Annulation de ticket déjà complété
```
- Essayer d'annuler un ticket avec statut "completed"
- Résultat attendu: "Cannot cancel a completed ticket"
```

---

## 📊 Validation finale

### Checklist de validation:

- [ ] Tous les agents peuvent se connecter
- [ ] Chaque agent voit uniquement les tickets de ses services
- [ ] Les agents ne peuvent pas prendre de tickets d'autres services
- [ ] Les services partagés fonctionnent correctement
- [ ] Admin/Supervisor ont accès à tous les services
- [ ] Les événements Socket.io sont synchronisés en temps réel
- [ ] Toutes les validations côté serveur fonctionnent
- [ ] Les messages d'erreur sont clairs et informatifs
- [ ] Les logs sont détaillés et utiles pour le debugging
- [ ] Le workflow complet d'un ticket fonctionne sans erreur
- [ ] Les statistiques sont calculées correctement

---

## 🐛 Debugging

### Si un problème survient:

1. **Vérifier les logs serveur**
   - Chercher les messages d'erreur (emoji ❌)
   - Vérifier les requêtes HTTP et leur statut

2. **Vérifier la console navigateur**
   - Onglet Console: erreurs JavaScript
   - Onglet Network: requêtes HTTP échouées
   - Vérifier que Socket.io est connecté

3. **Vérifier MongoDB**
   ```bash
   # Se connecter à MongoDB
   mongosh
   use smartqueue
   db.agents.find().pretty()  # Vérifier les agents
   db.tickets.find().pretty() # Vérifier les tickets
   ```

4. **Réinitialiser les données**
   ```bash
   cd server
   npm run seed
   ```

---

## 🎉 Conclusion

Si tous les scénarios passent avec succès, votre installation de Smart Queue est complète et fonctionnelle avec toutes les améliorations!

Pour toute question ou problème, consultez le fichier `IMPROVEMENTS.md` pour plus de détails sur l'architecture et les améliorations.
