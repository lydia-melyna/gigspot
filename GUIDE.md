# 🎵 GIGSPOT — Guide complet (Node.js + Express + PostgreSQL)

> Projet microservices remplacé de Java/Maven → **Node.js + Express + PostgreSQL**
> Interfaces frontend 100% identiques. Kubernetes & Docker inchangés dans la logique.

---

## 📁 Structure du projet

```
gigspot/
├── auth-service/          ← Microservice authentification (Node.js)
│   ├── src/index.js
│   ├── package.json
│   ├── .env
│   └── Dockerfile
├── event-service/         ← Microservice concerts & réservations (Node.js)
│   ├── src/index.js
│   ├── package.json
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── index.html         ← Page connexion/inscription
│   └── events.html        ← Page concerts & billets
├── k8s/
│   ├── secrets.yaml
│   ├── auth-db-deployment.yaml
│   ├── event-db-deployment.yaml
│   ├── auth-deployment.yaml
│   ├── event-deployment.yaml
│   ├── ingress.yaml
│   └── rbac.yaml
└── docker-compose.yml
```

---

## ✅ Prérequis à installer

| Outil | Téléchargement | Vérification |
|---|---|---|
| Node.js 20+ | https://nodejs.org | `node -v` |
| Docker Desktop | https://www.docker.com/products/docker-desktop | `docker -v` |
| Minikube | https://minikube.sigs.k8s.io/docs/start | `minikube version` |
| kubectl | https://kubernetes.io/docs/tasks/tools | `kubectl version` |

---

## 🚀 ÉTAPE 1 — Lancer en local (sans Docker)

### 1.1 Installer PostgreSQL localement

Télécharger depuis https://www.postgresql.org/download/
- Lors de l'installation, noter le mot de passe (mettre `postgres`)
- Port par défaut : **5432**

Créer les deux bases de données (ouvrir **pgAdmin** ou **psql**) :

```sql
CREATE DATABASE authdb;
CREATE DATABASE eventdb;
```

Ou en ligne de commande :
```cmd
psql -U postgres -c "CREATE DATABASE authdb;"
psql -U postgres -c "CREATE DATABASE eventdb;"
```

### 1.2 Lancer auth-service

```cmd
cd gigspot\auth-service
npm install
npm start
```

✅ Message attendu : `🎤 auth-service démarré sur le port 8081`

Tester dans le navigateur : http://localhost:8081/auth/health
→ Réponse : `{"status":"UP","service":"gigspot-auth-service"}`

### 1.3 Lancer event-service (dans un 2e terminal)

```cmd
cd gigspot\event-service
npm install
npm start
```

✅ Message attendu : `🎵 event-service démarré sur le port 8082`

Tester : http://localhost:8082/events/health

### 1.4 Ouvrir le frontend

Double-cliquer sur `frontend/index.html` dans l'explorateur de fichiers.
Ou ouvrir avec VS Code → Live Server.

> ⚠️ Les fichiers `.env` dans chaque service contiennent déjà la bonne config pour du local.

---

## 🐳 ÉTAPE 2 — Docker (10/20)

### 2.1 Lancer tout avec Docker Compose

```cmd
cd gigspot
docker-compose up --build
```

Cela démarre automatiquement :
- `auth-db` (PostgreSQL pour auth)
- `event-db` (PostgreSQL pour event)
- `auth-service` sur le port 8081
- `event-service` sur le port 8082

Vérifier que tout tourne :
```cmd
docker ps
```

Tester :
- http://localhost:8081/auth/health
- http://localhost:8082/events/health

Arrêter :
```cmd
docker-compose down
```

Arrêter et supprimer les données :
```cmd
docker-compose down -v
```

### 2.2 Construire et publier les images sur Docker Hub

Se connecter à Docker Hub :
```cmd
docker login
```
Entrer votre **username** et **mot de passe** Docker Hub.

Remplacer `pumpkinlyd` par votre vrai nom d'utilisateur Docker Hub dans toutes les commandes ci-dessous.

**Construire les images :**
```cmd
cd gigspot\auth-service
docker build -t pumpkinlyd/gigspot-auth:latest .

cd ..\event-service
docker build -t pumpkinlyd/gigspot-event:latest .
```

**Pousser sur Docker Hub :**
```cmd
docker push pumpkinlyd/gigspot-auth:latest
docker push pumpkinlyd/gigspot-event:latest
```

✅ Vos images sont maintenant visibles sur https://hub.docker.com

---

## ☸️ ÉTAPE 3 — Kubernetes avec Minikube (12-14/20)

### 3.1 Démarrer Minikube

```cmd
minikube start
```

Vérifier :
```cmd
kubectl get nodes
```
→ Doit afficher un nœud avec le statut `Ready`

### 3.2 Activer l'Ingress dans Minikube

```cmd
minikube addons enable ingress
```

Vérifier que le contrôleur est bien démarré (attendre ~1 minute) :
```cmd
kubectl get pods -n ingress-nginx
```
→ Le pod `ingress-nginx-controller-...` doit être `Running`

### 3.3 Mettre à jour les images dans les fichiers K8s

Dans `k8s/auth-deployment.yaml` et `k8s/event-deployment.yaml`, remplacer `pumpkinlyd` par votre vrai nom Docker Hub :

```yaml
image: pumpkinlyd/gigspot-auth:latest
image: pumpkinlyd/gigspot-event:latest
```

### 3.4 Déployer dans l'ordre

```cmd
cd gigspot

kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/auth-db-deployment.yaml
kubectl apply -f k8s/event-db-deployment.yaml
```

Attendre que les bases soient prêtes :
```cmd
kubectl get pods
```
→ `auth-db-...` et `event-db-...` doivent être `Running`

```cmd
kubectl apply -f k8s/auth-deployment.yaml
kubectl apply -f k8s/event-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### 3.5 Vérifier tous les pods

```cmd
kubectl get pods
```

Tous doivent être `Running`. Si un pod est en erreur :
```cmd
kubectl describe pod NOM_DU_POD
kubectl logs NOM_DU_POD
```

### 3.6 Vérifier les services

```cmd
kubectl get services
kubectl get ingress
```

### 3.7 Obtenir l'IP de Minikube

```cmd
minikube ip
```

Exemple de réponse : `192.168.49.2`

### 3.8 Tester les endpoints via Ingress

```cmd
curl http://192.168.49.2/api/auth/auth/health
curl http://192.168.49.2/api/events/events/health
```

### 3.9 Adapter le frontend pour Kubernetes

Ouvrir `frontend/index.html` et modifier la ligne :
```javascript
const AUTH_API = 'http://localhost:8081';
```
→
```javascript
const AUTH_API = 'http://192.168.49.2/api/auth';
```

Ouvrir `frontend/events.html` et modifier :
```javascript
const EVENT_API = 'http://localhost:8082';
```
→
```javascript
const EVENT_API = 'http://192.168.49.2/api/events';
```

Remplacer `192.168.49.2` par la vraie IP de votre Minikube.

---

## 🔍 Commandes utiles Kubernetes

```cmd
# Voir tous les pods
kubectl get pods

# Voir les logs d'un service
kubectl logs -l app=auth-service
kubectl logs -l app=event-service

# Voir les détails d'un pod
kubectl describe pod NOM_DU_POD

# Redémarrer un déploiement
kubectl rollout restart deployment/auth-service
kubectl rollout restart deployment/event-service

# Supprimer tout
kubectl delete -f k8s/

# Dashboard Minikube (interface graphique)
minikube dashboard
```

---

## 🧪 Tester l'API manuellement

### Inscription
```cmd
curl -X POST http://localhost:8081/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"test@test.com\",\"password\":\"password123\"}"
```

### Connexion
```cmd
curl -X POST http://localhost:8081/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"password\":\"password123\"}"
```
→ Copier le `token` dans la réponse

### Voir les concerts
```cmd
curl http://localhost:8082/events
```

### Réserver (remplacer TOKEN)
```cmd
curl -X POST http://localhost:8082/events/1/book ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"quantity\":2}"
```

### Voir ses réservations
```cmd
curl http://localhost:8082/events/bookings/me ^
  -H "Authorization: Bearer TOKEN"
```

---

## 🌐 API Reference

### Auth Service (port 8081)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/auth/health` | Non | Health check |
| POST | `/auth/register` | Non | Créer un compte |
| POST | `/auth/login` | Non | Se connecter |
| GET | `/auth/validate` | Bearer | Valider un token |

### Event Service (port 8082)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/events/health` | Non | Health check |
| GET | `/events` | Non | Liste des concerts |
| GET | `/events/:id` | Non | Détail d'un concert |
| POST | `/events/:id/book` | Bearer | Réserver des places |
| GET | `/events/bookings/me` | Bearer | Mes réservations |
| DELETE | `/events/bookings/:id` | Bearer | Annuler une réservation |

---

## 🛠️ Dépannage

### "Cannot connect to PostgreSQL"
Vérifier que PostgreSQL tourne et que les bases `authdb` / `eventdb` existent.
```cmd
psql -U postgres -l
```

### "Token invalide" sur event-service
Le `JWT_SECRET` doit être **identique** dans les `.env` des deux services.

### Port déjà utilisé
```cmd
netstat -ano | findstr :8081
taskkill /PID NUMERO_PID /F
```

### Pod Kubernetes en CrashLoopBackOff
```cmd
kubectl logs NOM_DU_POD --previous
```
→ Vérifier que l'image Docker Hub est bien publique et que le nom est correct.

### Ingress ne répond pas
```cmd
minikube addons enable ingress
kubectl get pods -n ingress-nginx
```
Attendre que le pod soit `Running` avant de tester.

---

## 📦 Récapitulatif des technologies

| Composant | Technologie |
|---|---|
| Auth Service | Node.js 20 + Express + bcryptjs + jsonwebtoken |
| Event Service | Node.js 20 + Express + jsonwebtoken |
| Base de données | PostgreSQL 16 |
| Conteneurisation | Docker + Docker Compose |
| Orchestration | Kubernetes (Minikube) |
| Gateway | Kubernetes Ingress (nginx) |
| Sécurité | RBAC Kubernetes + JWT |
| Frontend | HTML/CSS/JS vanilla (identique à l'original) |
