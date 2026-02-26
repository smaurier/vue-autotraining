# 01 — Performance

> **Niveau** : avancé — C'est tout à fait normal de ne pas tout comprendre du premier coup.
> Reviens sur ce chapitre plus tard quand tu auras pratiqué Vue 3 !

---

## C'est quoi la "performance" ?

La **performance**, c'est tout simplement **la vitesse à laquelle ton application répond** à l'utilisateur.

> 🎯 **Analogie — L'autoroute** :
>
> Imagine une autoroute :
> - **Route vide** = ton app est rapide, tout est fluide, l'utilisateur est content
> - **Embouteillage** = ton app est lente, l'utilisateur attend, il s'énerve et quitte la page
>
> L'objectif de l'optimisation de performance, c'est **garder l'autoroute aussi vide que possible** pour que tout circule bien.

Concrètement, une app performante c'est :
- La page s'affiche **vite** (moins de 2 secondes)
- Les boutons **répondent instantanément** quand on clique
- Le défilement (scroll) est **fluide**, sans saccade

---

## 📋 Rappel JavaScript — Qu'est-ce qu'un "rendu" ?

Quand le navigateur affiche ta page, il fait un **rendu** (render en anglais) :

```
1. Il lit le HTML        → c'est quoi la structure de la page ?
2. Il lit le CSS          → à quoi ça doit ressembler ?
3. Il calcule le layout   → où placer chaque élément ?
4. Il peint les pixels    → il affiche le résultat à l'écran
```

Un **re-render** (re-rendu), c'est quand le navigateur doit **refaire tout ce travail** parce que quelque chose a changé.

> Plus tu forces de re-rendus, plus ton app est lente → c'est comme provoquer des embouteillages.

---

## Les 4 grands problèmes de performance en Vue 3

| # | Problème | Analogie |
|---|----------|----------|
| 1 | **Re-rendus inutiles** | Refaire la route alors qu'elle est déjà construite |
| 2 | **Bundle trop gros** | Charger un camion entier alors qu'il te faut juste un colis |
| 3 | **Listes très longues** sans optimisation | Afficher 10 000 panneaux sur l'autoroute d'un coup |
| 4 | **Watchers en cascade** | Un bouchon qui en provoque un autre, puis un autre… |

---

## Diagnostiquer les problèmes avec Vue DevTools

Avant de réparer, il faut **trouver le problème**. C'est comme aller chez le médecin : d'abord le diagnostic, ensuite le traitement.

1. Installe l'extension **Vue DevTools** dans Chrome ou Firefox
2. Ouvre les DevTools (F12) → onglet **Vue**
3. **Onglet Performance** : enregistre et regarde quels composants se re-rendent trop souvent
4. **Onglet Components** : inspecte le temps que chaque composant met à s'afficher

---

## Éviter les re-rendus inutiles

### `v-once` — "affiche-moi une seule fois !"

Parfois, un morceau de ta page **ne changera jamais** (un titre, un logo, un texte fixe).
Avec `v-once`, tu dis à Vue : "rends ce HTML une seule fois, ne le recalcule plus jamais".

```vue
<template>
  <!-- v-once = cet élément ne sera rendu qu'UNE SEULE FOIS -->
  <!-- Même si appTitle change plus tard, le <header> ne bougera pas -->
  <!-- C'est utile pour les éléments statiques qui ne changent jamais -->
  <header v-once>
    <h1>{{ appTitle }}</h1>
  </header>
</template>
```

> 🎯 **Analogie** : C'est comme imprimer un poster et l'accrocher au mur. Tu ne le réimprimes pas tous les jours !

---

### `v-memo` — "recalcule uniquement si ces valeurs changent"

`v-memo` est plus fin que `v-once`. Il dit à Vue : "re-rends cet élément **seulement si** les valeurs que je te donne changent".

```vue
<template>
  <!-- v-for = on boucle sur chaque élément de la liste -->
  <!-- :key = identifiant unique pour chaque élément (obligatoire dans les boucles) -->
  <!-- v-memo="[item.id, item.selected]" = recalcule cet élément UNIQUEMENT -->
  <!--   si item.id OU item.selected changent -->
  <!-- Si rien ne change → Vue saute cet élément = plus rapide ! -->
  <div
    v-for="item in list"
    :key="item.id"
    v-memo="[item.id, item.selected]"
  >
    <ExpensiveComponent :item="item" />
  </div>
</template>
```

> 🎯 **Analogie** : Tu as une liste de courses de 50 articles. Au lieu de la réécrire entière chaque fois, tu ne modifies que la ligne qui a changé.

---

### `shallowRef` — "ne surveille que la surface"

> ⚠️ **Concept avancé** — Pas de panique si c'est flou, tu peux y revenir plus tard.

Rappel : `ref()` en Vue surveille **toutes** les modifications de ta donnée, même les propriétés imbriquées profondément. Avec un gros objet, ça peut être lent.

`shallowRef` ne surveille que le **premier niveau** : il détecte quand tu remplaces l'objet entier, mais pas quand tu modifies une propriété interne.

```ts
import { shallowRef } from 'vue'

// shallowRef = surveille SEULEMENT le remplacement complet de la valeur
// Si on a une liste de 10 000 éléments, c'est beaucoup plus rapide que ref()
const hugeList = shallowRef<DataPoint[]>([])

// ❌ Ceci ne déclenche PAS de mise à jour (mutation interne)
// hugeList.value.push(newItem)

// ✅ Ceci DÉCLENCHE la mise à jour (remplacement complet)
// On crée une nouvelle liste avec tous les anciens éléments + le nouveau
hugeList.value = [...hugeList.value, newItem]
```

> 🎯 **Analogie** : `ref` c'est un vigile qui fouille chaque sac en détail. `shallowRef` c'est un vigile qui regarde seulement si la personne a changé, sans fouiller son sac.

---

## Lazy Loading (chargement paresseux)

### C'est quoi le lazy loading ?

> 🎯 **Analogie — Le restaurant** :
>
> Imagine que tu arrives au restaurant. Deux options :
> - **Sans lazy loading** : le serveur t'apporte TOUS les plats du menu d'un coup dès que tu t'assieds. C'est très long et la table déborde.
> - **Avec lazy loading** : tu commandes un plat à la fois, le serveur t'apporte **seulement ce que tu as demandé**, quand tu en as besoin.
>
> Le lazy loading = **charger uniquement ce dont on a besoin, au moment où on en a besoin**.

---

### 📋 Rappel JavaScript — `import()` dynamique

En JavaScript, il existe deux façons d'importer du code :

```js
// Import STATIQUE — tout est chargé au démarrage
import MonComposant from './MonComposant.vue'

// Import DYNAMIQUE — chargé uniquement quand cette ligne s'exécute
// Le () après import signifie "charge ce fichier maintenant"
const MonComposant = () => import('./MonComposant.vue')
```

L'import dynamique est la base du lazy loading !

---

### Code splitting (découpage du code)

Quand tu construis ton app pour la production (`pnpm build`), tout ton code est regroupé dans un gros fichier appelé **bundle**.

**Le code splitting** = découper ce gros fichier en plusieurs petits morceaux (chunks).

> 🎯 **Analogie** : Au lieu d'un seul énorme colis de 50 kg, tu reçois 10 petits colis de 5 kg que tu ouvres quand tu en as besoin.

---

### Lazy loading des routes

Au lieu de charger toutes les pages au démarrage, on charge chaque page **quand l'utilisateur y navigue** :

```ts
// AVANT (sans lazy loading) — tout est chargé au démarrage
// import AdminView from '@/views/AdminView.vue'

// APRÈS (avec lazy loading) — AdminView est chargé seulement
//   quand l'utilisateur va sur /admin
{
  path: '/admin',                                    // L'URL de la page
  component: () => import('@/views/AdminView.vue'),  // () => import(...) = lazy loading !
  // Le fichier AdminView.vue sera téléchargé UNIQUEMENT
  // quand quelqu'un clique pour aller sur /admin
}
```

---

### Lazy loading de composants

Pour les composants lourds (graphiques, éditeurs, cartes…), on peut les charger à la demande :

```vue
<script setup lang="ts">
// defineAsyncComponent = "définis un composant qui sera chargé plus tard"
import { defineAsyncComponent } from 'vue'

// HeavyChart ne sera PAS inclus dans le chargement initial
// Il sera téléchargé seulement quand il apparaît dans la page
const HeavyChart = defineAsyncComponent(
  () => import('@/components/HeavyChart.vue')  // Chargement à la demande
)
</script>

<template>
  <!-- Suspense = "attends que le composant soit chargé" -->
  <!-- Pendant le chargement, affiche le contenu de #fallback -->
  <Suspense>
    <!-- Le composant principal (affiché une fois chargé) -->
    <HeavyChart />

    <!-- #fallback = ce qui s'affiche PENDANT le chargement -->
    <template #fallback>
      Chargement du graphique...
    </template>
  </Suspense>
</template>
```

---

### Pour aller plus loin : `defineAsyncComponent` avec options

> ⚠️ **Concept avancé** — Utile en production, pas indispensable pour débuter.

Tu peux configurer le comportement du chargement avec plus de détails :

```ts
const AsyncModal = defineAsyncComponent({
  // loader = la fonction qui charge le composant
  loader: () => import('@/components/Modal.vue'),

  // loadingComponent = composant affiché PENDANT le chargement
  loadingComponent: LoadingSpinner,

  // errorComponent = composant affiché si le chargement ÉCHOUE
  errorComponent: ErrorDisplay,

  // delay = attends 200ms avant d'afficher le loadingComponent
  // (évite un flash si le chargement est rapide)
  delay: 200,

  // timeout = si le chargement dépasse 10 secondes, affiche errorComponent
  timeout: 10000,
})
```

---

## Le Virtual DOM — Comment Vue optimise les rendus

> 🎯 **Analogie — Le brouillon et la copie finale** :
>
> Imagine que tu dois modifier une lettre :
> - **Sans Virtual DOM** : tu effaces TOUTE la lettre et tu la réécris entièrement, même si tu n'avais qu'un mot à changer
> - **Avec Virtual DOM** : tu fais d'abord les modifications sur un **brouillon**, tu compares le brouillon avec la version actuelle, et tu ne modifies **que les mots qui ont changé** sur la copie finale
>
> Le Virtual DOM est le "brouillon" de Vue. Vue calcule les différences et ne touche que ce qui a vraiment changé dans la vraie page.

C'est pour ça que Vue est rapide : il ne modifie pas tout le HTML à chaque changement, seulement les parties nécessaires.

---

## Pour aller plus loin : Virtualisation de listes

> ⚠️ **Concept avancé** — À explorer quand tu auras des listes de plus de 1 000 éléments.

Quand tu as une liste de 10 000 éléments, afficher tous les éléments d'un coup est très lent.

La **virtualisation** = n'afficher que les éléments **visibles à l'écran** (environ 20-30) et créer les autres à la volée quand l'utilisateur scrolle.

> 🎯 **Analogie** : C'est comme un ascenseur dans un immeuble de 100 étages. Tu ne construis pas tous les étages d'un coup. Tu affiches juste l'étage où tu es, et les étages proches.

```bash
# Installation de la bibliothèque de virtualisation
pnpm add @tanstack/vue-virtual
```

```vue
<script setup lang="ts">
// useVirtualizer = un composable qui gère la virtualisation
import { useVirtualizer } from '@tanstack/vue-virtual'
import { ref } from 'vue'

// ref pour l'élément HTML qui contient la liste scrollable
const parentRef = ref<HTMLDivElement | null>(null)

// Notre liste de 10 000 éléments (imaginez une liste de contacts)
const items = ref<string[]>(
  Array.from({ length: 10000 }, (_, i) => `Item ${i}`)
  // Array.from crée un tableau de 10 000 éléments : "Item 0", "Item 1"...
)

// Le virtualizer calcule quels éléments sont visibles
const virtualizer = useVirtualizer({
  count: items.value.length,              // nombre total d'éléments
  getScrollElement: () => parentRef.value, // l'élément scrollable
  estimateSize: () => 35,                  // hauteur estimée de chaque ligne (35px)
})
</script>

<template>
  <!-- Le conteneur scrollable avec une hauteur fixe -->
  <div ref="parentRef" style="height: 400px; overflow: auto">
    <!-- Un div "fantôme" qui a la hauteur totale de tous les éléments -->
    <!-- Ceci permet d'avoir une barre de scroll correcte -->
    <div :style="{
      height: `${virtualizer.getTotalSize()}px`,
      position: 'relative'
    }">
      <!-- On boucle UNIQUEMENT sur les éléments visibles (pas les 10 000 !) -->
      <div
        v-for="row in virtualizer.getVirtualItems()"
        :key="row.key"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${row.size}px`,
          transform: `translateY(${row.start}px)`
        }"
      >
        {{ items[row.index] }}
      </div>
    </div>
  </div>
</template>
```

---

## Pour aller plus loin : Analyser la taille de ton bundle

> ⚠️ **Concept avancé** — Utile quand tu publies ton app en production.

Tu peux visualiser la taille de chaque partie de ton code avec un outil :

```bash
# Installe l'outil d'analyse (en dépendance de développement)
pnpm add -D rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    // visualizer génère une carte visuelle de ton bundle
    // open: true = ouvre automatiquement le résultat dans le navigateur
    // gzipSize: true = montre la taille après compression
    visualizer({ open: true, gzipSize: true })
  ],
})
```

```bash
# Construis ton app et regarde le résultat
pnpm build
# → Un fichier HTML s'ouvre avec une carte colorée montrant
#   la taille de chaque bibliothèque et fichier
```

---

## Repères de performance — Quand c'est "assez rapide" ?

Voici les critères utilisés en entreprise (ESN) pour savoir si une app est performante :

| Métrique | Objectif | En français |
|----------|----------|-------------|
| First Contentful Paint (FCP) | < 1.5s | Premier contenu visible en moins de 1.5 secondes |
| Largest Contentful Paint (LCP) | < 2.5s | Le plus gros élément visible en moins de 2.5 secondes |
| Total Blocking Time (TBT) | < 200ms | Le navigateur n'est pas "bloqué" plus de 200 millisecondes |
| Bundle JS initial | < 200 Ko gzip | Le fichier JavaScript principal fait moins de 200 Ko compressé |

---

## `KeepAlive` — Garder les composants en mémoire

Quand tu changes d'onglet dans une app, normalement le composant de l'ancien onglet est **détruit** (supprimé de la mémoire) et le nouveau est **créé**.

`KeepAlive` dit à Vue : "ne détruis pas ce composant, garde-le en cache pour que ce soit instantané quand on y revient".

> 🎯 **Analogie** : C'est comme mettre un livre en pause avec un marque-page au lieu de le fermer et le rouvrir depuis le début.

```vue
<template>
  <!-- KeepAlive = garde en cache les composants à l'intérieur -->
  <!-- :max="5" = garde maximum 5 composants en cache -->
  <!-- (au-delà, les plus anciens sont supprimés de la mémoire) -->
  <KeepAlive :max="5">
    <!-- :is = affiche le composant correspondant à currentTab -->
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

Les composants gardés en cache ont deux hooks spéciaux :

```ts
import { onActivated, onDeactivated } from 'vue'

// onActivated = le composant REVIENT du cache (l'utilisateur revient sur cet onglet)
onActivated(() => {
  refreshData()  // On peut rafraîchir les données à ce moment
})

// onDeactivated = le composant PART en cache (l'utilisateur quitte cet onglet)
onDeactivated(() => {
  // Le composant est mis en pause, pas détruit
})
```

---

## Résumé

| Technique | Quand l'utiliser | Difficulté |
|-----------|-----------------|------------|
| `v-once` | Contenu qui ne change jamais | ⭐ Facile |
| `v-memo` | Listes où peu d'éléments changent | ⭐⭐ Moyen |
| Lazy loading des routes | Toujours ! C'est une bonne pratique | ⭐ Facile |
| `defineAsyncComponent` | Composants lourds (graphiques, éditeurs) | ⭐⭐ Moyen |
| `KeepAlive` | Navigation par onglets | ⭐ Facile |
| `shallowRef` | Gros objets / grosses listes | ⭐⭐⭐ Avancé |
| Virtualisation | Listes de 1000+ éléments | ⭐⭐⭐ Avancé |

---

## Exercice

→ `exercices/13-performance-audit/ENONCE.md`

## Suite

→ `cours/04-expert/02-ssr-et-hydration.md`
