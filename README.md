# 🎵 GigSpot — Plateforme de réservation de concerts

GigSpot est une application web de réservation de concerts construite sur une architecture microservices. Elle permet aux utilisateurs de s'inscrire, de parcourir les concerts disponibles et de réserver des billets en ligne.

---

## 🏗️ Architecture

Le projet est composé de plusieurs services indépendants qui communiquent entre eux :

```
Navigateur
    │
    ▼
Frontend Nginx (port 80)  ←── Gateway + Proxy
    │
    ├──► Auth Service (port 8081) ──► PostgreSQL authdb
    │
    └──► Event Service (port 8082) ──► PostgreSQL eventdb
```

| Service | Technologie | Rôle |
|---|---|---|
| Frontend | Nginx + HTML/CSS/JS | Interface utilisateur + proxy gateway |
| Auth Service | Node.js + Express | Inscription, connexion, JWT |
| Event Service | Node.js + Express | Concerts, réservations |
| Base auth | PostgreSQL 16 | Stockage utilisateurs |
| Base event | PostgreSQL 16 | Stockage concerts & réservations |

---

## ✅ Prérequis

Un seul outil à installer :

- **Docker Desktop** → https://www.docker.com/products/docker-desktop

Aucun autre logiciel n'est nécessaire (pas de Node.js, pas de PostgreSQL, pas de Maven).

---

## 🚀 Lancer le projet

### Étape 1 — Cloner le repository

```bash
git clone https://github.com/lydia-melyna/gigspot.git
cd gigspot
```

### Étape 2 — Démarrer tous les services

```bash
docker-compose up
```

Docker va automatiquement télécharger toutes les images depuis Docker Hub et démarrer les 5 conteneurs. Attendre que les messages suivants apparaissent :

```
auth-service  | ✅ Table users prête
auth-service  | 🎤 auth-service démarré sur le port 8081
event-service | ✅ Tables events & bookings prêtes
event-service | 🎵 event-service démarré sur le port 8082
```

### Étape 3 — Ouvrir le navigateur

```
http://localhost
```

---

## 🛑 Arrêter le projet

```bash
docker-compose down
```

Pour tout supprimer (conteneurs + données) :

```bash
docker-compose down -v
```

---

## 🧪 Tester l'application

1. Ouvrir **http://localhost**
2. Cliquer sur **Inscription** et créer un compte
3. Se connecter avec les identifiants créés
4. Parcourir les concerts disponibles
5. Réserver des billets sur un concert
6. Consulter ses réservations dans **Mes Billets**
7. Annuler une réservation si besoin

---

## ☸️ Déploiement Kubernetes (Minikube)

Pour un déploiement en cluster Kubernetes :

### Prérequis supplémentaires
- Minikube → https://minikube.sigs.k8s.io/docs/start
- kubectl → https://kubernetes.io/docs/tasks/tools

### Démarrage

```bash
minikube start
minikube addons enable ingress
```

Attendre que l'ingress soit prêt :
```bash
kubectl get pods -n ingress-nginx
```

### Déploiement

```bash
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/auth-db-deployment.yaml
kubectl apply -f k8s/event-db-deployment.yaml
kubectl apply -f k8s/auth-deployment.yaml
kubectl apply -f k8s/event-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

Vérifier que tous les pods sont en cours d'exécution :
```bash
kubectl get pods
```

### Accès

```bash
minikube tunnel
```

Laisser ce terminal ouvert, puis ouvrir **http://127.0.0.1** dans le navigateur.

### Redémarrage après extinction du PC

```bash
minikube start
kubectl get pods        # attendre que tout soit Running
minikube tunnel         # laisser ouvert
```

Puis ouvrir **http://127.0.0.1**.

---

## 🔌 API

### Auth Service — http://localhost:8081

| Méthode | Route | Description |
|---|---|---|
| GET | /auth/health | Vérification du service |
| POST | /auth/register | Créer un compte |
| POST | /auth/login | Se connecter |
| GET | /auth/validate | Valider un token JWT |

### Event Service — http://localhost:8082

| Méthode | Route | Description |
|---|---|---|
| GET | /events/health | Vérification du service |
| GET | /events | Liste des concerts |
| POST | /events/:id/book | Réserver des billets |
| GET | /events/bookings/me | Mes réservations |
| DELETE | /events/bookings/:id | Annuler une réservation |

---

## 🐳 Images Docker Hub

Les images sont disponibles publiquement sur Docker Hub :

- `pumpkinlyd/gigspot-frontend` — Interface utilisateur Nginx
- `pumpkinlyd/gigspot-auth` — Service d'authentification
- `pumpkinlyd/gigspot-event` — Service de gestion des concerts

---

## 🔧 Dépannage

**Les conteneurs ne démarrent pas**
```bash
docker-compose down -v
docker-compose pull
docker-compose up
```

**Un port est déjà utilisé**
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <numero> /F
```

**Voir les logs d'un service**
```bash
docker logs gigspot-auth-service-1
docker logs gigspot-event-service-1
docker logs gigspot-frontend-1
```