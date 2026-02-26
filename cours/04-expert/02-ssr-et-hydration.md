# 02 — SSR et Hydration

> **Niveau** : avancé — Ce chapitre est utile pour **comprendre les concepts**.
> En pratique, tu n'auras pas besoin de faire du SSR tout de suite, mais c'est important de savoir ce que c'est car on en parle souvent en entretien.
> C'est OK d'y revenir plus tard !

---

## C'est quoi le "rendu" d'une page web ?

Avant de parler de SSR, il faut comprendre comment une page web arrive sur ton écran.

Quand tu tapes une adresse (ex: `www.monsite.com`) dans ton navigateur :

1. Ton navigateur envoie une **requête** au serveur (comme passer une commande)
2. Le serveur **répond** avec du contenu (HTML, CSS, JavaScript)
3. Ton navigateur **affiche** (rend) la page à l'écran

La grande question est : **qui construit le HTML de la page ?** Le serveur ? Ou le navigateur ?

---

## CSR vs SSR — Les deux grandes approches

### CSR — Client-Side Rendering (Rendu côté client)

**C'est ce que tu fais depuis le début de ce cours avec Vue.**

> 🎯 **Analogie — Le restaurant CSR** :
>
> Tu vas au restaurant. Le serveur t'apporte :
> - Un **plan de travail vide** (une page HTML quasi vide)
> - Tous les **ingrédients** (le code JavaScript / Vue)
> - Une **recette** (les instructions pour construire la page)
>
> **C'est TOI (le navigateur) qui cuisines le plat (qui construit la page).**
>
> ➡️ Avantage : une fois que tout est prêt, changer de plat est très rapide (navigation fluide)
> ➡️ Inconvénient : il y a un temps d'attente au début pendant que tu cuisines

Concrètement, voilà ce qui se passe en CSR :

```
1. Le navigateur reçoit une page HTML quasi VIDE :
   <div id="app"></div>             ← juste une boîte vide !

2. Le navigateur télécharge le JavaScript (le code Vue)

3. Vue s'exécute et CONSTRUIT tout le HTML dans le navigateur
   → les textes, les boutons, les images apparaissent

4. La page est prête et interactive
```

---

### SSR — Server-Side Rendering (Rendu côté serveur)

> 🎯 **Analogie — Le restaurant SSR** :
>
> Tu vas au restaurant. Le **chef cuisinier (le serveur)** prépare ton plat **en cuisine** et t'envoie **un plat tout prêt**.
>
> Tu reçois directement un plat complet que tu peux voir et sentir immédiatement.
> Mais pour pouvoir le **manger** (interagir avec), tu dois attendre tes couverts (le JavaScript).
>
> ➡️ Avantage : tu vois le plat immédiatement (la page s'affiche tout de suite)
> ➡️ Inconvénient : il y a un petit délai avant de pouvoir interagir

Concrètement, voilà ce qui se passe en SSR :

```
1. Le navigateur demande la page /about

2. Le SERVEUR exécute Vue et génère le HTML COMPLET :
   <h1>À propos</h1>
   <p>Bienvenue sur notre site...</p>      ← HTML déjà construit !

3. Le serveur envoie ce HTML au navigateur
   → La page s'AFFICHE immédiatement (l'utilisateur voit le contenu)

4. Le navigateur télécharge le JavaScript (Vue) en arrière-plan

5. Vue "HYDRATE" le HTML (voir section suivante)

6. La page devient interactive (les boutons fonctionnent)
```

---

## Comparaison visuelle

```
CSR (Client-Side Rendering) :
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Requête │ →   │ Page     │ →   │ JS se    │ →   │ Page     │
│  envoyée │     │ VIDE     │     │ charge   │     │ PRÊTE    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                  😕 rien à voir    ⏳ patience...    ✅ tout marche !

SSR (Server-Side Rendering) :
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Requête │ →   │ Page     │ →   │ Hydra-   │ →   │ Page     │
│  envoyée │     │ VISIBLE  │     │ tation   │     │ PRÊTE    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                  👀 on voit déjà!  ⏳ JS charge...   ✅ tout marche !
```

---

## 💧 C'est quoi l'hydration (l'hydratation) ?

C'est LE concept clé du SSR. Et le mot est bizarre, mais l'idée est simple.

> 🎯 **Analogie — La statue de cire** :
>
> Imagine une statue de cire dans un musée. Elle **ressemble** à une vraie personne (le HTML statique envoyé par le serveur). Mais elle ne **bouge pas**, elle ne **réagit pas**.
>
> **L'hydratation**, c'est comme donner vie à cette statue : on lui ajoute la capacité de bouger, de parler, de répondre.
>
> En technique : Vue prend le HTML statique envoyé par le serveur et **attache les événements JavaScript** (les clics, les saisies, etc.) pour le rendre interactif.

En résumé :
- **Avant hydratation** : la page est visible mais les boutons ne fonctionnent pas
- **Après hydratation** : la page est visible ET interactive

---

## Pourquoi SSR ? À quoi ça sert ?

### 1. Le SEO (référencement Google)

> 📋 **Rappel** : Le **SEO** (Search Engine Optimization) c'est faire en sorte que Google trouve et affiche ton site dans ses résultats de recherche.

Google envoie des robots pour **lire** les pages web. Avec le CSR :
- Le robot reçoit une page **vide** (`<div id="app"></div>`)
- Il ne voit **aucun contenu** → ton site est mal référencé

Avec le SSR :
- Le robot reçoit le **HTML complet** avec tout le texte
- Il peut **tout lire** → ton site est bien référencé

### 2. La vitesse d'affichage initial

Avec le SSR, l'utilisateur voit du contenu **immédiatement**, sans attendre que tout le JavaScript se charge. C'est important pour :
- Les connexions lentes (3G, zones rurales)
- Les téléphones peu puissants
- L'expérience utilisateur en général

---

## Les différents modes de rendu

| Mode | Acronyme | Qui construit le HTML ? | SEO | Quand l'utiliser ? |
|------|----------|------------------------|-----|-------------------|
| Client-Side Rendering | CSR | Le **navigateur** | ❌ Non | Dashboards, apps internes |
| Server-Side Rendering | SSR | Le **serveur** (à chaque requête) | ✅ Oui | E-commerce, sites publics |
| Static Site Generation | SSG | Le **build** (une seule fois) | ✅ Oui | Blogs, docs, sites vitrines |
| Incremental Static Regen | ISR | Le build + mise à jour | ✅ Oui | Le meilleur des deux mondes |

> **SSG** = le HTML est généré une fois à la construction du site (comme imprimer des prospectus).
> **SSR** = le HTML est généré à chaque visite (comme écrire une lettre personnalisée à chaque visiteur).

---

## Pour aller plus loin : SSR avec Vue 3

> ⚠️ **Concept avancé** — En pratique, on utilise **Nuxt 3** pour le SSR (voir plus bas). Tu n'auras presque jamais à écrire ce code toi-même.

### Côté serveur — Générer le HTML

```ts
// server.ts — Ce code tourne sur le SERVEUR (pas dans le navigateur)
import { createSSRApp } from 'vue'              // createSSRApp = créer une app Vue pour le SSR
import { renderToString } from 'vue/server-renderer'  // Transforme l'app Vue en texte HTML
import App from './App.vue'                      // Notre composant principal

export async function render(): Promise<string> {
  const app = createSSRApp(App)       // Crée l'application Vue
  const html = await renderToString(app)  // Convertit en HTML (texte)
  return html                          // Renvoie le HTML au navigateur
}
```

### Côté client — Hydrater le HTML

```ts
// entry-client.ts — Ce code tourne dans le NAVIGATEUR
import { createSSRApp } from 'vue'
import App from './App.vue'

const app = createSSRApp(App)
app.mount('#app')
// mount() ici ne CRÉE PAS le HTML (il existe déjà, envoyé par le serveur)
// Il HYDRATE le HTML existant = il attache les événements (clics, etc.)
```

---

## Pour aller plus loin : Les erreurs d'hydratation (mismatch)

> ⚠️ **Concept avancé** — Mais bon à comprendre si tu fais du SSR.

Le HTML généré par le serveur **doit être identique** à celui que Vue générerait dans le navigateur. Si ce n'est pas le cas, on a un **mismatch** (une incohérence) et Vue affiche un warning.

### Exemple de problème : la date

```vue
<!-- ❌ PROBLÈME : la date est différente sur le serveur et le navigateur -->
<!-- Le serveur génère "14:30:00" mais le navigateur affiche "14:30:02" -->
<p>{{ new Date().toLocaleString() }}</p>

<!-- ✅ SOLUTION : afficher la date uniquement APRÈS le montage (côté client) -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Au début, la date est vide (identique serveur et client)
const date = ref<string>('')

// onMounted = s'exécute SEULEMENT dans le navigateur, après l'hydratation
onMounted(() => {
  date.value = new Date().toLocaleString()
  // Maintenant la date s'affiche côté client uniquement
})
</script>
<p>{{ date }}</p>
```

### Exemple de problème : la taille de l'écran

```vue
<!-- ❌ PROBLÈME : le serveur ne connaît pas la taille de l'écran ! -->
<!-- window n'existe PAS sur le serveur -->
<p v-if="window.innerWidth > 768">Desktop</p>

<!-- ✅ SOLUTION : détecter la taille APRÈS le montage -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Par défaut false (identique serveur et client)
const isDesktop = ref(false)

// onMounted = s'exécute seulement dans le navigateur
onMounted(() => {
  // window existe ici car on est dans le navigateur
  isDesktop.value = window.innerWidth > 768
})
</script>
<p v-if="isDesktop">Desktop</p>
```

### 📌 La règle d'or du SSR

> **Tout ce qui dépend du navigateur** (`window`, `document`, `localStorage`, taille d'écran, date…)
> doit être utilisé dans `onMounted()` et jamais directement dans le template.

---

## Nuxt 3 — Le framework SSR recommandé

En pratique, **personne ne fait du SSR à la main**. On utilise **Nuxt 3**, un framework construit sur Vue 3 qui gère tout automatiquement :

- ✅ SSR / SSG / ISR (tu choisis le mode)
- ✅ Routing basé sur les fichiers (pas besoin de configurer les routes)
- ✅ Auto-imports (pas besoin d'importer `ref`, `computed`, etc.)
- ✅ Data fetching côté serveur (charger les données avant d'envoyer la page)

```vue
<!-- Exemple Nuxt 3 : charger des données côté serveur -->
<script setup lang="ts">
// useAsyncData = charge les données SUR LE SERVEUR avant d'envoyer la page
// Le navigateur reçoit directement la page avec les données déjà affichées !
const { data: posts } = await useAsyncData(
  'posts',                          // Un identifiant unique pour cette requête
  () => $fetch('/api/posts')        // La requête HTTP pour chercher les articles
)
</script>

<template>
  <!-- Les posts sont déjà disponibles, chargés par le serveur -->
  <article v-for="post in posts" :key="post.id">
    <h2>{{ post.title }}</h2>
  </article>
</template>
```

> Voir le module 05 pour le détail complet de Nuxt 3.

---

## Quand utiliser SSR ? Guide pratique

| Type de projet | Mode recommandé | Pourquoi ? |
|---------------|----------------|------------|
| Dashboard admin interne | **CSR** | Pas de SEO nécessaire, c'est privé |
| Site vitrine / blog | **SSG** | Contenu qui change peu, SEO important |
| E-commerce | **SSR** ou **ISR** | SEO crucial, contenu dynamique (prix, stocks) |
| Application SaaS | **CSR** | Derrière un login, pas de SEO |
| Documentation | **SSG** (VitePress, Nuxt Content) | Contenu statique, SEO important |

---

## En contexte professionnel (ESN)

- **La majorité des missions** sont des dashboards / back-offices → **CSR suffit**
- Le SSR est demandé pour les projets **où le SEO est critique** (e-commerce, sites publics)
- **Savoir expliquer** CSR vs SSR et les tradeoffs en entretien = un vrai point fort

---

## Résumé en une image

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   CSR = Le navigateur construit la page           │
│   🍳 Tu cuisines toi-même                        │
│   ✅ Navigation rapide après chargement           │
│   ❌ Page vide au début, mauvais SEO              │
│                                                   │
│   SSR = Le serveur construit la page              │
│   👨‍🍳 Le chef cuisine pour toi                     │
│   ✅ Page visible immédiatement, bon SEO          │
│   ❌ Un peu plus complexe à mettre en place       │
│                                                   │
│   Hydratation = Rendre le HTML statique           │
│   interactif (ajouter les clics, les événements)  │
│   💧 Donner vie à la statue de cire               │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## Suite

→ `cours/04-expert/03-architecture-front.md`
