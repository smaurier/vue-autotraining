# 01 — Nuxt 3 : Introduction

## Avant de commencer : c'est quoi un "framework" ?

> **Analogie** : imagine que tu veux construire une maison.
> - **JavaScript** = les matériaux bruts (briques, ciment, bois)
> - **Vue 3** = un kit de construction avec des murs pré-fabriqués (tu assembles, mais tu choisis comment)
> - **Nuxt 3** = une maison clé en main avec les murs, le toit, la plomberie et l'électricité déjà installés
>
> Un **framework**, c'est un ensemble d'outils et de règles qui te simplifient la vie pour construire une application.

---

## Qu'est-ce que Nuxt 3 ?

Nuxt 3 est un **framework construit par-dessus Vue 3**. Il ajoute automatiquement tout ce que Vue ne fournit pas de base.

> **Analogie** : si Vue 3 est le **moteur** d'une voiture, alors Nuxt 3 est la **voiture complète** — avec le volant, les roues, le GPS, et la climatisation déjà installés.

### Ce que Nuxt ajoute à Vue :

```
Vue 3 seul :                         Nuxt 3 :
─────────────                        ─────────
❌ Tu dois installer le routeur      ✅ Le routeur est automatique
❌ Tu dois importer ref, computed    ✅ Tout est auto-importé
❌ Pas de rendu serveur (SSR)        ✅ SSR intégré
❌ Pas de backend                    ✅ Tu peux créer une API dans le même projet
❌ Tu configures Vite toi-même       ✅ Tout est configuré pour toi
```

### Rappel : C'est quoi le "routeur" ?

Le routeur, c'est le système qui dit : "quand l'utilisateur va sur `/about`, affiche la page À propos". Avec Vue seul, tu dois installer `vue-router` et écrire la configuration. Avec Nuxt, **c'est automatique** : tu crées un fichier, et la route existe.

### Rappel : C'est quoi le SSR ?

- **CSR** (Client-Side Rendering) = le navigateur télécharge une page vide, puis JavaScript construit la page. C'est ce que fait Vue seul.
- **SSR** (Server-Side Rendering) = le serveur construit la page HTML complète et l'envoie au navigateur. La page s'affiche plus vite, et Google peut la lire (bon pour le SEO).

> **Analogie** : CSR = tu reçois un meuble IKEA en pièces détachées et tu le montes toi-même. SSR = le meuble arrive déjà monté chez toi.

---

## Installation

```bash
# Crée un nouveau projet Nuxt appelé "mon-projet-nuxt"
npx nuxi@latest init mon-projet-nuxt

# Entre dans le dossier du projet
cd mon-projet-nuxt

# Installe toutes les dépendances (les "briques" dont le projet a besoin)
pnpm install

# Lance le serveur de développement (tu verras ton site sur http://localhost:3000)
pnpm dev
```

> 💡 `pnpm` est un gestionnaire de paquets comme `npm`, mais plus rapide. Si tu n'as pas `pnpm`, tu peux utiliser `npm install` et `npm run dev` à la place.

---

## Structure d'un projet Nuxt 3

Quand tu crées un projet Nuxt, voici les dossiers et fichiers importants :

```
mon-projet-nuxt/
│
├── app.vue              ← Le composant racine (le "conteneur" de toute l'application)
├── nuxt.config.ts       ← Le fichier de configuration de Nuxt
│
├── pages/               ← 📄 Chaque fichier ici = une page de ton site (routing automatique)
│   ├── index.vue        →   URL: /            (la page d'accueil)
│   ├── about.vue        →   URL: /about       (la page "à propos")
│   └── users/
│       ├── index.vue    →   URL: /users       (la liste des utilisateurs)
│       └── [id].vue     →   URL: /users/42    (un utilisateur spécifique)
│
├── layouts/             ← 🖼️ Les "cadres" réutilisables autour des pages
│   └── default.vue      →   Le cadre par défaut (header + footer)
│
├── components/          ← 🧩 Les composants réutilisables (auto-importés !)
│   └── AppHeader.vue    →   Utilisable directement dans le template, sans import
│
├── composables/         ← 🔧 Les fonctions réutilisables (auto-importées !)
│   └── useAuth.ts       →   Utilisable directement, sans import
│
├── server/              ← 🖥️ Le backend (l'API) intégré au projet
│   └── api/
│       ├── users.get.ts →   Répond à GET /api/users
│       └── users.post.ts→   Répond à POST /api/users
│
├── middleware/           ← 🔒 Code exécuté AVANT d'afficher une page (ex: vérifier le login)
│   └── auth.ts
│
├── plugins/             ← 🔌 Extensions ajoutées au démarrage de l'app
└── public/              ← 📁 Fichiers statiques (images, favicon...)
```

---

## Les auto-imports : la magie de Nuxt

### Rappel JavaScript : qu'est-ce qu'un import ?

En JavaScript/TypeScript classique, quand tu veux utiliser une fonction d'un autre fichier, tu dois l'**importer** :

```ts
// En Vue 3 classique, tu dois écrire ça en haut de chaque fichier :
import { ref, computed, watch } from 'vue'       // Pour les outils de Vue
import { useRoute } from 'vue-router'             // Pour le routeur
import AppHeader from '@/components/AppHeader.vue' // Pour tes composants
```

### Avec Nuxt : plus besoin d'importer !

Nuxt détecte automatiquement ce dont tu as besoin et l'importe pour toi :

```vue
<script setup lang="ts">
// ✅ Avec Nuxt, tu utilises directement sans aucun import !
const count = ref(0)           // ref est auto-importé depuis Vue
const double = computed(() => count.value * 2)  // computed aussi
const route = useRoute()       // useRoute aussi

// Même tes propres composables dans le dossier composables/ sont auto-importés
const { user } = useAuth()     // useAuth est auto-importé depuis composables/useAuth.ts
</script>

<template>
  <!-- Tes composants dans components/ sont aussi auto-importés -->
  <AppHeader />
  <!-- Pas besoin d'écrire : import AppHeader from '...' -->
</template>
```

> 💡 **Comment ça marche ?** Nuxt scanne les dossiers `components/`, `composables/`, et `utils/` au démarrage, et rend tout disponible partout. C'est comme si quelqu'un ajoutait tous les `import` pour toi.

---

## Le routing basé sur les fichiers

### Rappel : c'est quoi une "route" ?

Une **route**, c'est l'association entre une **URL** et une **page**. Quand tu tapes `monsite.com/about` dans ton navigateur, le routeur affiche la page "À propos".

### En Vue classique : tu configures les routes manuellement

```ts
// router/index.ts — en Vue classique, tu dois écrire tout ça :
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'        // import manuel
import About from '@/pages/About.vue'      // import manuel

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },        // route manuelle
    { path: '/about', component: About },  // route manuelle
  ]
})
```

### Avec Nuxt : la structure des fichiers = les routes

```
pages/
  index.vue     →  URL: /          (le fichier s'appelle index = page d'accueil)
  about.vue     →  URL: /about     (le fichier s'appelle about = /about)
  contact.vue   →  URL: /contact   (le fichier s'appelle contact = /contact)
```

> **Analogie** : c'est comme un classeur. Le nom de chaque fiche = l'adresse de la page. Tu crées un fichier, la route existe automatiquement. Tu supprimes le fichier, la route disparaît.

**Aucune configuration nécessaire.** Tu crées le fichier, et c'est tout.

---

## Vue seul vs Nuxt : le comparatif complet

| Ce que tu veux faire         | Vue 3 seul (avec Vite)              | Nuxt 3                              |
| ---------------------------- | ----------------------------------- | ----------------------------------- |
| Créer des routes             | ❌ Configuration manuelle           | ✅ Automatique (fichiers = routes)  |
| Importer `ref`, `computed`   | ❌ Import manuel à chaque fichier   | ✅ Auto-importé                     |
| Rendu côté serveur (SSR)     | ❌ Très difficile à faire soi-même  | ✅ Activé par défaut                |
| Créer une API backend        | ❌ Projet séparé nécessaire         | ✅ Dossier `server/` intégré        |
| Configuration Vite           | ❌ Tu gères toi-même               | ✅ Nuxt s'en occupe                 |
| SEO (Google, réseaux sociaux)| ❌ Difficile (page vide au départ)  | ✅ Natif grâce au SSR               |

### Quand choisir quoi ?

- **Vue 3 seul** → pour un **dashboard** ou un **back-office** (pas besoin de SEO, pas besoin de SSR)
- **Nuxt 3** → pour un **site public**, un **blog**, un **e-commerce** (SEO important, performance importante)

> 💡 **En entreprise (ESN)** : la majorité des missions sont des dashboards → Vue SPA suffit souvent. Nuxt est demandé pour les projets où le SEO est important ou quand on veut un projet fullstack (front + back ensemble).

---

## Le fichier de configuration : `nuxt.config.ts`

C'est le fichier où tu configures le comportement de Nuxt. Voici un exemple commenté :

```ts
// nuxt.config.ts — le fichier de configuration principal de Nuxt
export default defineNuxtConfig({
  // Active les outils de développement dans le navigateur (très pratique pour débugger)
  devtools: { enabled: true },

  // Active le mode strict de TypeScript (signale plus d'erreurs pour t'aider)
  typescript: {
    strict: true,
  },

  // Les modules sont des "extensions" qui ajoutent des fonctionnalités à Nuxt
  modules: [
    '@pinia/nuxt',           // Ajoute Pinia (gestion d'état) à Nuxt
    '@nuxtjs/tailwindcss',   // Ajoute Tailwind CSS (framework de style)
  ],

  // Configuration "runtime" : les variables disponibles pendant l'exécution
  runtimeConfig: {
    // ⚠️ Côté serveur uniquement (secret, jamais envoyé au navigateur)
    apiSecret: process.env.API_SECRET,

    // 🌍 Côté client (visible par tout le monde)
    public: {
      apiBase: process.env.API_BASE || '/api',
    },
  },
})
```

> 💡 `process.env.API_SECRET` lit une **variable d'environnement** — c'est une valeur stockée dans un fichier `.env` sur le serveur, utilisée pour garder des secrets (mots de passe, clés d'API) hors du code.

---

## Les modes de rendu : SSR, SPA, SSG

Nuxt te laisse choisir **comment** chaque page est générée :

```ts
// nuxt.config.ts
export default defineNuxtConfig({

  // ── Mode 1 : SSR (par défaut) ──────────────────────────────────
  // Le serveur génère le HTML à chaque visite
  // ✅ Bon pour le SEO, la page s'affiche vite
  ssr: true,

  // ── Mode 2 : SPA ──────────────────────────────────────────────
  // Le navigateur génère tout (comme Vue seul)
  // ✅ Simple, pas besoin de serveur Node.js
  // ssr: false,

  // ── Mode 3 : SSG (Static Site Generation) ─────────────────────
  // Les pages sont générées une seule fois au moment du build
  // ✅ Ultra rapide, hébergeable sur un simple serveur de fichiers
  // Commande : pnpm generate

  // ── Mode 4 : Hybrid (le plus flexible) ────────────────────────
  // Tu choisis le mode page par page !
  routeRules: {
    '/':              { prerender: true },  // SSG : page d'accueil pré-générée
    '/dashboard/**':  { ssr: false },       // SPA : le dashboard côté client
    '/blog/**':       { isr: 3600 },        // ISR : regénérée toutes les heures
  },
})
```

> **En résumé** :
> | Mode | Quand la page est générée | Idéal pour |
> |------|--------------------------|------------|
> | **SSR** | À chaque visite (par le serveur) | Site dynamique avec SEO |
> | **SPA** | Dans le navigateur (par JavaScript) | Dashboard, back-office |
> | **SSG** | Une seule fois au build | Blog, documentation |
> | **ISR** | Au build + regénérée après X secondes | Blog avec mises à jour fréquentes |

---

## 🎯 Pratique

### Exercice NX.1 — Structure Nuxt

Où placerais-tu ces fichiers dans un projet Nuxt ?

1. La page d'accueil du site
2. Un composant `Button.vue` réutilisable
3. Un composable `useAuth.ts`
4. Une route API qui retourne des produits
5. Le layout principal (header + footer)

<details>
<summary>Solution</summary>

```
1. pages/index.vue
2. components/Button.vue
3. composables/useAuth.ts
4. server/api/products.get.ts
5. layouts/default.vue
```
</details>

---

### Exercice NX.2 — Configuration Nuxt

Complète cette configuration nuxt.config.ts :

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // Active le mode SSR
  // ???

  // Configure une variable runtime publique API_URL
  // ???
})
```

<details>
<summary>Solution</summary>

```ts
export default defineNuxtConfig({
  ssr: true,

  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || '/api'
    }
  }
})
```
</details>

---

### Exercice NX.3 — Mode de rendu

Configure les routes suivantes avec le mode de rendu approprié :
- `/` : pré-rendue (SSG)
- `/dashboard/**` : côté client uniquement (SPA)
- `/blog/**` : regénérée toutes les heures (ISR)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // ???
  }
})
```

<details>
<summary>Solution</summary>

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/dashboard/**': { ssr: false },
    '/blog/**': { isr: 3600 }
  }
})
```
</details>

---

## Suite

→ `cours/05-nuxt3/02-pages-et-layouts.md`
