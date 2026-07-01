# Lab 17 — Tests de composants (Vue Test Utils)

> **Outcome :** à la fin, tu sais tester un composant Vue 3 avec `@vue/test-utils` — vérifier le rendu d'après les props, simuler un clic, asserter un événement émis, couvrir les cas limites.
> **Vrai outil :** `@vue/test-utils` 2 + Vitest 3 — `vitest --run` est l'oracle. Zéro harnais simulé.
> **Feedback :** le coach valide en session sur la sortie de `vitest --run` — tous les tests doivent passer (exit 0).

---

## Énoncé

Tu travailles sur TribuZen. Le composant `FamilyCard.vue` existe déjà dans le projet — **tu ne le modifies pas**. Ta tâche : écrire le fichier de tests `FamilyCard.spec.ts` de zéro.

**Le composant à tester :**

```vue
<!-- src/components/family/FamilyCard.vue -->
<script setup lang="ts">
interface Family {
  id: string
  name: string
  memberCount: number
}

const props = defineProps<{ family: Family }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="family-card">
    <h2 class="family-card__name">{{ family.name }}</h2>
    <p class="family-card__count">{{ family.memberCount }} membre(s)</p>
    <button class="family-card__btn" @click="emit('select', family.id)">
      Sélectionner
    </button>
  </div>
</template>
```

**Comportements à couvrir (8 tests) :**

1. Affiche le nom de la famille reçu en prop.
2. Affiche le nombre de membres (`"4 membre(s)"`).
3. Affiche un bouton avec le texte `"Sélectionner"`.
4. Le bouton n'est pas désactivé par défaut.
5. Émet l'événement `select` au clic sur le bouton.
6. Émet `select` avec l'id exact de la famille comme argument.
7. N'émet pas `select` avant qu'un clic ait eu lieu.
8. Met à jour l'affichage quand la prop `family` change (`setProps`).

**Pas de gap-fill** — tu écris le fichier de A à Z à partir du starter minimal.

### Starter minimal

Crée `src/components/family/__tests__/FamilyCard.spec.ts` dans ton projet Vite+Vitest :

```ts
// FamilyCard.spec.ts — starter
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FamilyCard from '../FamilyCard.vue'

const famille = { id: 'f1', name: 'Les Martin', memberCount: 4 }

describe('FamilyCard', () => {
  // À toi d'écrire les 8 tests ici
})
```

Lance `vitest --run src/components/family/__tests__/FamilyCard.spec.ts` pour valider.

---

## Étapes (en friction)

1. **Test 1 — rendu du nom :** monte `FamilyCard` avec `famille` en prop. Utilise `wrapper.text()` pour asserter que `"Les Martin"` est visible.

2. **Test 2 — rendu du compte :** monte et cible `.family-card__count` avec `wrapper.get()`. Vérifie que le texte est exactement `"4 membre(s)"` (`.toBe()`, pas `.toContain()`).

3. **Test 3 — présence du bouton :** vérifie le texte du `<button>` en passant par `wrapper.get('button').text()`.

4. **Test 4 — bouton actif :** vérifie que `wrapper.get('button').attributes('disabled')` est `undefined`.

5. **Test 5 — émission de select :** `await wrapper.find('button').trigger('click')` puis `expect(wrapper.emitted('select')).toBeTruthy()`.

6. **Test 6 — argument de l'émission :** après le clic, vérifie que `wrapper.emitted('select')![0]` est `toEqual(['f1'])`.

7. **Test 7 — pas d'émission avant clic :** monte le composant sans déclencher de trigger. Vérifie que `wrapper.emitted('select')` est `undefined`.

8. **Test 8 — mise à jour dynamique :** après le montage avec `famille`, appelle `await wrapper.setProps({ family: { id: 'f2', name: 'Les Dupont', memberCount: 2 } })`. Vérifie que `wrapper.get('h2').text()` est `"Les Dupont"`.

---

## Corrigé complet commenté

```ts
// src/components/family/__tests__/FamilyCard.spec.ts — corrigé
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FamilyCard from '../FamilyCard.vue'

// Donnée de test partagée — définie une fois en dehors des describe
// pour éviter la duplication sans introduction de before* complexes
const famille = { id: 'f1', name: 'Les Martin', memberCount: 4 }

describe('FamilyCard — rendu des props', () => {
  it('affiche le nom de la famille', () => {
    // mount() crée le composant en mémoire — pas de navigateur réel
    // L'option props passe les données comme le ferait un composant parent
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // wrapper.text() retourne tout le texte visible, sans balises HTML
    // toContain() suffit ici : on ne teste pas la mise en page, juste la présence
    expect(wrapper.text()).toContain('Les Martin')
  })

  it('affiche le nombre de membres', () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // wrapper.get() cible un élément par sélecteur CSS
    // get() lève une erreur explicite si l'élément est absent (meilleur que find())
    // .text() retourne le texte de cet élément seulement
    expect(wrapper.get('.family-card__count').text()).toBe('4 membre(s)')
  })

  it('affiche un bouton Sélectionner', () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // Cibler le bouton et vérifier son texte exact
    expect(wrapper.get('button').text()).toBe('Sélectionner')
  })

  it('le bouton n\'est pas désactivé par défaut', () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // .attributes('disabled') retourne la valeur de l'attribut HTML 'disabled'
    // Si le bouton est actif, l'attribut est absent → retourne undefined
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
  })

  it('met à jour l\'affichage quand la prop family change', async () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // setProps() met à jour les props et retourne une Promise
    // await garantit que Vue a mis à jour le DOM avant l'assertion
    await wrapper.setProps({
      family: { id: 'f2', name: 'Les Dupont', memberCount: 2 },
    })

    // Vérifier le nouvel état du rendu
    expect(wrapper.get('h2').text()).toBe('Les Dupont')
    expect(wrapper.get('.family-card__count').text()).toBe('2 membre(s)')
  })
})

describe('FamilyCard — émission d\'événements', () => {
  it('émet l\'événement select au clic sur le bouton', async () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // trigger() simule l'événement DOM 'click' sur le bouton
    // TOUJOURS await : Vue traite le clic de façon asynchrone
    await wrapper.find('button').trigger('click')

    // wrapper.emitted('select') retourne undefined si jamais émis
    // ou un tableau de tableaux d'arguments si émis
    expect(wrapper.emitted('select')).toBeTruthy()
  })

  it('émet select avec l\'id de la famille comme argument', async () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    await wrapper.find('button').trigger('click')

    // Structure de emitted() :
    // { select: [ ['f1'] ] }
    //            ↑          ↑
    //       tableau         tableau des émissions
    //       d'émissions     [0] = 1ère émission
    //                       contient les arguments de l'émission
    //
    // wrapper.emitted('select')![0] = ['f1'] (tableau des args de la 1ère émission)
    // Le "!" = assertion TypeScript : on sait que ce n'est pas undefined ici
    expect(wrapper.emitted('select')![0]).toEqual(['f1'])
  })

  it('n\'émet pas select avant le clic', () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // Aucun trigger — l'événement ne doit pas avoir été émis
    // emitted('select') retourne undefined si l'événement n'a pas été émis
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
```

**Pourquoi ce corrigé est correct :**

- Chaque `it` teste **un seul comportement** — si un test échoue, l'erreur est immédiatement localisée.
- On ne lit jamais `wrapper.vm.someProp` — on teste ce que l'utilisateur voit (texte, attributs) et ce que le composant communique (événements émis).
- `get()` plutôt que `find()` partout où l'élément doit exister — le message d'erreur de Vitest est plus précis.
- `await` systématique sur `trigger()` et `setProps()` — les oublis de `await` sont la première cause de tests flaky en Vue Test Utils.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — en 25 minutes, sans ouvrir ce corrigé :**

Reproduis les 8 tests de `FamilyCard.spec.ts` **de mémoire**, avec cette contrainte supplémentaire :

`FamilyCard` reçoit maintenant une prop optionnelle `disabled: boolean`. Quand `disabled` est `true` :
- Le bouton a l'attribut HTML `disabled`.
- Le clic ne doit PAS émettre `select`.

Ajoute deux tests supplémentaires :

1. `'désactive le bouton quand disabled = true'` — vérifier `attributes('disabled')`.
2. `'n\'émet pas select si le bouton est désactivé'` — trigger click, vérifier `emitted('select')` toujours `undefined`.

**Critère de réussite :** `vitest --run` passe en exit 0 — tous les tests verts, zéro console.error.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les tests de composants vivent à côté de leurs composants :

```
tribuzen/
  src/
    components/
      family/
        FamilyCard.vue
        __tests__/
          FamilyCard.spec.ts    ← ce que tu viens d'écrire
```

**Différences par rapport au lab :**

- `FamilyCard.vue` dans le vrai projet reçoit ses données depuis un composable `useFamilies()` via props du parent `FamilyPage.vue` — mais les tests restent identiques : on passe la prop directement au `mount()`, le composant ne sait pas d'où viennent les données.
- Le projet TribuZen utilise `vitest.config.ts` avec `@vitejs/plugin-vue` et l'alias `@` configuré — vérifier que la config est en place avant de lancer les tests.
- Les tests d'intégration (`FamilyPage` + `FamilyCard` + routing + Pinia) sont au module 18.

**Commit cible :**

```
test(family): FamilyCard — rendu props, émission select, cas limite (8 tests)
```
