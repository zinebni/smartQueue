# 🐛 BUG FIX - Filtrage par service

## Problème identifié

**Symptôme** : Agent2 (qui devrait voir uniquement `loan` et `consultation`) voyait **TOUS** les tickets (loan, general, consultation, etc.)

**Cause** : Les routes `GET /api/tickets` et `GET /api/tickets/:id` n'utilisaient **PAS** le middleware `protect` pour authentifier l'agent. Le code de filtrage dans le controller attendait `req.agent` mais celui-ci n'était jamais défini.

---

## Solution appliquée

### Fichier modifié : `server/routes/ticket.routes.js`

**AVANT** :
```javascript
// Pas d'authentification = req.agent undefined
router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicketById);
```

**APRÈS** :
```javascript
// Authentification obligatoire = req.agent défini
router.get('/', protect, ticketController.getTickets);
router.get('/:id', protect, ticketController.getTicketById);
```

---

## Impact du correctif

### ✅ Ce qui fonctionne maintenant :

1. **Filtrage automatique par service**
   - Agent2 (loan, consultation) voit UNIQUEMENT les tickets `loan` et `consultation`
   - Agent1 (account, general) voit UNIQUEMENT les tickets `account` et `general`
   - Agent3 (registration, payment) voit UNIQUEMENT les tickets `registration` et `payment`

2. **Sécurité renforcée**
   - Impossible de récupérer des tickets sans être authentifié
   - Le backend vérifie automatiquement les permissions

3. **Code du controller s'exécute correctement**
   ```javascript
   // Ce code s'exécute maintenant car req.agent existe
   if (req.agent && req.agent.role === 'agent') {
     filter.serviceType = { $in: req.agent.services };
   }
   ```

---

## Pour tester le correctif

### 1. Redémarrer le serveur
```bash
cd server
npm run dev
```

### 2. Test Agent2

1. Se connecter avec **agent2 / agent123**
2. Créer les tickets suivants :
   - Ticket A : Service "Prêt" (loan) → Agent2 DOIT le voir ✅
   - Ticket B : Service "Consultation" (consultation) → Agent2 DOIT le voir ✅
   - Ticket C : Service "Compte" (account) → Agent2 NE DOIT PAS le voir ❌
   - Ticket D : Service "Général" (general) → Agent2 NE DOIT PAS le voir ❌

3. Vérifier dans la console agent :
   - **Résultat attendu** : Seulement les tickets A et B apparaissent
   - **Logs serveur** : 
   ```
   🔍 Agent agent2 searching for tickets with query: 
   { status: 'waiting', serviceType: { '$in': [ 'loan', 'consultation' ] } }
   ```

### 3. Test Agent1

1. Se connecter avec **agent1 / agent123**
2. Les tickets C et D (account, general) doivent apparaître
3. Les tickets A et B (loan, consultation) NE doivent PAS apparaître

---

## Routes mises à jour

| Route | Avant | Après | Raison |
|-------|-------|-------|--------|
| `POST /api/tickets` | Public | Public | ✅ Création par kiosques/clients |
| `GET /api/tickets` | Public | **Protégé** | 🔒 Filtrage par service |
| `GET /api/tickets/:id` | Public | **Protégé** | 🔒 Vérification permissions |
| `GET /api/tickets/number/:num` | Public | Public | ✅ Consultation statut client |
| `POST /api/tickets/:id/checkin` | Public | Public | ✅ Check-in kiosque |
| `POST /api/tickets/:id/cancel` | Public | **Protégé** | 🔒 Agents seulement |

---

## Vérification dans les logs

### Logs serveur attendus :
```
🔍 Agent agent2 searching for tickets with query: { status: 'waiting', serviceType: { '$in': [ 'loan', 'consultation' ] } }
📋 Loaded 2 tickets for agent services
```

### Logs console navigateur (F12) :
```
📋 Loaded 2 waiting tickets for my services
```

---

## Résumé

**Problème** : Filtrage ne fonctionnait pas  
**Cause** : Manque de middleware `protect` sur les routes  
**Solution** : Ajout du middleware sur les routes nécessitant le filtrage  
**Résultat** : ✅ Filtrage par service opérationnel  

---

**Date du correctif** : 14 décembre 2025  
**Impact** : Critique - Sécurité et fonctionnalité principale  
**Action requise** : Redémarrer le serveur backend
