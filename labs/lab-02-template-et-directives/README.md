# Lab 02 — Template et directives

> **Outcome :** à la fin, tu sais construire un composant Vue 3 qui affiche une liste réactive avec `v-for` + `:key`, un empty state avec `v-if`/`v-else`, des classes conditionnelles avec `:class`, et un filtre déclenché par `@click`.
> **Vrai outil :** Vue 3.5 + Vite dev server (HMR visible en direct dans le navigateur).
> **Feedback :** le coach valide visuellement en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis `FamilyMemberList.vue`, le composant central de la page d'accueil TribuZen. Voici le cahier des charges **exact** :

1. Afficher la liste des membres d'une famille.
2. Chaque ligne montre : prénom + badge **Admin** si `isAdmin: true`.
3. Les membres inactifs (`isActive: false`) ont la classe CSS `member--inactive` (tu ajoutes un style scoped qui les grise : `opacity: 0.45`).
4. Si la liste est vide, afficher : « Aucun membre pour l'instant. »
5. Un bouton **Masquer inactifs** filtre la liste (computed) — les actifs seuls s'affichent quand activé.
6. Les classes du bouton changent quand le filtre est actif (`btn--active`).

**Données de départ (à copier dans ton `<script setup>`) :**

```ts
interface Member {
  id: string
  name: string
  isAdmin: boolean
  isActive: boolean
}

const members = ref<Member[]>([
  { id: 'm1', name: 'Alice',  isAdmin: true,  isActive: true  },
  { id: 'm2', name: 'Bob',    isAdmin: false, isActive: false },
  { id: 'm3', name: 'Cara',   isAdmin: false, isActive: true  },
  { id: 'm4', name: 'David',  isAdmin: false, isActive: false },
])
```

**Pas de gap-fill** — tu écris le composant complet à partir du starter minimal ci-dessous.

### Starter minimal

Crée `src/components/family/FamilyMemberList.vue` dans ton projet Vite :

```vue
<!-- FamilyMemberList.vue — starter -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// Colle ici l'interface Member et le ref members ci-dessus
// À toi d'ajouter : hideInactive ref, visibleMembers computed
</script>

<template>
  <!-- À construire : bouton filtre, liste v-for, empty state, badge admin -->
</template>

<style scoped>
/* À toi d'ajouter les styles .member--inactive, .badge, .btn--active */
</style>
```

Lance le dev server (`pnpm dev`) et branche `FamilyMemberList` dans `App.vue` pour voir le résultat en direct.

---

## Étapes (en friction)

1. **Déclare l'état de filtre** — un `ref<boolean>` `hideInactive` initialisé à `false`.
2. **Écris le computed `visibleMembers`** — si `hideInactive` est vrai, filtre les membres dont `isActive === true` ; sinon retourne tous les membres.
3. **Écris le template `v-for`** — boucle sur `visibleMembers`, `:key` sur `member.id`.
4. **Ajoute le `v-if` du badge Admin** dans chaque ligne.
5. **Ajoute le `:class` conditionnel** `member--inactive` selon `member.isActive`.
6. **Écris l'empty state** — `v-if` quand `visibleMembers.length === 0`, `v-else` sur la liste.
7. **Ajoute le bouton** avec `@click` pour basculer `hideInactive` et `:class` pour refléter l'état actif du filtre.
8. **Vérifie les cas limites** : vider le tableau (`members.value = []`) → empty state apparaît ; activer le filtre avec seulement des inactifs → empty state apparaît aussi.

---

## Corrigé complet commenté

```vue
<!-- FamilyMemberList.vue — corrigé -->
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Member {
  id: string
  name: string
  isAdmin: boolean
  isActive: boolean
}

// Données — en vrai produit, viendrait d'une prop ou d'un composable fetch
const members = ref<Member[]>([
  { id: 'm1', name: 'Alice',  isAdmin: true,  isActive: true  },
  { id: 'm2', name: 'Bob',    isAdmin: false, isActive: false },
  { id: 'm3', name: 'Cara',   isAdmin: false, isActive: true  },
  { id: 'm4', name: 'David',  isAdmin: false, isActive: false },
])

// État du filtre — false = tout afficher, true = actifs seulement
const hideInactive = ref(false)

// computed : recalcule automatiquement quand hideInactive ou members changent
// [...members.value] — copie pour ne pas muter le ref source
const visibleMembers = computed(() =>
  hideInactive.value
    ? members.value.filter(m => m.isActive)
    : members.value
)
</script>

<template>
  <div class="member-list">
    <!-- Bouton filtre :
         @click — toggle hideInactive (expression inline directement dans le template)
         :class — syntaxe objet : la classe 'btn--active' s'ajoute si hideInactive est vrai -->
    <button
      class="btn"
      :class="{ 'btn--active': hideInactive }"
      @click="hideInactive = !hideInactive"
    >
      {{ hideInactive ? 'Afficher tous' : 'Masquer inactifs' }}
    </button>

    <!-- Empty state — v-if quand la liste filtrée est vide
         v-if + v-else = pattern idiomatique Vue (pas deux v-show) -->
    <p v-if="visibleMembers.length === 0" class="empty-state">
      Aucun membre pour l'instant.
    </p>

    <!-- Liste — v-else : s'affiche quand visibleMembers.length > 0 -->
    <ul v-else>
      <!--
        v-for sur le computed (pas sur le ref brut) → le filtre est déjà appliqué
        :key="member.id" → id métier stable, résistant au tri/filtre futur
        :class → syntaxe objet avec une seule entrée — lisible sans computed helper
      -->
      <li
        v-for="member in visibleMembers"
        :key="member.id"
        :class="{ 'member--inactive': !member.isActive }"
      >
        <!-- Interpolation : auto-escapé, XSS-safe -->
        {{ member.name }}

        <!--
          Badge admin — v-if (pas v-show) car le badge ne toggle pas :
          il est soit là, soit absent selon la donnée — pas besoin de garder un nœud DOM vide
        -->
        <span v-if="member.isAdmin" class="badge">Admin</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Grise les membres inactifs — opacity plutôt que display:none
   pour garder la structure visible (utile pour l'admin) */
.member--inactive {
  opacity: 0.45;
}

/* Badge rouge-orangé pour l'admin */
.badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.1rem 0.4rem;
  background: #ef4444;
  color: #fff;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Bouton filtre actif : fond sombre pour indiquer l'état */
.btn {
  margin-bottom: 1rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
}

.btn--active {
  background: #1e293b;
  color: #fff;
  border-color: #1e293b;
}

.empty-state {
  color: #94a3b8;
  font-style: italic;
}
</style>
```

**Pourquoi ce corrigé est correct :**
- `visibleMembers` est un `computed` — Vue recalcule automatiquement quand `hideInactive` ou `members` changent. Pas de logique de filtre dans le template.
- L'empty state teste `visibleMembers.length` (la liste filtrée), pas `members.length` — si le filtre est actif et qu'il ne reste aucun actif, l'empty state s'affiche même si `members` n'est pas vide.
- Le bouton avec `@click="hideInactive = !hideInactive"` est une expression inline suffisamment courte pour rester dans le template. Au-delà d'une simple inversion, extraire dans une fonction `toggleFilter()`.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Reproduis `FamilyMemberList.vue` **de mémoire, en 25 minutes**, avec les modifications suivantes :

1. Ajoute un champ de **recherche par prénom** — `ref<string>` + `computed` qui filtre sur `member.name.toLowerCase().includes(...)`. Les deux filtres (inactifs + recherche) s'appliquent cumulativement.
2. Affiche le **nombre de membres visibles** en temps réel : `{{ visibleMembers.length }} membre(s)`.
3. **Sans ouvrir ce corrigé** ni le module 02.

**Critère de réussite :** le composant fonctionne dans le navigateur et les deux filtres sont indépendants (activer l'un n'efface pas l'autre).

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, `FamilyMemberList.vue` vit ici :

```
tribuzen/
  src/
    components/
      family/
        FamilyMemberList.vue
```

**Différences par rapport au lab :**

- Les membres viendront d'une prop `members: Member[]` passée par le parent `FamilyPage.vue` (module 05 — `defineProps`). Pour l'instant, garde les données locales.
- L'interface `Member` sera importée depuis `src/types/family.ts` (fichier partagé entre composants) — dans le lab, on la définit inline.
- Le style sera géré par le design system TribuZen (variables CSS, tokens) plutôt que du CSS ad hoc — mais la logique de `:class` reste identique.

**Commit cible :**
```
feat(family): FamilyMemberList — v-for membres, v-if badge, empty state, filtre actifs
```
