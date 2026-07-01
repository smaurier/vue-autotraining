# Lab 38 — Accessibilité — fondamentaux WCAG et RGAA

> **Outcome :** à la fin, tu sais auditer un composant Vue 3 existant avec axe-core CLI, identifier les non-conformités par critère WCAG/RGAA, et produire une version corrigée conforme niveau AA.
> **Vrai outil :** axe-core CLI (`@axe-core/cli`) + navigateur (DevTools Accessibility tree) + Colour Contrast Analyser.
> **Feedback :** le coach valide l'audit et les corrections en session — revue des violations axe-core + inspection manuelle clavier.

---

## Énoncé

Le composant `MemberProfile.vue` ci-dessous présente le profil d'un membre TribuZen. Il a été livré sans considération d'accessibilité. Ta mission est en deux temps :

**Temps 1 — Audit** : identifier toutes les non-conformités WCAG 2.1 AA présentes dans le composant. Pour chaque violation, préciser le critère WCAG (ex. 1.1.1 A) et la thématique RGAA correspondante (ex. thématique 1 — Images).

**Temps 2 — Correction** : produire `MemberProfile.vue` dans une version corrigée, conforme niveau AA. Chaque correction doit être justifiée par le critère WCAG satisfait.

### Composant à auditer

Crée `src/components/member/MemberProfile.vue` dans ton projet Vite et colle le code suivant :

```vue
<!-- MemberProfile.vue — VERSION NON ACCESSIBLE — à auditer et corriger -->
<script setup lang="ts">
import { ref } from 'vue'

interface Member {
  id: string
  displayName: string
  role: 'admin' | 'member'
  avatarUrl: string
  bio: string
  isOnline: boolean
}

const props = defineProps<{ member: Member }>()

const showContact = ref(false)
const notification = ref('')

function toggleContact(): void {
  showContact.value = !showContact.value
}

function sendMessage(): void {
  notification.value = `Message envoyé à ${props.member.displayName} !`
}
</script>

<template>
  <div class="profile">

    <img :src="member.avatarUrl" />

    <div class="profile__status" :style="{ color: member.isOnline ? 'green' : 'gray' }">
      {{ member.isOnline ? '● En ligne' : '● Hors ligne' }}
    </div>

    <div class="profile__name" style="font-size: 20px; color: #999;">
      {{ member.displayName }}
    </div>

    <div class="profile__role" style="color: #bbb;">
      {{ member.role === 'admin' ? 'Administrateur' : 'Membre' }}
    </div>

    <p class="profile__bio">{{ member.bio }}</p>

    <div class="actions">
      <div class="btn" @click="toggleContact" style="cursor:pointer;">
        Coordonnées
      </div>
      <div class="btn" @click="sendMessage" style="cursor:pointer;">
        Envoyer un message
      </div>
    </div>

    <div v-if="showContact" class="contact-panel">
      <div class="close" @click="showContact = false" style="cursor:pointer;">X</div>
      <p>Email : contact@tribuzen.app</p>
      <p>Téléphone : 06 00 00 00 00</p>
    </div>

    <p v-if="notification">{{ notification }}</p>

  </div>
</template>

<style scoped>
.profile {
  padding: 1.5rem;
  background: #fff;
}
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn {
  padding: 0.5rem 1rem;
  background: #e2e8f0;
  border-radius: 4px;
}
.contact-panel {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}
</style>
```

---

## Étapes (en friction)

### Phase A — Audit automatisé

1. **Lance axe-core CLI** sur l'URL locale de ton composant (intégré dans `App.vue`).

```bash
# Installation (une fois)
npm install -g @axe-core/cli

# Lancer le dev server (autre terminal)
pnpm dev

# Audit — remplace 3000 par ton port si différent
axe http://localhost:3000 --save audit-report.json
```

Parcours chaque violation : note l'`id` de la règle axe, le nœud DOM en cause, et l'impact (`critical`, `serious`, `moderate`, `minor`).

2. **Inspection DevTools Accessibility tree** (F12 → onglet Accessibility) — examine le rôle, le nom accessible et l'état de chaque élément interactif. Note ce qui est absent ou incorrect.

3. **Test clavier** — sans souris, navigue avec `Tab`, `Shift+Tab`, `Enter`, `Space`. Documente les éléments non atteignables et les pièges.

4. **Test contraste** — ouvre Colour Contrast Analyser (ou l'inspecteur DevTools) et mesure le ratio de chaque couleur de texte sur son fond direct. Compare aux seuils AA.

5. **Rédige ton tableau d'audit** avant de corriger (voir format ci-dessous) :

```
| Nœud DOM concerné | Violation | Critère WCAG | Thématique RGAA | Impact |
|---|---|---|---|---|
| <img :src="avatarUrl"> | alt manquant | 1.1.1 A | Thématique 1 — Images | critical |
| ... | ... | ... | ... | ... |
```

---

### Phase B — Correction

6. **Corrige chaque violation** dans `MemberProfile.vue`. Pour chaque correction, ajoute un commentaire indiquant le critère WCAG satisfait — c'est la pratique en audit RGAA (les tests sont tracés).

7. **Vérifie les couleurs** en remplaçant les valeurs non conformes par des tokens qui passent le ratio. Documente le ratio calculé dans un commentaire.

8. **Remplace les `<div @click>`** par des éléments natifs appropriés (`<button>` pour les actions, `<a href>` pour la navigation).

9. **Gère la notification** de façon à ce qu'elle soit annoncée par les AT sans déplacer le focus.

10. **Re-passe axe-core** après correction — objectif zéro violation `critical` et `serious`.

---

## Corrigé complet commenté

```vue
<!-- MemberProfile.vue — VERSION ACCESSIBLE — corrigé commenté -->
<script setup lang="ts">
import { ref } from 'vue'

interface Member {
  id: string
  displayName: string
  role: 'admin' | 'member'
  avatarUrl: string
  bio: string
  isOnline: boolean
}

const props = defineProps<{ member: Member }>()

const showContact = ref(false)
const notification = ref('')

function toggleContact(): void {
  showContact.value = !showContact.value
}

function sendMessage(): void {
  notification.value = `Message envoyé à ${props.member.displayName} !`
  // Effacer après 5 s pour ne pas polluer les annonces futures
  setTimeout(() => { notification.value = '' }, 5000)
}

function closeContact(): void {
  showContact.value = false
}
</script>

<template>
  <article class="profile" :aria-label="`Profil de ${member.displayName}`">
    <!--
      WCAG 1.1.1 A — alt descriptif sur image informative.
      RGAA thématique 1 — Images, test 1.1.1.
      L'avatar identifie visuellement la personne : alt décrit ce rôle.
      Si l'avatar était purement décoratif (ex. icône générique quand pas de photo),
      on utiliserait alt="" + aria-hidden="true".
    -->
    <img
      :src="member.avatarUrl"
      :alt="`Photo de profil de ${member.displayName}`"
      class="profile__avatar"
    />

    <!--
      WCAG 1.4.1 A — ne pas transmettre l'information par la couleur seule.
      RGAA thématique 3 — Couleurs, test 3.1.1.
      Le statut en ligne est transmis par texte ET par couleur.
      La couleur renforce l'information mais n'est pas le seul vecteur.

      WCAG 1.4.3 AA — contraste.
      green (#008000) sur #fff = 5.1:1 — conforme AA texte normal.
      gray (#808080) sur #fff = 3.95:1 — insuffisant pour texte normal (4.5:1 requis).
      → On remplace par #595959 (7:1) pour "Hors ligne".
    -->
    <div
      class="profile__status"
      :class="member.isOnline ? 'status--online' : 'status--offline'"
    >
      <span aria-hidden="true">●</span>
      {{ member.isOnline ? 'En ligne' : 'Hors ligne' }}
    </div>

    <!--
      WCAG 1.4.3 AA — contraste texte.
      #999 (#999999) sur #fff = 2.85:1 — non conforme AA pour texte normal.
      → #2d3748 sur #fff = 11.7:1 — conforme AA et AAA.
      RGAA thématique 3 — Couleurs, test 3.2.1.

      Utilise <h2> si GroupCard (module 38) est sous un <h1> de page.
      Adaptez le niveau selon la hiérarchie réelle de la page.
    -->
    <h2 class="profile__name">{{ member.displayName }}</h2>

    <!--
      WCAG 1.4.3 AA — #bbb (#bbbbbb) sur #fff = 1.73:1 — critique, non conforme.
      → #595959 sur #fff = 7.0:1 — conforme AA et AAA.
    -->
    <p class="profile__role">
      {{ member.role === 'admin' ? 'Administrateur' : 'Membre' }}
    </p>

    <p class="profile__bio">{{ member.bio }}</p>

    <div class="actions">
      <!--
        WCAG 2.1.1 A + 4.1.2 A — <button> natif.
        RGAA thématique 7 — Scripts, test 7.1.1 + thématique 11 — Formulaires.
        Remplace <div @click> : focus, Enter, Space, role=button natifs.
        aria-expanded : état du panneau coordonnées.
        aria-controls : lie le bouton au panneau qu'il contrôle.
      -->
      <button
        class="btn"
        @click="toggleContact"
        :aria-expanded="showContact"
        aria-controls="contact-panel"
      >
        Coordonnées
      </button>

      <!--
        WCAG 2.1.1 A + 4.1.2 A — <button> natif.
      -->
      <button class="btn" @click="sendMessage">
        Envoyer un message
      </button>
    </div>

    <!--
      Panneau coordonnées.
      id="contact-panel" lie au bouton via aria-controls.
      tabindex="-1" permet le focus programmatique si on veut
      déplacer le focus à l'ouverture (pattern avancé — module 39).
    -->
    <div
      v-if="showContact"
      id="contact-panel"
      class="contact-panel"
      tabindex="-1"
    >
      <!--
        WCAG 2.1.1 A — bouton de fermeture natif.
        aria-label explicite car le glyphe "X" seul n'est pas un nom accessible.
        aria-hidden sur le glyphe évite l'annonce "X" en doublon.
      -->
      <button
        class="contact-panel__close"
        aria-label="Fermer les coordonnées"
        @click="closeContact"
      >
        <span aria-hidden="true">×</span>
      </button>
      <p>Email : contact@tribuzen.app</p>
      <p>Téléphone : 06 00 00 00 00</p>
    </div>

    <!--
      WCAG 4.1.3 AA — Messages de statut annoncés aux AT sans prise de focus.
      RGAA thématique 7 — Scripts, test 7.5.1.
      aria-live="polite" : annonce dès que le lecteur d'écran est libre.
      aria-atomic="true" : annonce le contenu complet du conteneur.
      La région doit exister dans le DOM dès le chargement (avant l'événement),
      sinon certains AT n'enregistrent pas la live region à temps.
    -->
    <div
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ notification }}
    </div>

  </article>
</template>

<style scoped>
.profile {
  padding: 1.5rem;
  background: #fff;
}

.profile__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

/*
  Statut — couleurs conformes 1.4.3 AA.
  green (#008000) sur #fff = 5.1:1 ✅
  #595959 sur #fff = 7.0:1 ✅ (remplace gray #808080 = 3.95:1 ❌)
*/
.status--online  { color: #008000; }
.status--offline { color: #595959; }

/*
  Nom — #2d3748 sur #fff = 11.7:1 ✅
  Remplace #999999 sur #fff = 2.85:1 ❌
*/
.profile__name {
  color: #2d3748;
  font-size: 1.25rem;  /* 20px — texte normal, seuil grand texte = 24px */
  font-weight: 600;
  margin: 0.5rem 0 0;
}

/*
  Rôle — #595959 sur #fff = 7.0:1 ✅
  Remplace #bbbbbb sur #fff = 1.73:1 ❌ (critique)
*/
.profile__role {
  color: #595959;
  font-size: 0.875rem;
  margin: 0.25rem 0 0.5rem;
}

.profile__bio {
  color: #4a5568; /* 7.4:1 sur #fff ✅ */
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  background: #e2e8f0;
  border: 1px solid #a0aec0; /* bordure composant UI 3:1+ ✅ */
  border-radius: 4px;
  color: #2d3748; /* 11.7:1 ✅ */
  cursor: pointer;
  font-size: 1rem;
}

/* Focus visible — WCAG 2.4.7 AA */
.btn:focus-visible,
.contact-panel__close:focus-visible {
  outline: 3px solid #3182ce;
  outline-offset: 2px;
}

.contact-panel {
  position: relative;
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
}

.contact-panel__close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #4a5568; /* 7.4:1 ✅ */
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem 0.5rem;
}

/*
  sr-only — classe standard pour contenu visible des AT uniquement.
  clip-path remplace l'ancienne propriété clip (dépréciée).
*/
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
```

---

## Tableau de synthèse — violations et corrections

| Violation initiale | Critère WCAG | Thématique RGAA | Correction |
|---|---|---|---|
| `<img>` sans attribut `alt` | 1.1.1 A | Thématique 1 — Images | `alt="Photo de profil de …"` (image informative) |
| Statut couleur seule (`color: green/gray`) | 1.4.1 A | Thématique 3 — Couleurs | Texte + couleur ; gris remplacé par #595959 |
| `color: #999` sur #fff (nom) — ratio 2.85:1 | 1.4.3 AA | Thématique 3 — Couleurs | `color: #2d3748` — ratio 11.7:1 |
| `color: #bbb` sur #fff (rôle) — ratio 1.73:1 | 1.4.3 AA | Thématique 3 — Couleurs | `color: #595959` — ratio 7.0:1 |
| `<div @click>` (deux boutons actions) | 2.1.1 A + 4.1.2 A | Thématique 7 — Scripts | `<button>` natif |
| `<div class="close" @click>` | 2.1.1 A + 4.1.2 A | Thématique 7 — Scripts | `<button aria-label="Fermer les coordonnées">` |
| `outline: none` implicite (pas de style focus) | 2.4.7 AA | Thématique 10 — Présentation | `:focus-visible` avec outline 3px #3182ce |
| Notification sans `aria-live` | 4.1.3 AA | Thématique 7 — Scripts | Région `aria-live="polite" aria-atomic="true"` |

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Reproduis l'audit et la correction **de mémoire, en 30 minutes**, sur un nouveau composant `EventCard.vue` que tu crées toi-même avec les mêmes catégories de violations (alt manquant, couleurs insuffisantes, `<div @click>`, focus absent, annonce dynamique sans live region). Puis :

1. Lance axe-core CLI avant et après correction — compare les rapports.
2. Ajoute `prefers-reduced-motion` : la carte a un hover animé qui doit être désactivé si la préférence est active.
3. **Sans ouvrir ce corrigé ni le module 38.**

**Critère de réussite :** zéro violation `critical` et `serious` dans le rapport axe post-correction + navigation clavier complète vérifiée manuellement.

---

## Application TribuZen

Dans `smaurier/tribuzen`, `MemberProfile.vue` corrigé vit ici :

```
tribuzen/
  src/
    components/
      member/
        MemberProfile.vue    ← ce corrigé
```

**Différences par rapport au lab :**

- Les couleurs utilisent les tokens CSS du design system TribuZen (`var(--color-text-primary)`, `var(--color-text-secondary)`) — les valeurs hex du lab deviennent des variables.
- Le skip link est géré dans `App.vue`, pas dans chaque composant.
- La structure `<h2>` du nom dépend du contexte de la page — vérifier la hiérarchie dans la vue parente avant de choisir le niveau.

**Commit cible :**
```
fix(member): MemberProfile — conformité WCAG AA (alt, contrastes, boutons natifs, focus, live region)
```
