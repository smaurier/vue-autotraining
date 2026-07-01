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

### 2.1 Le modèle POUR — quatre principes WCAG

WCAG (Web Content Accessibility Guidelines) structure **tous ses critères** autour de quatre principes mnémotechniques : **P**erceptible, **O**pérable, **U**tilisable (compréhensible), **R**obuste — abrégé POUR en français (POUR = Perceivable, Operable, Understandable, Robust).

**P — Perceptible**
Toute information et tout composant d'interface doit être présentable à l'utilisateur de manière qu'il puisse le percevoir. Cela exclut un canal sensoriel unique.

Exemples de critères :
- Images avec alternatives textuelles (1.1.1 A)
- Contenu audio/vidéo avec sous-titres et transcriptions
- Contraste texte/fond suffisant (1.4.3 AA, 1.4.6 AAA)
- Pas d'information transmise par la couleur seule (1.4.1 A)
- Contenu redimensionnable sans perte d'information jusqu'à 200 % (1.4.4 AA)

**O — Opérable**
Tout composant d'interface et toute navigation doit être opérable. L'utilisateur doit pouvoir interagir, quelle que soit sa modalité d'entrée.

Exemples de critères :
- Tout contenu navigable au clavier, sans piège (2.1.1 A, 2.1.2 A)
- Délais suffisants et ajustables (2.2.1 A)
- Aucune animation qui clignote plus de 3 fois/seconde (2.3.1 A)
- Mécanisme pour sauter les blocs répétitifs — skip link (2.4.1 A)
- Focus visible sur les éléments interactifs (2.4.7 AA → 2.4.11 AA en WCAG 2.2)

**U — Compréhensible (Understandable)**
L'information et le fonctionnement de l'interface doivent être compréhensibles.

Exemples de critères :
- Langue de la page déclarée (3.1.1 A : `<html lang="fr">`)
- Comportement prévisible : pas de changement de contexte automatique au focus (3.2.1 A)
- Labels visibles associés aux champs (3.3.2 A)
- Messages d'erreur identifiant le champ et suggérant une correction (3.3.1 A, 3.3.3 AA)

**R — Robuste (Robust)**
Le contenu doit être suffisamment robuste pour être interprété de façon fiable par les agents utilisateurs, y compris les technologies d'assistance actuelles et futures.

Exemples de critères :
- HTML valide, avec début/fin de balises correctes (4.1.1 A — **supprimé dans WCAG 2.2**, intégré implicitement)
- Rôle, nom, valeur programmable pour tous les composants d'interface (4.1.2 A)
- Messages de statut rendus aux AT sans prise de focus (4.1.3 AA)

---

### 2.2 Niveaux de conformité A, AA, AAA

WCAG définit **trois niveaux** de conformité. Chaque critère appartient à un et un seul niveau.

| Niveau | Signification | Obligation légale (France) |
|--------|--------------|---------------------------|
| **A** | Plancher minimal — le contenu reste inutilisable sans conformité A | Oui — tous les acteurs |
| **AA** | Cible standard — bonne expérience pour la majorité des utilisateurs en situation de handicap | Oui — obligatoire RGAA (services publics, EAA secteur privé depuis 06/2025) |
| **AAA** | Excellence — souvent impossible pour des contenus diversifiés | Non requis ; viser quand le contexte le permet |

**Règle cardinale :** un service dit "conforme AA" est conforme à **tous les critères A ET tous les critères AA**. Le niveau AA n'efface pas le niveau A.

WCAG 2.1 (2018) est la base de RGAA 4.1. WCAG 2.2 (octobre 2023) ajoute neuf nouveaux critères (dont 2.4.11 Focus Appearance, 2.5.8 Target Size Minimum AA) et supprime 4.1.1 Parsing. La mise à jour de RGAA pour refléter WCAG 2.2 est en cours à la date de ce module (DINUM).

---

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

### 2.4 Contraste des couleurs

WCAG 1.4.3 (AA) et 1.4.6 (AAA) définissent des **ratios de contraste minimaux** entre la couleur du texte et celle de l'arrière-plan direct.

**Ratios WCAG 2.1 AA (1.4.3)**

| Type de texte | Ratio minimal AA | Ratio minimal AAA (1.4.6) |
|--------------|-----------------|--------------------------|
| Texte normal (< 18pt / < 14pt gras) | **4.5:1** | 7:1 |
| Grand texte (≥ 18pt normal OU ≥ 14pt gras) | **3:1** | 4.5:1 |
| Texte dans les logotypes | Aucun | Aucun |
| Texte décoratif (invisible fonctionnellement) | Aucun | Aucun |

> **Précision taille :** 18pt = 24px en CSS (1pt = 1.333px). 14pt = ~18.67px. Vérifier avec la taille calculée dans DevTools, pas la valeur de la règle CSS qui peut être héritée ou modifiée.

**WCAG 1.4.11 (AA, ajouté en 2.1) — Non-text contrast**
Les composants d'interface (bordures de champs de formulaire, icônes informatives, indicateurs d'état) doivent avoir un ratio ≥ 3:1 par rapport au fond adjacent.

```vue
<style scoped>
/* Exemples de ratios — vérifier avec un outil (Colour Contrast Analyser, WebAIM) */

/* ✅ #1a1a1a sur #fff ≈ 19.4:1 — conforme A, AA, AAA */
.text-primary { color: #1a1a1a; background: #fff; }

/* ✅ #595959 sur #fff ≈ 7.0:1 — conforme AA et AAA pour texte normal */
.text-secondary { color: #595959; background: #fff; }

/* ✅ #767676 sur #fff ≈ 4.5:1 — conforme AA texte normal (limite exacte) */
.text-muted { color: #767676; background: #fff; }

/* ❌ #aaa (#aaaaaa) sur #fff ≈ 2.3:1 — non conforme (utilisé dans le cas concret) */
/* .text-light { color: #aaa; background: #fff; } */

/* ✅ Grand texte (≥ 24px) : #959595 sur #fff ≈ 3.0:1 — AA suffit pour grand texte */
.heading-large { color: #959595; background: #fff; font-size: 1.5rem; }
</style>
```

---

### 2.5 Navigation au clavier et focus visible

**Navigation au clavier**

Tout élément interactif doit être accessible et activable au clavier. L'ordre de tabulation doit être logique (correspond à l'ordre visuel et au DOM).

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

// ✅ Gestion clavier pour un pattern custom nécessitant @keydown
// (pour un <button> natif, Enter et Space fonctionnent sans cela)
function handleToggleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault() // empêche le scroll sur Space
    isOpen.value = !isOpen.value
  }
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}
</script>

<template>
  <!-- ✅ <button> natif : Enter et Space gérés automatiquement par le navigateur -->
  <button
    @click="isOpen = !isOpen"
    :aria-expanded="isOpen"
  >
    {{ isOpen ? 'Fermer' : 'Ouvrir' }} les paramètres
  </button>

  <!-- tabindex="-1" : retire l'élément du flux de tabulation tout en
       permettant de le focus programmatiquement -->
  <div v-if="isOpen" tabindex="-1">
    <!-- contenu -->
  </div>
</template>
```

**`tabindex` — règles d'usage**

| Valeur | Effet | Quand l'utiliser |
|--------|-------|-----------------|
| `tabindex="0"` | Ajoute l'élément dans le flux naturel de Tab | Rendre focusable un élément non interactif (rare) |
| `tabindex="-1"` | Exclut du Tab mais permet `element.focus()` | Focus programmatique (après changement de route, modales) |
| `tabindex="n"` (n ≥ 1) | **Ne jamais utiliser** — crée un ordre de tab imprévisible | Jamais |

**Focus visible**

WCAG 2.4.7 (AA) exige un indicateur de focus visible. WCAG 2.2 ajoute 2.4.11 (AA) : l'indicateur de focus doit avoir un ratio de contraste ≥ 3:1 entre l'état avec focus et sans focus, et une surface minimale.

```vue
<style scoped>
/*
  ❌ JAMAIS supprimer le focus sans le remplacer
  button:focus { outline: none; }
*/

/*
  ✅ Personnaliser l'outline sans le supprimer
  :focus-visible est préférable à :focus pour éviter l'outline
  sur les clics souris tout en le gardant pour le clavier
*/
button:focus-visible {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}

/*
  ✅ Pour des tokens de design system : utiliser une variable CSS
*/
:root {
  --focus-ring: 3px solid #0066cc;
  --focus-ring-offset: 2px;
}

.interactive:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
</style>
```

---

### 2.6 Images et alternatives textuelles

La règle est simple en apparence mais cache plusieurs cas distincts. Se tromper de cas est une non-conformité fréquente.

**Cas 1 — Image informative**
L'image apporte une information non présente ailleurs dans le contexte immédiat.

```vue
<template>
  <!-- ✅ alt = description concise de l'information véhiculée -->
  <!-- Pas "photo de" ou "image de" — les AT annoncent déjà "image" -->
  <img src="/photos/famille-martin.jpg" alt="La famille Martin, quatre personnes souriantes en extérieur" />
</template>
```

**Cas 2 — Image décorative**
L'image ne véhicule aucune information ; sa suppression ne causerait aucune perte d'information.

```vue
<template>
  <!--
    ✅ alt="" vide — le lecteur d'écran ignore l'image
    role="presentation" ou role="none" : redondant avec alt="" mais
    parfois ajouté pour clarté ou compatibilité AT anciens.
    alt="" est obligatoire — l'attribut absent déclencherait une
    non-conformité WCAG 1.1.1 A : les AT liraient le nom de fichier.
  -->
  <img src="/decorations/wave.svg" alt="" role="presentation" />
</template>
```

**Cas 3 — Image fonctionnelle (bouton/lien iconique)**
L'image remplit une fonction — alt décrit la **fonction**, pas l'image.

```vue
<template>
  <!-- ✅ alt = ce que fait le bouton, pas ce que représente l'icône -->
  <button>
    <img src="/icons/close.svg" alt="Fermer le panneau" />
  </button>

  <!-- Avec SVG inline : aria-label sur le bouton, aria-hidden sur le SVG -->
  <button aria-label="Fermer le panneau">
    <svg aria-hidden="true" focusable="false"><!-- ... --></svg>
  </button>
</template>
```

**Cas 4 — Image complexe (graphique, diagramme, carte)**
Un alt court ne suffit pas — nécessite une description longue.

```vue
<template>
  <!-- ✅ alt court + description longue accessible -->
  <figure>
    <img
      src="/charts/activite-groupes.png"
      alt="Graphique d'activité des groupes TribuZen"
      aria-describedby="chart-desc"
    />
    <figcaption id="chart-desc">
      Évolution du nombre de messages par groupe sur 6 mois.
      Le groupe "Famille Dupont" affiche la plus forte croissance avec 340 messages en juin.
    </figcaption>
  </figure>
</template>
```

---

### 2.7 WCAG, EN 301 549 et RGAA — la chaîne normative exacte

C'est le point le plus souvent mal compris. Voici la chaîne complète.

**WCAG — Web Content Accessibility Guidelines**

Produit par le W3C (World Wide Web Consortium), groupe de travail AGWG. Document technique international, pas un texte légal.
- WCAG 2.0 (2008) — première version stable, référence historique
- WCAG 2.1 (juin 2018) — 17 nouveaux critères, notamment mobile et cognitif
- WCAG 2.2 (octobre 2023) — 9 nouveaux critères, suppression 4.1.1

WCAG définit des **critères de succès** (success criteria) organisés selon POUR, par niveau A/AA/AAA. Ce n'est pas une méthode de test — les tests sont à la charge des implémenteurs.

**EN 301 549 — Norme européenne harmonisée**

Produite par l'ETSI (European Telecommunications Standards Institute), co-produite avec CEN et CENELEC. C'est la norme technique qui sert de base à la **directive WebAW** (UE 2016/2102, services publics) et à la **directive EAA** (European Accessibility Act, UE 2019/882, secteur privé, applicable depuis juin 2025 en France).

La version 3.x d'EN 301 549 intègre WCAG 2.1 AA par référence (chapitre 9 pour le web). Elle ajoute des exigences pour les logiciels non-web, la documentation, les services d'assistance.

**RGAA — Référentiel Général d'Amélioration de l'Accessibilité**

Produit par la DINUM (Direction Interministérielle du Numérique). Transposition française d'EN 301 549 en méthode de test opérationnelle.

RGAA 4.1 (2021, actuel) :
- Base normative : WCAG 2.1 niveau AA (via EN 301 549 v3.1.1)
- Structure : **13 thématiques**, **106 critères**, chaque critère avec 1 à N **tests numérotés** (ex. critère 1.1, test 1.1.1)
- Méthode de test prescriptive : chaque test décrit exactement la procédure de vérification
- Périmètre légal : services de communication publique en ligne (LCEN art. 47) → organismes publics et délégataires de service public ; pénalités jusqu'à 20 000 € / an
- Obligations associées : déclaration d'accessibilité publiée, schéma pluriannuel, plan annuel

**Résumé des distinctions — tableau**

| | WCAG 2.1/2.2 | EN 301 549 | RGAA 4.1 |
|---|---|---|---|
| Auteur | W3C | ETSI/CEN/CENELEC | DINUM |
| Nature | Standard technique international | Norme européenne harmonisée | Référentiel national français |
| Base légale directe | Non | Directive UE (WebAW + EAA) | LCEN art. 47 + décret 2019-768 |
| Tests définis | Non (critères sans procédure) | Non | Oui (tests numérotés précis) |
| Périmètre | Contenu web | Web + non-web + doc + services | Services publics FR principalement |
| WCAG intégré | — | Chapitre 9 = WCAG 2.1 AA | Via EN 301 549 |

**ARIA n'est pas WCAG, n'est pas RGAA**

ARIA (Accessible Rich Internet Applications, W3C WAI) est une **spécification technique** de sémantique supplémentaire. WCAG référence ARIA dans certains critères (notamment 4.1.2), mais ARIA est indépendant de WCAG. RGAA teste les critères WCAG et peut prescrire l'usage d'ARIA pour satisfaire un test — mais ARIA n'est pas le référentiel.

---

### 2.8 `prefers-reduced-motion`

La media query `prefers-reduced-motion` reflète la préférence système de l'utilisateur (réglage OS "Réduire les animations").

**Cadrage normatif :** `prefers-reduced-motion` est une bonne pratique alignée sur **WCAG 2.3.3 — Animation from Interactions (niveau AAA, hors périmètre RGAA 4.1)**. Elle n'est pas une obligation RGAA, mais reste **fortement recommandée**. À ne pas confondre avec **RGAA 13.8**, qui porte sur le **contrôle utilisateur des contenus animés autolancés** (lecture automatique — bouton play/pause/stop, correspondant à WCAG 2.2.2 Pause, Stop, Hide, niveau AA). Ces deux notions sont distinctes : RGAA 13.8 impose qu'une animation démarrant automatiquement puisse être stoppée par l'utilisateur ; `prefers-reduced-motion` permet de respecter la préférence OS pour réduire globalement toutes les animations, indépendamment du caractère autolancé.

```vue
<!-- AnimatedCard.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const prefersReducedMotion = ref(false)

onMounted(() => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = mediaQuery.matches

  // Réagir aux changements en cours de session (l'utilisateur change le réglage OS)
  mediaQuery.addEventListener('change', (e) => {
    prefersReducedMotion.value = e.matches
  })
})
</script>

<template>
  <!--
    :class conditionnel — supprime la classe d'animation si la préférence est active.
    Vue applique le changement réactif sans rechargement.
  -->
  <div :class="['card', { 'card--animated': !prefersReducedMotion }]">
    <slot />
  </div>
</template>

<style scoped>
.card--animated {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card--animated:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
}

/*
  Approche alternative purement CSS — plus simple et immédiate.
  Les deux approches (CSS + Vue réactif) sont complémentaires.
  La version CSS couvre les cas où JS n'est pas encore hydraté.
*/
@media (prefers-reduced-motion: reduce) {
  .card--animated {
    transition: none;
  }
}
</style>
```

---

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

### PIÈGE #2 — `alt` non vide sur image décorative

```vue
<template>
  <!-- ❌ alt="icône" ou alt="décoratif" sur une image décorative :
       le lecteur d'écran annonce "icône, image" — bruit informatif inutile.
       Même "décoratif" est lu et interrompt le flux. -->
  <img src="/icons/star.svg" alt="icône étoile décorative" />

  <!--
    ❌ alt absent (attribut non présent) :
    Les AT lisent le nom de fichier : "star point svg, image"
    Non-conformité WCAG 1.1.1 A
  -->
  <img src="/icons/star.svg" />

  <!-- ✅ alt="" vide : l'image est ignorée par les AT -->
  <img src="/icons/star.svg" alt="" />
</template>
```

### PIÈGE #3 — `outline: none` sans remplacement

```css
/* ❌ Suppression globale du focus — non-conformité WCAG 2.4.7 AA -->
* { outline: none; }
button:focus { outline: none; }

/* ✅ Personnalisation sans suppression */
button:focus-visible {
  outline: 3px solid #3182ce;
  outline-offset: 2px;
}

/*
  :focus-visible vs :focus :
  :focus s'applique à tous les événements focus (clic souris inclus)
  :focus-visible ne s'applique qu'aux focus "clavier" selon l'heuristique du navigateur
  Pour l'accessibilité : toujours conserver le style sur :focus-visible au minimum.
  Si le design system utilise :focus, c'est aussi valide — l'important est la visibilité.
*/
```

### PIÈGE #4 — Confondre WCAG, RGAA et ARIA

Confusion fréquente en entretien et en audit :

| Confusion | Réalité |
|-----------|---------|
| "RGAA = WCAG en français" | RGAA est une **transposition opérationnelle** de WCAG via EN 301 549, avec 106 critères et des tests précis — pas une simple traduction |
| "ARIA remplace le HTML sémantique" | ARIA **complète** HTML quand le HTML natif est insuffisant. Règle W3C : **No ARIA is better than bad ARIA** |
| "Conforme RGAA = conforme WCAG" | RGAA 4.1 cible WCAG 2.1 AA. Un service peut être conforme RGAA et non conforme WCAG 2.2 si de nouveaux critères ne sont pas couverts |
| "Niveau AAA requis en France" | Non — le niveau légal est AA. AAA est optionnel et parfois contradictoire entre contenus diversifiés |

### PIÈGE #5 — Ratio de contraste calculé sur la mauvaise couleur

Le ratio de contraste se calcule entre la couleur **effective** du texte et la couleur **effective** de l'arrière-plan **direct** (pas un arrière-plan parent éloigné ou un dégradé sous-jacent).

```css
/* ❌ Erreur : calculer sur les variables déclarées sans vérifier la couleur calculée */
:root { --color-text: #555; }
.card { background: linear-gradient(135deg, #f0f4f8, #e2e8f0); }
.card p { color: var(--color-text); } /* ratio #555 sur quoi exactement ? */

/*
  ✅ Utiliser les DevTools (Computed → color + background-color)
  ou un outil dédié (axe DevTools, Colour Contrast Analyser)
  sur la couleur calculée — jamais sur la valeur de variable CSS seule.
*/
```

---

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
