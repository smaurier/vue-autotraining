# 02 — Déploiement (mettre son app en ligne)

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Qu'est-ce qu'un pipeline CI/CD ?
> 2. Ou place-t-on le fichier de configuration GitHub Actions ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. Une série d'étapes automatiques (lint, tests, build, deploy) déclenchées à chaque push
> 2. Dans `.github/workflows/` (ex: `.github/workflows/ci.yml`)
> </details>

---

## 🌍 C'est quoi le déploiement ?

### Explication simple

Le **déploiement**, c'est **mettre ton application sur Internet** pour que les utilisateurs puissent y accéder.

> **Analogie** : Tu as cuisiné un gâteau (ton app) dans ta cuisine (ton ordinateur).
> Le déploiement, c'est **l'amener à la boulangerie** (un serveur) pour que
> les clients puissent l'acheter (y accéder via un navigateur).

### Rappel : développement vs production

| | **Développement** (ton ordi) | **Production** (un serveur) |
|---|---|---|
| **Qui y accède ?** | Toi seul | Tout le monde sur Internet |
| **Adresse** | `localhost:5173` | `www.mon-app.com` |
| **Vitesse** | Pas optimisé | Fichiers compressés, rapides |
| **Erreurs** | Messages détaillés | Messages discrets (sécurité) |
| **Données** | Données de test | Données réelles |

Quand tu fais `pnpm dev`, ton app tourne **uniquement sur ton ordinateur**.
Pour que d'autres personnes la voient, il faut la **déployer sur un serveur**.

---

## 🏠 Les hébergeurs : des "appartements" pour ton app

> **Analogie** : Ton app a besoin d'un endroit pour "habiter" sur Internet.
> Les hébergeurs sont comme des **agences immobilières** qui louent des appartements
> (serveurs) pour ton app.

### Les hébergeurs les plus populaires (et les plus simples)

| Hébergeur | Prix | Idéal pour | Difficulté |
|-----------|------|------------|------------|
| **Vercel** | Gratuit (basique) | Apps Vue/React, projets perso | ⭐ Très facile |
| **Netlify** | Gratuit (basique) | Apps Vue/React, sites statiques | ⭐ Très facile |
| **Render** | Gratuit (basique) | Apps avec backend | ⭐⭐ Facile |
| **OVH / Scaleway** | Payant | Projets professionnels | ⭐⭐⭐ Intermédiaire |
| **AWS / GCP / Azure** | Payant | Grosses entreprises | ⭐⭐⭐⭐⭐ Complexe |

Pour débuter, **Vercel** ou **Netlify** sont parfaits — c'est gratuit et ça prend 5 minutes.

---

## 🚀 Déployer une app Vue (SPA) sur Vercel

### Méthode 1 : Via la ligne de commande

```bash
# On installe l'outil en ligne de commande de Vercel
# -g = "global" (disponible partout sur ton ordi, pas juste dans ce projet)
pnpm add -g vercel

# On lance le déploiement
# Vercel va te poser quelques questions (nom du projet, etc.)
vercel
```

### Méthode 2 : Via le site web (recommandé pour les débutants)

1. Va sur [vercel.com](https://vercel.com) et connecte-toi avec ton compte GitHub
2. Clique sur **"New Project"**
3. Sélectionne ton dépôt GitHub
4. Vercel détecte automatiquement que c'est un projet Vite/Vue
5. Clique sur **"Deploy"**
6. C'est fait ! 🎉 Ton app est en ligne

> **Le bonus** : à chaque `git push`, Vercel re-déploie automatiquement.
> Tu n'as plus rien à faire !

### Déployer sur Netlify (c'est pareil)

1. Va sur [netlify.com](https://netlify.com) et connecte ton compte GitHub
2. Sélectionne ton dépôt
3. Configure :
   - **Build command** : `pnpm build` (la commande pour construire l'app)
   - **Publish directory** : `dist` (le dossier qui contient l'app construite)
4. Clique sur **"Deploy"**

---

## 🐳 Docker — C'est quoi ? (Explication pour débutants)

### Le problème

> "Ça marche sur mon ordinateur !" — Phrase célèbre de tout développeur 😅

Ton app fonctionne sur ton PC, mais quand tu la mets sur un serveur, elle plante.
Pourquoi ? Parce que le serveur à une version différente de Node.js, ou il manque
un outil, ou la configuration est différente.

### La solution : Docker

> **Analogie** : Docker, c'est comme un **conteneur de transport maritime** 🚢.
> Tu mets TOUT ce dont ton app a besoin dans le conteneur :
> - L'app elle-même
> - Node.js (la bonne version)
> - Les dépendances (pnpm, les packages)
> - La configuration
>
> Ensuite, tu peux déposer ce conteneur N'IMPORTE OÙ — il fonctionnera
> exactement de la même manière.

### Le Dockerfile — la recette de ton conteneur

Un **Dockerfile** est une **recette** qui dit à Docker comment construire ton conteneur.

```dockerfile
# ============================================================
# Dockerfile — recette pour créer le conteneur de notre app Vue
# ============================================================

# ── ÉTAPE 1 : Construire l'app ────────────────────────────
# "FROM" = on part d'une image de base (ici : Node.js version 20, version légère "alpine")
# "AS build" = on donne un nom à cette étape pour y faire référence plus tard
FROM node:20-alpine AS build

# Active pnpm (le gestionnaire de paquets)
RUN corepack enable

# Crée un dossier /app dans le conteneur et s'y place
WORKDIR /app

# Copie les fichiers de dépendances EN PREMIER (pour optimiser le cache Docker)
COPY package.json pnpm-lock.yaml ./

# Installe les dépendances
# --frozen-lockfile = utilise les versions exactes du lockfile
RUN pnpm install --frozen-lockfile

# Copie TOUT le reste du projet
COPY . .

# Construit l'app pour la production (crée le dossier "dist/")
RUN pnpm build

# ── ÉTAPE 2 : Servir l'app avec Nginx ─────────────────────
# Nginx = un serveur web léger et rapide (comme Apache, mais plus moderne)
# On repart d'une image propre (plus besoin de Node.js pour servir des fichiers)
FROM nginx:alpine

# Copie les fichiers construits (depuis l'étape "build") dans Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copie notre configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Indique que le conteneur écoute sur le port 80 (HTTP standard)
EXPOSE 80
```

### La configuration Nginx

```nginx
# nginx.conf — configuration du serveur web
# Nginx sert les fichiers statiques (HTML, CSS, JS) de notre app Vue

server {
  # Écoute sur le port 80 (le port HTTP standard)
  listen 80;

  # Le dossier qui contient les fichiers de l'app
  root /usr/share/nginx/html;

  # Le fichier par défaut à servir
  index index.html;

  # Pour TOUTES les URLs...
  location / {
    # Essaie de trouver le fichier demandé
    # Si le fichier n'existe pas → renvoie index.html
    # (C'est nécessaire pour le routeur Vue — toutes les URLs
    #  sont gérées par JavaScript, pas par le serveur)
    try_files $uri $uri/ /index.html;
  }

  # Pour les fichiers dans /assets (CSS, JS, images)...
  location /assets {
    # Dis au navigateur de garder ces fichiers en cache pendant 1 an
    # (les noms de fichiers contiennent un hash, donc si le contenu
    #  change, le nom change aussi → pas de problème de cache)
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### Comment lancer Docker ?

```bash
# Étape 1 : Construire le conteneur (= suivre la recette du Dockerfile)
# -t mon-app = donner un nom ("tag") au conteneur
# . = le Dockerfile est dans le dossier actuel
docker build -t mon-app .

# Étape 2 : Lancer le conteneur
# -p 80:80 = relier le port 80 de ton ordi au port 80 du conteneur
# Après cette commande, ton app est accessible sur http://localhost
docker run -p 80:80 mon-app
```

---

## 🌐 Déployer une app Nuxt 3 (SSR)

> **Rappel** : Nuxt 3 fait du **Server-Side Rendering** (SSR) — le HTML est généré
> sur le serveur, pas dans le navigateur. C'est différent d'une SPA classique.

### Sur Vercel ou Netlify

Bonne nouvelle : Nuxt détecte automatiquement la plateforme ! Il suffit d'ajouter
un paramètre dans la config :

```ts
// nuxt.config.ts — configuration de Nuxt
export default defineNuxtConfig({
  nitro: {
    // Indique à Nuxt qu'on déploie sur Vercel
    // (change en 'netlify' si tu utilises Netlify)
    preset: "vercel",
  },
});
```

### Avec Docker (SSR)

Pour Nuxt en SSR, le Dockerfile est un peu différent car on a besoin de **Node.js
au runtime** (le serveur doit générer le HTML à la volée) :

```dockerfile
# ── ÉTAPE 1 : Construire l'app ────────────────────────────
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ── ÉTAPE 2 : Exécuter l'app ──────────────────────────────
# ⚠️ On garde Node.js ici (contrairement à Vue SPA qui utilise Nginx)
# car Nuxt SSR a besoin de Node.js pour tourner
FROM node:20-alpine
WORKDIR /app

# Copie le dossier .output (= tout ce qu'il faut pour exécuter l'app)
COPY --from=build /app/.output ./

# Le port sur lequel Nuxt écoute
EXPOSE 3000

# "CMD" = la commande lancée quand le conteneur démarre
# On lance le serveur Nuxt avec Node.js
CMD ["node", "server/index.mjs"]
```

---

## 🔐 Les variables d'environnement (secrets et configuration)

### C'est quoi une variable d'environnement ?

> **Analogie** : Ce sont des **réglages secrets** de ton app. Comme un code
> de carte bancaire — l'app en a besoin pour fonctionner, mais tu ne veux pas
> que tout le monde le voie dans ton code source.

Exemples de choses qu'on met dans les variables d'environnement :
- L'URL de l'API backend (`https://api.mon-app.com`)
- Des clés secrètes (API Google Maps, Stripe, etc.)
- Le mode de l'app (développement, staging, production)

### Comment ça marche avec Vite ?

On crée des fichiers `.env` à la racine du projet :

```bash
# .env.staging — configuration pour l'environnement de test
# "staging" = un environnement de pré-production
#   (pour tester avant de mettre en ligne pour les vrais utilisateurs)
VITE_API_URL=https://api.staging.example.com

# .env.production — configuration pour l'environnement de production
# (les vrais utilisateurs voient cette version)
VITE_API_URL=https://api.example.com
```

> **⚠️ Important** : Avec Vite, les variables d'environnement accessibles
> dans le navigateur DOIVENT commencer par `VITE_`. C'est une sécurité pour
> éviter d'exposer des secrets par accident.

```ts
// Comment utiliser une variable d'environnement dans ton code Vue/TypeScript
// import.meta.env = objet qui contient toutes les variables VITE_*
const apiUrl = import.meta.env.VITE_API_URL;

// Exemple d'utilisation :
// En staging → apiUrl vaut "https://api.staging.example.com"
// En production → apiUrl vaut "https://api.example.com"
```

### Les environnements de déploiement

```yaml
# .github/workflows/deploy.yml
# Ce pipeline déploie l'app selon la branche

jobs:
  # ── Déploiement sur STAGING (pré-production) ──────────
  deploy-staging:
    # Ne se déclenche QUE si on push sur la branche "develop"
    if: github.ref == 'refs/heads/develop'
    # "environment" = les variables secrètes de cet environnement
    # (configurées dans les Settings de GitHub)
    environment: staging
    # ... (étapes de déploiement)

  # ── Déploiement en PRODUCTION ──────────────────────────
  deploy-production:
    # Ne se déclenche QUE si on push sur la branche "main"
    if: github.ref == 'refs/heads/main'
    environment: production
    # "needs" = attendre que le staging soit déployé d'abord
    # (on teste en staging AVANT de mettre en production)
    needs: [deploy-staging]
    # ... (étapes de déploiement)
```

> **En résumé** : `develop` → déploie sur staging (test) → si c'est OK →
> `main` → déploie en production (les vrais utilisateurs).

---

## 📝 Résumé

| Concept | Explication simple |
|---------|-------------------|
| **Déploiement** | Mettre ton app sur Internet pour que les gens y accèdent |
| **Vercel / Netlify** | Hébergeurs gratuits, parfaits pour débuter (déploiement en 5 min) |
| **Docker** | Conteneur qui emballe ton app + tout ce qu'elle a besoin → fonctionne partout |
| **Dockerfile** | La recette pour créer un conteneur Docker |
| **Nginx** | Serveur web léger qui sert les fichiers de ton app |
| **Variables d'env** | Réglages secrets/configurables de ton app (URLs, clés API) |
| **Staging** | Environnement de test avant la mise en production |
| **Production** | L'environnement des vrais utilisateurs |

---

## 🎯 Pratique

### Exercice DEPLOY.1 — Dockerfile

Complète ce Dockerfile pour une app Vue :

```dockerfile
# Étape 1 : Build
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de config et installer les dépendances
# ???

# Copier le code source et builder
# ???

# Étape 2 : Servir
FROM nginx:alpine
# Copier le build dans nginx
# ???
```

<details>
<summary>Solution</summary>

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
</details>

---

### Exercice DEPLOY.2 — Variables d'environnement

Comment configures-tu l'URL de l'API différemment en staging et production ?

```ts
// vite.config.ts
// ???
```

Et dans le workflow GitHub Actions :

```yaml
# ???
```

<details>
<summary>Solution</summary>

```ts
// vite.config.ts - utilise les variables VITE_*
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  }
})
```

```yaml
# Dans le workflow
jobs:
  deploy-staging:
    environment: staging
    env:
      VITE_API_URL: https://api.staging.example.com
    # ...

  deploy-production:
    environment: production
    env:
      VITE_API_URL: https://api.example.com
    # ...
```
</details>

---

### Exercice DEPLOY.3 — Workflow conditionnel

Crée un workflow qui déploie sur staging si on push sur `develop`, et en production si on push sur `main` :

```yaml
jobs:
  deploy-staging:
    if: ???
    # ...
  
  deploy-production:
    if: ???
    # ...
```

<details>
<summary>Solution</summary>

```yaml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    # ...

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    # ...
```
</details>

---

## Suite

→ `cours/07-cicd/03-monitoring.md`
