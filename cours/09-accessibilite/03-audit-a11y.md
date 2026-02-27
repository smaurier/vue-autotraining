# 03 — Audit d'accessibilité

## C'est quoi un audit d'accessibilité ?

Un **audit d'accessibilité**, c'est vérifier que ton site respecte les **règles d'accessibilité** (WCAG) qu'on a vues dans les chapitres précédents.

> 🏗️ **Analogie** : c'est comme l'inspection d'un bâtiment. Un inspecteur vient vérifier que les **normes de sécurité** sont respectées : les issues de secours fonctionnent, les rampes sont aux bonnes dimensions, les extincteurs sont en place... Pour un site web, on vérifie que les images ont un texte alternatif, que le contraste est bon, que tout marche au clavier, etc.

**La bonne nouvelle** : il existe des **outils automatiques** qui font une partie du travail pour toi. La mauvaise nouvelle : ils ne détectent qu'environ **30%** des problèmes. Le reste nécessite des **tests manuels** (qu'on va aussi couvrir).

## Partie 1 : Les outils automatiques

### 🔍 axe DevTools (extension navigateur)

C'est l'outil le plus populaire. Il scanne ta page et liste tous les problèmes d'accessibilité qu'il trouve.

**Comment l'utiliser :**

```
1. Installe l'extension "axe DevTools" dans Chrome ou Firefox
   → Cherche "axe DevTools" dans le store d'extensions de ton navigateur
   → Clique "Ajouter" / "Installer"

2. Ouvre ta page web (par exemple http://localhost:5173)

3. Ouvre les DevTools (F12 ou Ctrl+Shift+I)

4. Va dans l'onglet "axe" (tout à droite des onglets)

5. Clique "Scan ALL of my page"

6. Tu obtiens une liste de problèmes, par exemple :
   🔴 Critical : "Images must have alternate text"
      → Il manque un attribut alt sur une image
   🟠 Serious : "Elements must have sufficient color contrast"
      → Le texte n'est pas assez contrasté par rapport au fond
   🟡 Minor : "Heading levels should only increase by one"
      → Tu es passé de <h1> à <h3> sans <h2> entre les deux
```

> 💡 Chaque problème trouvé inclut une **explication** et une **suggestion de correction**. C'est très pédagogique !

### 📝 eslint-plugin-vuejs-accessibility (détection dans le code)

Cet outil vérifie ton code **pendant que tu l'écris** dans VS Code. Il souligne les erreurs d'accessibilité directement dans l'éditeur, comme les fautes d'orthographe.

**Installation :**

```bash
# On installe le plugin comme dépendance de développement
# (-D = devDependency = pas inclus dans le site final)
pnpm add -D eslint-plugin-vuejs-accessibility
```

**Configuration :**

```js
// eslint.config.js — le fichier de configuration d'ESLint
// (ESLint = l'outil qui vérifie la qualité de ton code)

// On importe le plugin d'accessibilité Vue.js
import vuejsAccessibility from 'eslint-plugin-vuejs-accessibility'

export default [
  // ... tes autres configurations ESLint existantes

  // On active les règles d'accessibilité recommandées
  ...vuejsAccessibility.configs['flat/recommended'],
]
```

**Ce que ça détecte dans ton code :**

```vue
<!-- ❌ ESLint te prévient : "img elements must have an alt prop" -->
<!-- = "les images doivent avoir un attribut alt" -->
<img src="photo.jpg" />

<!-- ✅ Plus d'erreur ESLint -->
<img src="photo.jpg" alt="Photo de profil de l'utilisateur" />

<!-- ❌ ESLint te prévient : "A form label must be associated with a control" -->
<!-- = "un label doit être associé à un champ de formulaire" -->
<label>Nom</label>
<input type="text" />

<!-- ✅ Plus d'erreur — le label est lié au champ par for/id -->
<label for="name">Nom</label>
<input id="name" type="text" />

<!-- ❌ ESLint te prévient : "click events must be accompanied by key events" -->
<!-- = "un événement click doit aussi fonctionner au clavier" -->
<div @click="doSomething">Cliquez ici</div>

<!-- ✅ Mieux : utiliser un <button> (qui gère le clavier nativement) -->
<button @click="doSomething">Cliquez ici</button>
```

### 📚 Storybook addon a11y (si tu utilises Storybook)

> 📖 **C'est quoi Storybook ?** C'est un outil pour développer et tester tes composants Vue **isolément**, un par un. Si tu ne l'utilises pas, passe cette section.

```bash
# Installation
pnpm add -D @storybook/addon-a11y
```

```ts
// .storybook/main.ts — configuration de Storybook
addons: ['@storybook/addon-a11y']
```

Résultat : chaque composant dans Storybook affiche un **onglet "Accessibility"** avec les problèmes détectés. C'est pratique pour vérifier tes composants **un par un**.

### 🧪 vitest-axe (tests automatisés)

C'est l'outil le plus puissant : il vérifie l'accessibilité **automatiquement** à chaque fois que tu lances tes tests. Si un problème apparaît, le test échoue.

```bash
# Installation
pnpm add -D vitest-axe
```

```ts
// tests/ContactForm.a11y.test.ts
// Un fichier de test dédié à l'accessibilité

// On importe les outils de test
import { describe, it, expect } from 'vitest'
// describe = "je décris un groupe de tests"
// it = "un test individuel"
// expect = "je m'attends à ce que..."

import { mount } from '@vue/test-utils'
// mount = "rendre un composant Vue dans un environnement de test"

import { axe } from 'vitest-axe'
// axe = l'outil qui scanne le HTML pour trouver les problèmes d'accessibilité

import ContactForm from '@/components/ContactForm.vue'
// Le composant qu'on veut tester

// Groupe de tests pour l'accessibilité du formulaire de contact
describe('ContactForm — accessibilité', () => {

  // Test : le composant ne doit avoir AUCUNE violation WCAG
  it('ne contient aucune violation WCAG', async () => {
    // 1. On "monte" le composant (= on le rend dans un DOM virtuel)
    const wrapper = mount(ContactForm)

    // 2. On passe le HTML généré à axe pour analyse
    //    async/await car l'analyse prend un peu de temps
    const results = await axe(wrapper.element)

    // 3. On vérifie qu'il y a ZÉRO violation
    //    Si axe trouve un problème, le test ÉCHOUE
    expect(results.violations).toHaveLength(0)
    //    "je m'attends à ce que le tableau 'violations' ait 0 éléments"
  })
})
```

> 💡 **Astuce** : nomme tes fichiers de test `*.a11y.test.ts` pour les retrouver facilement et les lancer séparément si besoin.

## Partie 2 : Les tests manuels

Les outils automatiques sont géniaux, mais ils ne détectent qu'une partie des problèmes. Voici ce que tu dois tester **toi-même**.

### ⌨️ Test de navigation clavier

C'est le test le plus simple à faire et il détecte beaucoup de problèmes. **Pose ta souris et utilise uniquement le clavier** :

```
Comment tester :

1. Ouvre ta page dans le navigateur
2. Appuie sur Tab — le focus doit apparaître sur le premier élément interactif
3. Continue à appuyer sur Tab — tu dois pouvoir atteindre TOUS les éléments :
   ✅ Boutons
   ✅ Liens
   ✅ Champs de formulaire
   ✅ Menus déroulants
   ✅ etc.

Vérifie à chaque étape :
```

**Checklist de navigation clavier :**

- [ ] **Tab** parcourt tous les éléments interactifs dans un **ordre logique** (de haut en bas, de gauche à droite)
- [ ] **Enter** ou **Espace** active les boutons (ils font bien leur action)
- [ ] **Escape** ferme les modals et menus déroulants
- [ ] Les **flèches** permettent de naviguer dans les onglets et menus
- [ ] **Pas de piège clavier** : tu peux toujours sortir d'un élément (Tab ou Escape fonctionnent toujours)
- [ ] Le **focus est visible** : tu vois clairement quel élément est sélectionné (une bordure, un outline...)

> ⚠️ **Piège fréquent** : ne JAMAIS supprimer l'outline de focus en CSS (`outline: none`) sans le remplacer par un autre indicateur visuel. Sinon les utilisateurs clavier ne voient plus où ils sont !

### 🔊 Test avec un lecteur d'écran

C'est le test le plus révélateur : **ferme les yeux** (ou éteins ton écran) et essaie de naviguer sur ton site uniquement en écoutant.

**Lecteurs d'écran gratuits :**

| Lecteur | Plateforme | Comment l'activer |
| ------- | ---------- | ----------------- |
| **NVDA** | Windows | Télécharger gratuitement sur nvaccess.org |
| **VoiceOver** | macOS | Cmd + F5 (déjà installé !) |
| **VoiceOver** | iPhone | Réglages → Accessibilité → VoiceOver |
| **TalkBack** | Android | Réglages → Accessibilité → TalkBack |

**Que vérifier avec un lecteur d'écran :**

- [ ] Les **titres** sont en hiérarchie logique : h1 → h2 → h3 (pas de saut)
- [ ] Les **images** ont un alt pertinent (ou `alt=""` si l'image est purement décorative)
- [ ] Les **formulaires** sont navigables : chaque champ a un label qui est lu
- [ ] Les **erreurs** de formulaire sont **annoncées** quand elles apparaissent
- [ ] Les **zones dynamiques** sont annoncées (notifications, messages de chargement...)
- [ ] Les **liens et boutons** ont des labels compréhensibles (pas de "Cliquez ici" tout seul)

### 👁️ Tests visuels

- [ ] **Contraste suffisant** : ratio 4.5:1 minimum (utilise Chrome DevTools ou un outil en ligne)
- [ ] **Pas de dépendance à la couleur seule** : si un message est en rouge pour dire "erreur", ajoute aussi une icône ⚠️ ou un texte "Erreur"
- [ ] **Zoom 200%** : zoome ta page à 200% (Ctrl +), le contenu doit rester lisible sans scroll horizontal
- [ ] **Mode sombre** : si tu as un mode sombre, vérifie que les contrastes sont toujours bons

## Partie 3 : Lighthouse — le scanner intégré à Chrome

**Lighthouse** est un outil intégré à Chrome qui donne une **note sur 100** pour l'accessibilité de ta page. Pas besoin d'installer quoi que ce soit !

```
Comment l'utiliser :

1. Ouvre ta page dans Chrome
2. Ouvre DevTools (F12)
3. Va dans l'onglet "Lighthouse"
4. Coche "Accessibility" (décoche le reste si tu veux)
5. Clique "Analyze page load"
6. Attends quelques secondes...
7. Tu obtiens un score et une liste de recommandations !
```

Tu peux aussi l'utiliser en **ligne de commande** :

```bash
# Installation
pnpm add -D lighthouse

# Lance un audit sur ton site local
# --only-categories=accessibility = on ne vérifie que l'accessibilité
npx lighthouse http://localhost:5173 --only-categories=accessibility
```

> 💡 Vise un score de **90+** pour commencer, puis essaie d'atteindre **100**.

## Partie 4 : Automatiser dans la CI (intégration continue)

> 📖 **C'est quoi la CI ?** La CI (Continuous Integration = Intégration Continue), c'est quand ton code est **automatiquement testé** à chaque fois que tu le publies (par exemple sur GitHub). Si un test échoue, tu es prévenu avant de déployer un site cassé.

Tu peux ajouter les tests d'accessibilité à ta CI pour qu'ils soient vérifiés **automatiquement** :

```yaml
# .github/workflows/a11y.yml
# Ce fichier dit à GitHub : "à chaque push, lance ces vérifications"

# Étape 1 : lancer les tests vitest qui contiennent "a11y" dans leur nom
- name: Tests d'accessibilité (vitest-axe)
  run: pnpm test:run -- --grep "a11y"
  # --grep "a11y" = ne lance que les tests dont le nom contient "a11y"

# Étape 2 : lancer Lighthouse sur les pages principales du site
- name: Audit Lighthouse
  uses: treosh/lighthouse-ci-action@v11
  # C'est une "action GitHub" pré-faite qui lance Lighthouse pour toi
  with:
    urls: |
      http://localhost:5173/
      http://localhost:5173/login
    # On teste la page d'accueil et la page de connexion
```

**Résultat** : à chaque fois que quelqu'un modifie le code, les tests d'accessibilité sont lancés automatiquement. Si une image sans `alt` est ajoutée, le test échoue et tout le monde est prévenu.

## Résumé — Ta stratégie d'audit a11y

```
🔧 AUTOMATIQUE (fait le gros du travail pour toi) :
  1. eslint-plugin-vuejs-accessibility → erreurs dans l'éditeur en temps réel
  2. vitest-axe → tests automatisés qui échouent si problème
  3. Lighthouse CI → audit à chaque déploiement

🖐️ MANUEL (vérifie ce que les outils ne voient pas) :
  4. Navigation clavier → Tab, Enter, Escape
  5. Lecteur d'écran → NVDA / VoiceOver
  6. Contraste et zoom → vérification visuelle
```

> 🎉 **Encouragement** : l'accessibilité, c'est un **processus continu**, pas un état parfait. Même vérifier UN seul point (par exemple "est-ce que mes images ont un alt ?") est déjà un progrès énorme. Commence petit, améliore progressivement, et rappelle-toi : **chaque amélioration aide de vraies personnes** à utiliser ton site.

---

## 🎯 Pratique

### Exercice AUDIT.1 — Test vitest-axe

Écris un test d'accessibilité pour un composant Button :

```ts
import { render } from '@testing-library/vue'
import { axe, toHaveNoViolations } from 'vitest-axe'
import Button from './Button.vue'

expect.extend(toHaveNoViolations)

describe('Button a11y', () => {
  it('n\'a pas de violations d\'accessibilité', async () => {
    // ???
  })
})
```

<details>
<summary>Solution</summary>

```ts
describe('Button a11y', () => {
  it('n\'a pas de violations d\'accessibilité', async () => {
    const { container } = render(Button, {
      props: { label: 'Cliquez ici' }
    })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```
</details>

---

### Exercice AUDIT.2 — Test clavier

Quelles vérifications manuelles dois-tu faire pour ce composant Modal ?

<details>
<summary>Solution</summary>

1. **Focus initial** : le focus va-t-il automatiquement dans la modal à l'ouverture ?
2. **Tab** : le focus reste-t-il piégé dans la modal (ne sort pas derrière) ?
3. **Escape** : la modal se ferme-t-elle avec Escape ?
4. **Focus de retour** : après fermeture, le focus revient-il sur le bouton qui a ouvert la modal ?
</details>

---

### Exercice AUDIT.3 — Checklist rapide

Pour chaque élément, indique la vérification a11y prioritaire :

1. Image
2. Formulaire
3. Bouton icône
4. Modal
5. Notification dynamique

<details>
<summary>Solution</summary>

1. **Image** → Vérifier l'attribut `alt` (vide si décorative, descriptif si informative)
2. **Formulaire** → Vérifier les `<label>` associés aux inputs
3. **Bouton icône** → Vérifier `aria-label`
4. **Modal** → Vérifier focus trap et fermeture avec Escape
5. **Notification** → Vérifier `aria-live="polite"` ou `role="alert"`
</details>

---

## Exercice

→ `exercices/16-a11y-audit/ENONCE.md`
