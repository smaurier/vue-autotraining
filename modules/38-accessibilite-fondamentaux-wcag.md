---
titre: Accessibilité — fondamentaux WCAG et RGAA
cours: 02-vue
notions: [modèle POUR perceptible utilisable compréhensible robuste, niveaux A AA AAA, HTML sémantique, contraste des couleurs, navigation au clavier et focus visible, images et alternatives textuelles, WCAG vs RGAA transposition, prefers-reduced-motion]
outcomes:
  - sait expliquer le modèle POUR et les niveaux WCAG A/AA/AAA
  - sait écrire du HTML sémantique accessible dans un composant Vue
  - sait garantir contraste, navigation clavier et focus visible
  - sait distinguer WCAG (norme) et RGAA (transposition française)
prerequis: [37-trpc]
next: 39-accessibilite-aria-et-vue
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — bases accessibles de tous les composants (sémantique, contraste, clavier) dès la conception
last-reviewed: 2026-07
---

# Accessibilité — fondamentaux WCAG et RGAA

> 📐 **Les fondamentaux d'accessibilité sont désormais dans le cours 25 HTML & CSS**, qui en est
> la source unique du curriculum. Ce module garde ce que **Vue** change : la sémantique dans un
> template, les exemples TribuZen en composants, et les pièges propres à `@click` et aux
> directives. Les principes, le contraste, le clavier et les alternatives sont traités une seule
> fois, là-bas.


> **Outcomes — tu sauras FAIRE :** expliquer le modèle POUR et les niveaux A/AA/AAA, écrire du HTML sémantique accessible dans un composant Vue, garantir contraste et navigation clavier, distinguer avec précision WCAG, EN 301 549 et RGAA.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre les **fondamentaux** — modèle POUR, niveaux, HTML sémantique, contraste, clavier, alt, prefers-reduced-motion, et la chaîne WCAG → EN 301 549 → RGAA. Les attributs ARIA (rôles, états, propriétés, live regions) sont le sujet du **module 39**.

---

## 1. Cas concret d'abord

Tu intègres le composant `GroupCard.vue` de TribuZen — la carte d'un groupe de familles. Un collègue l'a livré en sprint. Tu passes axe-core dessus avant la PR :

```vue
<!-- GroupCard.vue — version non accessible (à auditer) -->
<template>
  <div class="card" @click="openGroup">
    <img src="/icons/group.svg" alt="groupe" />
    <div class="card__title" style="color: #aaa;">{{ group.name }}</div>
    <div class="close" @click.stop="dismiss">×</div>
    <div class="actions">
      <div class="btn" @click="join">Rejoindre</div>
      <div class="btn secondary" @click="details">Voir détails</div>
    </div>
  </div>
</template>
```

**Quatre défauts structurels immédiats :**

1. `<div @click>` sur la carte — pas focusable au clavier, pas annoncé comme interactif par les AT (technologies d'assistance).
2. `alt="groupe"` sur une icône décorative — la valeur est non vide alors qu'elle ne véhicule aucune information supplémentaire ; si l'image était informative, la valeur serait trop pauvre.
3. `color: #aaa` sur fond blanc — ratio ≈ 2.3:1, bien en dessous du seuil AA 4.5:1.
4. Les deux `<div class="btn">` ne sont pas des boutons natifs — pas de focus, pas de déclenchement clavier via `Enter`/`Space`.

Ce module te donne les bases pour auditer et corriger chacun de ces défauts avec précision.

---

## 2. Théorie complète, concise

### 2.1 Le modèle POUR, et 2.2 les niveaux de conformité

> 📐 **Traité dans le cours 25 HTML & CSS**, module 00, § 4 bis « Le référentiel en bref ».
> Le cadre légal détaillé est au cours 23 `23-droit-numerique`.

### 2.3 HTML sémantique

Le HTML sémantique est la première couche d'accessibilité — et la moins coûteuse. Les éléments natifs exposent automatiquement leur **rôle, état et nom accessible** aux technologies d'assistance, sans attributs ARIA supplémentaires.

**Éléments interactifs natifs — toujours préférer**

```vue
<template>
  <!-- ✅ <button> : focusable, role=button, déclenché par Enter ET Space,
       annoncé par lecteur d'écran sans ARIA -->
  <button @click="submit">Valider</button>

  <!-- ✅ <a href> : role=link, déclenché par Enter, annoncé comme lien -->
  <a href="/groupes">Voir les groupes</a>

  <!-- ❌ <div @click> : role=none par défaut, pas focusable,
       Enter/Space sans effet sans @keydown manuel -->
  <div class="btn" @click="submit">Valider</div>
</template>
```

**Structure de page avec landmarks HTML5**

Les landmarks (éléments de structure HTML5) permettent aux utilisateurs de lecteurs d'écran de naviguer directement entre les zones de la page.

```vue
<!-- App.vue — structure de landmarks correcte -->
<template>
  <!-- skip link : premier élément focusable, avant le header -->
  <a href="#contenu-principal" class="skip-link">Aller au contenu principal</a>

  <header>
    <!-- role=banner implicite — une seule bannière par page -->
    <nav aria-label="Navigation principale">
      <!-- role=navigation implicite -->
    </nav>
  </header>

  <main id="contenu-principal" tabindex="-1">
    <!-- role=main implicite — un seul <main> par page -->
    <article><!-- contenu autonome --></article>
    <aside><!-- contenu complémentaire — role=complementary --></aside>
  </main>

  <footer>
    <!-- role=contentinfo implicite -->
  </footer>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: -9999px;   /* hors écran par défaut */
  left: 0;
  z-index: 999;
  padding: 0.5rem 1rem;
  background: #000;
  color: #fff;
  text-decoration: none;
}
/* Visible uniquement au focus clavier -->
.skip-link:focus {
  top: 0;
}
</style>
```

**Hiérarchie des titres**

```vue
<template>
  <!-- ✅ Hiérarchie logique : un seul h1, h2 sous h1, h3 sous h2 -->
  <main>
    <h1>TribuZen — Groupes</h1>
    <section>
      <h2>Mes groupes</h2>
      <article v-for="group in groups" :key="group.id">
        <h3>{{ group.name }}</h3>
      </article>
    </section>
  </main>

  <!-- ❌ Saut de niveau : passe de h1 à h3 — interdit -->
  <!-- <h1>…</h1>  <h3>…</h3> -->
</template>
```

**Listes**

```vue
<template>
  <!-- ✅ <ul>/<li> : annoncé "liste de N éléments" par les AT -->
  <ul aria-label="Membres du groupe">
    <li v-for="member in members" :key="member.id">
      {{ member.displayName }}
    </li>
  </ul>

  <!-- ❌ <div v-for> : aucune sémantique de liste -->
  <!-- <div v-for="member in members">{{ member.displayName }}</div> -->
</template>
```

---

### 2.4 Contraste, 2.5 clavier et focus, 2.6 alternatives textuelles

> 📐 **Traité dans le cours 25 HTML & CSS**, module 10 pour la couleur et le calcul du ratio, module 01 pour les alternatives, modules 16 et 20 pour le focus visible et le protocole clavier.

Ce qui change en Vue, et c'est tout : un `@click` sur un élément non interactif ne crée ni rôle,
ni focus, ni activation au clavier. Le piège n°1 ci-dessous le détaille.

### 2.7 Chaîne normative, et 2.8 préférence de mouvement

> 📐 **Traité dans le cours 25 HTML & CSS**, module 00 § 4 bis pour la chaîne WCAG, RGAA et European Accessibility Act, et module 12 § 4 pour `prefers-reduced-motion`.
> Le détail juridique, dont EN 301 549, est au cours 23.

## 3. Worked examples

### Exemple 1 — `GroupCard.vue` corrigé de A à Z

On reprend le composant du cas concret et on corrige les quatre défauts identifiés.

```vue
<!-- GroupCard.vue — version accessible -->
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Group {
  id: string
  name: string
  memberCount: number
}

const props = defineProps<{
  group: Group
  isDecorative?: boolean // l'icône est-elle purement décorative ?
}>()

const emit = defineEmits<{
  open: [groupId: string]
  dismiss: [groupId: string]
  join: [groupId: string]
  details: [groupId: string]
}>()
</script>

<template>
  <article class="card" :aria-label="`Groupe ${group.name}`">
    <!--
      Image décorative : alt="" vide.
      L'information "groupe" est déjà dans le texte adjacent (group.name).
      Si l'icône distinguait des types de groupes (public/privé), elle serait
      informative et nécessiterait un alt descriptif.
    -->
    <img src="/icons/group.svg" alt="" aria-hidden="true" />

    <!--
      Titre du groupe : <h3> si GroupCard est dans une liste sous un <h2>
      La couleur est un token de design qui passe le ratio 4.5:1
    -->
    <h3 class="card__title">{{ group.name }}</h3>
    <p class="card__meta">{{ group.memberCount }} membres</p>

    <!--
      Bouton de fermeture : <button> natif.
      "×" seul n'est pas un nom accessible — aria-label décrit l'action.
      aria-hidden="true" sur le glyphe × évite "fois" ou "croix" en plus de aria-label.
    -->
    <button
      class="card__dismiss"
      :aria-label="`Ignorer le groupe ${group.name}`"
      @click="emit('dismiss', group.id)"
    >
      <span aria-hidden="true">×</span>
    </button>

    <div class="card__actions">
      <!-- ✅ <button> natif : focus, Enter, Space, rôle "bouton" annoncé automatiquement -->
      <button class="btn" @click="emit('join', group.id)">
        Rejoindre
      </button>
      <button class="btn btn--secondary" @click="emit('details', group.id)">
        Voir les détails
      </button>
    </div>
  </article>
</template>

<style scoped>
/*
  Tokens de contraste — à remplacer par les tokens du DS TribuZen
  #2d3748 sur #fff : ratio ≈ 11.7:1 — conforme AA et AAA
*/
.card__title {
  color: #2d3748;
  font-size: 1.125rem;  /* 18px — texte normal, seuil grand texte = 24px */
  font-weight: 600;
}

.card__meta {
  color: #4a5568; /* ≈ 7.4:1 sur #fff — conforme AAA */
}

/* Focus visible personnalisé — ne pas supprimer outline */
.btn:focus-visible,
.card__dismiss:focus-visible {
  outline: 3px solid #3182ce;
  outline-offset: 2px;
}

/* Bouton secondaire avec contraste suffisant */
.btn--secondary {
  background: transparent;
  border: 1px solid #4a5568; /* 4a5568 sur #fff = 7.4:1 — composant UI : 3:1 requis, ici largement au-dessus */
  color: #2d3748;
}
</style>
```

### Exemple 2 — Formulaire d'inscription accessible

Un formulaire est l'un des composants les plus critiques en accessibilité (thématique 11 du RGAA).

```vue
<!-- RegisterForm.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const email = ref('')
const password = ref('')

const emailError = computed<string>(() => {
  if (!email.value) return "L'adresse e-mail est obligatoire."
  if (!email.value.includes('@')) return "L'adresse e-mail doit contenir un @."
  return ''
})

const passwordError = computed<string>(() => {
  if (!password.value) return 'Le mot de passe est obligatoire.'
  if (password.value.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
  return ''
})

const hasErrors = computed(() => !!emailError.value || !!passwordError.value)

async function handleSubmit(): Promise<void> {
  if (hasErrors.value) return
  // soumettre...
}
</script>

<template>
  <form @submit.prevent="handleSubmit" novalidate>
    <div class="field">
      <!--
        <label for="…"> explicitement lié à l'input via id.
        Alternative : aria-labelledby ou aria-label — mais <label for> est préférable
        car il agrandit la zone de clic et est largement supporté.
      -->
      <label for="register-email">Adresse e-mail</label>
      <input
        id="register-email"
        v-model="email"
        type="email"
        autocomplete="email"
        :aria-invalid="!!emailError || undefined"
        :aria-describedby="emailError ? 'register-email-error' : undefined"
        required
      />
      <!--
        Critère RGAA 11.10 (et WCAG 3.3.1 A) : message d'erreur
        lié au champ via aria-describedby.
        role="alert" : annonce immédiate par les AT quand le message apparaît.
      -->
      <p
        v-if="emailError"
        id="register-email-error"
        class="field__error"
        role="alert"
      >
        {{ emailError }}
      </p>
    </div>

    <div class="field">
      <label for="register-password">Mot de passe</label>
      <input
        id="register-password"
        v-model="password"
        type="password"
        autocomplete="new-password"
        :aria-invalid="!!passwordError || undefined"
        :aria-describedby="passwordError ? 'register-password-error' : undefined"
        required
      />
      <p
        v-if="passwordError"
        id="register-password-error"
        class="field__error"
        role="alert"
      >
        {{ passwordError }}
      </p>
    </div>

    <button type="submit" :disabled="hasErrors">
      Créer mon compte
    </button>
  </form>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

/* Bordure de champ avec contraste suffisant — WCAG 1.4.11 AA : 3:1 -->
/* #767676 sur #fff = 4.5:1 > 3:1 requis */
input {
  border: 1px solid #767676;
  border-radius: 4px;
  padding: 0.5rem;
}

input:focus-visible {
  outline: 3px solid #3182ce;
  outline-offset: 1px;
  border-color: #3182ce;
}

/* aria-invalid=true → indicateur visuel supplémentaire */
input[aria-invalid="true"] {
  border-color: #c53030; /* rouge — accompagné du message texte, pas couleur seule */
}

.field__error {
  color: #c53030; /* 5.1:1 sur #fff — conforme AA texte normal */
  font-size: 0.875rem;
}
</style>
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `<div @click>` au lieu de `<button>` — le plus répandu

```vue
<template>
  <!-- ❌ <div @click> : pas focusable au Tab, role=none par défaut,
       Enter et Space sans effet, pas annoncé par les AT -->
  <div class="card" @click="open">Ouvrir</div>

  <!--
    ✅ <button> : focusable, role=button, Enter + Space natifs,
    annonce "Ouvrir, bouton"
    Si le design exige un aspect de lien : <a href> ou <button> avec style.
    Jamais ajouter tabindex="0" + @keydown sur un <div> quand <button> suffit.
  -->
  <button class="card" @click="open">Ouvrir</button>
</template>
```

**Subtilité :** un `<div>` avec `tabindex="0"` et `role="button"` et `@keydown` manuel peut être rendu accessible, mais c'est plus de code, plus de surface de bug, et moins robuste qu'un `<button>` natif. Le HTML sémantique d'abord, ARIA en dernier recours.

### PIÈGE #2 — alternatives, focus, confusion WCAG/RGAA/ARIA, contraste mal calculé

> 📐 **Traité dans le cours 25 HTML & CSS**, module 01 pour les alternatives, module 16 pour le focus, module 00 pour la distinction WCAG, RGAA et ARIA, module 10 § 4.1 pour le calcul du ratio sur les couleurs réellement appliquées.

## 5. Ancrage TribuZen

Dans TribuZen, les principes de ce module s'appliquent **dès les premiers composants** — l'accessibilité est un choix architectural, pas un post-traitement.

**`GroupCard.vue`** (Exemple 1 de ce module) — carte des groupes sur le dashboard TribuZen. Tous les éléments interactifs sont des `<button>` natifs, l'icône est décorative (`alt=""`), les couleurs passent 4.5:1.

**`RegisterForm.vue`** (Exemple 2 de ce module) — formulaire d'inscription. Labels liés par `for/id`, `aria-invalid` + `aria-describedby` pour les erreurs, `role="alert"` pour l'annonce immédiate.

**`App.vue` — structure de landmarks** — `<header>`, `<main id="contenu-principal">`, `<footer>`, skip link sur le premier élément focusable. Ce squelette est posé une fois, tous les composants héritent de la structure.

**`AnimatedCard.vue`** — `prefers-reduced-motion` géré à la fois via CSS `@media` (instant, avant hydratation) et via composable Vue réactif (adaptation en cours de session si l'utilisateur change le réglage OS).

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    App.vue                        ← landmarks + skip link
    components/
      group/
        GroupCard.vue              ← Exemple 1 de ce module
      auth/
        RegisterForm.vue           ← Exemple 2 de ce module
      shared/
        AnimatedCard.vue           ← prefers-reduced-motion
    styles/
      tokens.css                   ← variables de couleur avec ratios garantis
```

---

## 6. Points clés

1. Tout critère WCAG appartient à l'un des quatre principes POUR — Perceptible, Opérable, Understandable (Compréhensible), Robuste.
2. Niveau AA = conformité à **tous** les critères A + tous les critères AA — les niveaux sont cumulatifs.
3. Le HTML sémantique (`<button>`, `<label>`, `<nav>`, `<main>`, hiérarchie de titres) est la première couche d'accessibilité, avant ARIA.
4. Ratio de contraste texte normal AA = **4.5:1** ; grand texte (≥ 24px ou ≥ 18,67px gras) AA = **3:1** ; composants UI non-textuels AA = **3:1** (WCAG 1.4.11).
5. `tabindex="1"` ou supérieur — **jamais** : crée un ordre de tabulation imprévisible. Seuls `0` (flux naturel) et `-1` (focus programmatique) sont légitimes.
6. `outline: none` sans remplacement = non-conformité WCAG 2.4.7 AA ; utiliser `:focus-visible` pour personnaliser sans supprimer.
7. Image décorative = `alt=""` vide obligatoire (attribut absent = non-conformité WCAG 1.1.1 A) ; image fonctionnelle = `alt` décrit la **fonction**, pas l'image.
8. WCAG (W3C) → EN 301 549 (ETSI, norme européenne) → RGAA 4.1 (DINUM, 106 critères + tests FR) — trois documents distincts, non interchangeables.
9. `prefers-reduced-motion: reduce` — toujours respecter via CSS `@media` et/ou composable Vue réactif.
10. ARIA complète HTML mais ne le remplace pas — **No ARIA is better than bad ARIA** (règle W3C).

---

## 7. Seeds Anki

```
Qu'est-ce que le modèle POUR et à quoi sert-il dans WCAG ?|POUR = Perceptible, Opérable, Understandable (Compréhensible), Robuste. Tout critère WCAG appartient à l'un de ces 4 principes. Sert à catégoriser et mémoriser les exigences.
Quelle est la différence entre les niveaux A, AA et AAA en WCAG ?|Les niveaux sont cumulatifs. Conforme AA = tous les critères A + tous les critères AA satisfaits. AAA non requis légalement en France. Le niveau A seul est insuffisant pour RGAA.
Quel est le ratio de contraste minimal WCAG AA pour du texte normal et pour du grand texte ?|Texte normal (< 24px et < 18,67px gras) : 4.5:1. Grand texte (≥ 24px OU ≥ 18,67px gras) : 3:1. Composants UI non-textuels (1.4.11) : 3:1.
Quelle est la chaîne normative exacte entre WCAG, EN 301 549 et RGAA ?|WCAG 2.1 (W3C, standard international) → EN 301 549 v3.1.1 (ETSI, norme européenne harmonisée, chapitre 9 = WCAG 2.1 AA) → RGAA 4.1 (DINUM, transposition FR, 106 critères + tests numérotés + déclaration accessibilité).
Quel est le comportement correct de tabindex="0", "-1" et d'une valeur positive ?|tabindex="0" : ajoute au flux Tab naturel. tabindex="-1" : retire du Tab mais permet focus programmatique. tabindex positif (≥1) : à ne jamais utiliser — crée un ordre imprévisible et est une mauvaise pratique.
Quelle valeur d'alt faut-il mettre sur une image décorative et pourquoi pas laisser l'attribut absent ?|alt="" vide — l'AT ignore l'image. Attribut absent : l'AT lit le nom de fichier (non-conformité WCAG 1.1.1 A). "décoratif" ou "icône" comme valeur = bruit — l'AT annonce quand même le texte.
Comment respecter prefers-reduced-motion dans un composant Vue 3 ?|Double approche : (1) CSS @media (prefers-reduced-motion: reduce) { transition: none } — immédiat, avant hydratation. (2) Composable Vue avec window.matchMedia + addEventListener('change') pour réactivité en cours de session.
Pourquoi préférer <button> à <div @click> même avec tabindex="0" et @keydown ?|<button> expose nativement role=button, est focusable, gère Enter ET Space sans code, est annoncé par les AT. Un <div> avec ARIA nécessite plus de code, plus de surface de bug, et reste moins robuste. HTML sémantique d'abord.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-38-accessibilite-fondamentaux-wcag/README.md`. Auditer et corriger un composant `MemberProfile.vue` non accessible — vrai navigateur, axe-core en CLI, corrigé commenté complet.
