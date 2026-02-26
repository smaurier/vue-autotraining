# 02 — Sécurité front-end

## Les menaces principales

| Menace       | Vecteur                          | Impact                  |
| ------------ | -------------------------------- | ----------------------- |
| XSS          | Injection de script via input    | Vol de session, données |
| CSRF         | Requête forgée depuis autre site | Actions non autorisées  |
| CORS         | Mauvaise config serveur          | Fuite de données        |
| Clickjacking | iFrame malveillante              | Actions involontaires   |

## XSS (Cross-Site Scripting)

### Vue 3 protège par défaut

```vue
<!-- ✅ Vue échappe automatiquement le contenu -->
<template>
  <p>{{ userInput }}</p>
  <!-- Si userInput = "<script>alert('xss')</script>" -->
  <!-- Rendu : &lt;script&gt;alert('xss')&lt;/script&gt; -->
</template>
```

### Les pièges XSS en Vue

```vue
<!-- ❌ v-html : contenu non échappé -->
<div v-html="userComment"></div>
<!-- Si userComment contient un <script>, il s'exécute ! -->

<!-- ✅ Sanitizer avant v-html -->
<script setup lang="ts">
import DOMPurify from "dompurify";

const safeHtml = computed(() => DOMPurify.sanitize(userComment.value));
</script>
<div v-html="safeHtml"></div>
```

```ts
// ❌ Ne jamais construire du HTML depuis des données utilisateur
const html = `<a href="${userUrl}">Lien</a>`; // javascript:alert('xss')

// ✅ Valider les URLs
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

### Headers de sécurité

```ts
// Côté serveur (Nuxt, Express…)
// Content-Security-Policy
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
```

## CSRF (Cross-Site Request Forgery)

### Protection par token CSRF

```ts
// Le serveur envoie un token CSRF dans un cookie
// Le client le lit et l'envoie dans un header custom

export async function csrfFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  // Lire le token depuis le cookie
  const csrfToken = document.cookie
    .split("; ")
    .find((c) => c.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      "X-XSRF-TOKEN": csrfToken ?? "",
    },
  });
}
```

### SameSite cookies

```ts
// Côté serveur : configurer les cookies correctement
res.cookie("session", token, {
  httpOnly: true, // Pas accessible en JS
  secure: true, // HTTPS uniquement
  sameSite: "strict", // Pas envoyé cross-origin
  maxAge: 3600000, // 1 heure
});
```

## Validation côté client (ne remplace pas le serveur)

```ts
// composables/useValidation.ts
import { z } from "zod";

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z
  .string()
  .min(8, "8 caractères minimum")
  .regex(/[A-Z]/, "1 majuscule requise")
  .regex(/[0-9]/, "1 chiffre requis")
  .regex(/[^a-zA-Z0-9]/, "1 caractère spécial requis");

export function useValidation() {
  function validateEmail(email: string): string | null {
    const result = emailSchema.safeParse(email);
    return result.success ? null : result.error.issues[0].message;
  }

  function validatePassword(password: string): string | null {
    const result = passwordSchema.safeParse(password);
    return result.success ? null : result.error.issues[0].message;
  }

  return { validateEmail, validatePassword };
}
```

## Gestion des dépendances vulnérables

```bash
# Audit des dépendances
pnpm audit

# Audit avec correction automatique
pnpm audit --fix

# Vérifier les licences
npx license-checker --summary
```

**Règle ESN** : `pnpm audit` dans le pipeline CI. Si vulnérabilité critique → le build échoue.

## Variables d'environnement

```ts
// ❌ Ne JAMAIS mettre de secrets dans le code front
const API_KEY = "sk-1234567890"; // Visible dans le bundle !

// ✅ Variables publiques uniquement côté client
// .env
VITE_API_BASE=https://api.example.com
VITE_PUBLIC_KEY=pk_live_xxx

// Côté serveur uniquement (Nuxt runtimeConfig)
API_SECRET=sk_secret_xxx
```

```ts
// ✅ Accéder aux variables publiques
const apiBase = import.meta.env.VITE_API_BASE;

// Nuxt : runtimeConfig
const config = useRuntimeConfig();
const publicBase = config.public.apiBase; // Côté client OK
const secret = config.apiSecret; // Côté serveur uniquement
```

## Checklist sécurité front ESN

- [ ] Pas de `v-html` sans sanitization (DOMPurify)
- [ ] Pas de `eval()` ni `new Function()`
- [ ] Tokens JWT en mémoire, refresh en cookie HttpOnly
- [ ] Validation Zod côté client ET côté serveur
- [ ] `pnpm audit` dans le CI
- [ ] CSP headers configurés
- [ ] Aucun secret dans le code front (`VITE_` = public)
- [ ] URLs utilisateur validées (pas de `javascript:`)
- [ ] CORS configuré strictement côté serveur

## Suite

→ `cours/11-auth-securite/03-rbac-et-permissions.md`
