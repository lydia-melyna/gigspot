# 🎵 GigSpot — Plateforme de réservation de concerts

Application microservices complète : Node.js + PostgreSQL + Docker + Kubernetes.

## ✅ Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installé et démarré

## 🚀 Lancer le projet (une seule commande)

```cmd
git clone https://github.com/lydia-melyna/gigspot.git
cd gigspot
docker-compose up
```

Puis ouvrir **http://localhost** dans le navigateur.

C'est tout. Docker télécharge automatiquement toutes les images depuis Docker Hub.

## 🛑 Arrêter le projet

```cmd
docker-compose down
```

## 🏗️ Architecture

| Service | Image Docker Hub | Port |
|---|---|---|
| Frontend Nginx | pumpkinlyd/gigspot-frontend | 80 |
| Auth Service | pumpkinlyd/gigspot-auth | 8081 |
| Event Service | pumpkinlyd/gigspot-event | 8082 |
| PostgreSQL Auth | postgres:16-alpine | 5432 |
| PostgreSQL Event | postgres:16-alpine | 5432 |

## ☸️ Lancer avec Kubernetes (Minikube)

```cmd
minikube start
minikube addons enable ingress
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/auth-db-deployment.yaml
kubectl apply -f k8s/event-db-deployment.yaml
kubectl apply -f k8s/auth-deployment.yaml
kubectl apply -f k8s/event-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
minikube tunnel
```

Puis ouvrir **http://127.0.0.1** dans le navigateur.

## 🔁 Redémarrer après extinction du PC (Kubernetes)

```cmd
minikube start
kubectl get pods
minikube tunnel
```

Puis ouvrir **http://127.0.0.1**.