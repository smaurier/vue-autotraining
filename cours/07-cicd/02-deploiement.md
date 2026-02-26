# 02 — Déploiement

## SPA (Vite)

### Vercel

```bash
# Installe Vercel CLI
pnpm add -g vercel
vercel
```

Ou connecte le repo GitHub dans le dashboard Vercel → déploiement automatique.

### Netlify

Pareil : connecte le repo GitHub, configure :

- Build command : `pnpm build`
- Publish directory : `dist`

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /assets {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

```bash
docker build -t mon-app .
docker run -p 80:80 mon-app
```

## Nuxt 3

### Vercel / Netlify

Nuxt détecte automatiquement la plateforme :

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: "vercel", // ou 'netlify'
  },
});
```

### Docker (SSR)

```dockerfile
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.output ./
EXPOSE 3000
CMD ["node", "server/index.mjs"]
```

## Environnements

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    environment: staging
    # ...

  deploy-production:
    if: github.ref == 'refs/heads/main'
    environment: production
    needs: [deploy-staging] # staging d'abord
    # ...
```

### Variables d'environnement

```bash
# .env.staging
VITE_API_URL=https://api.staging.example.com

# .env.production
VITE_API_URL=https://api.example.com
```

```ts
// Acces dans le code
const apiUrl = import.meta.env.VITE_API_URL;
```

## Suite

→ `cours/07-cicd/03-monitoring.md`
