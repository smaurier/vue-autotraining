# 03 — Tests unitaires (Vitest)

## C'est quoi un test unitaire ? 🧪

Imagine que tu construis une calculatrice. Avant de la vendre, tu vérifies que :
- 2 + 2 donne bien 4
- 10 - 3 donne bien 7
- 5 × 0 donne bien 0

**Un test unitaire, c'est exactement ça** : un petit programme qui vérifie automatiquement qu'un morceau de ton code fonctionne correctement.

> **Analogie** : c'est comme un correcteur orthographique pour ton code. Au lieu de vérifier l'orthographe, il vérifie que tes fonctions donnent les bons résultats.

### Pourquoi écrire des tests ?

- **Attraper les bugs avant les utilisateurs** : tu trouves les erreurs toi-même, pas tes clients
- **Modifier du code sans peur** : si tu changes quelque chose et qu'un test échoue, tu sais immédiatement ce qui a cassé
- **Documenter le code** : les tests montrent comment ton code est censé fonctionner
- **Gagner du temps** : vérifier manuellement chaque fonctionnalité prend beaucoup plus de temps que lancer des tests automatiques

---

## C'est quoi Vitest ?

**Vitest** est un "lanceur de tests" (test runner). C'est l'outil qui va exécuter tes tests et te dire si tout est OK (✅) ou s'il y a des problèmes (❌).

> **Analogie** : Vitest c'est comme un professeur qui corrige tes examens. Toi, tu écris les questions et les bonnes réponses. Vitest vérifie si ton code donne les bonnes réponses.

---

## 📦 Rappel JavaScript : les modules et les imports

En JavaScript moderne, on découpe le code en **modules** (fichiers séparés). Chaque fichier peut **exporter** des choses (fonctions, variables...) et d'autres fichiers peuvent les **importer**.

```ts
// --- Fichier math.ts ---
// Le mot "export" rend cette fonction disponible pour d'autres fichiers
export function addition(a: number, b: number): number {
  return a + b          // Renvoie la somme de a et b
}

// --- Fichier test.ts ---
// "import" va chercher la fonction dans l'autre fichier
import { addition } from './math'  // Le "./" veut dire "dans le même dossier"

// Maintenant on peut utiliser addition() ici
console.log(addition(2, 3))  // Affiche 5
```

---

## Installation

On installe les outils nécessaires pour les tests :

```bash
# pnpm add = installer des paquets
# -D = en "devDependencies" (outils de développement, pas envoyés aux utilisateurs)
# vitest = le lanceur de tests
# @vue/test-utils = utilitaires pour tester des composants Vue
# happy-dom = simule un navigateur web pour les tests (sans ouvrir un vrai navigateur)
pnpm add -D vitest @vue/test-utils happy-dom
```

Ensuite on configure Vitest dans le fichier de configuration de Vite :

```ts
// vite.config.ts — Le fichier de configuration de notre projet
import { defineConfig } from "vite"        // Fonction pour créer la config
import vue from "@vitejs/plugin-vue"        // Plugin pour comprendre les fichiers .vue

export default defineConfig({
  plugins: [vue()],                         // Active le support Vue
  test: {                                   // Configuration des tests
    environment: "happy-dom",               // Utilise happy-dom pour simuler un navigateur
    globals: true,                          // Rend describe/it/expect disponibles partout
  },
})
```

Et on ajoute des commandes pratiques dans `package.json` :

```json
// package.json — On ajoute des scripts pour lancer les tests facilement
{
  "scripts": {
    "test": "vitest",                       // Lance les tests en mode "watch" (se relance à chaque modification)
    "test:run": "vitest run",               // Lance les tests une seule fois
    "test:coverage": "vitest run --coverage" // Lance les tests + montre quelles lignes sont testées
  }
}
```

Pour lancer tes tests, tape simplement dans le terminal :

```bash
pnpm test
```

---

## La syntaxe d'un test : describe / it / expect

Un test s'écrit avec 3 mots-clés principaux. Voyons-les un par un :

### `describe` — Regrouper les tests

`describe` crée un **groupe de tests** liés entre eux. C'est comme un chapitre dans un livre.

```ts
// "describe" = "je décris le comportement de..."
describe("ma calculatrice", () => {
  // Tous les tests de la calculatrice iront ici
})
```

### `it` — Un test individuel

`it` (ou `test`, c'est pareil) décrit **un seul comportement** à vérifier. C'est comme une question d'examen.

```ts
describe("ma calculatrice", () => {
  // "it" = "elle devrait..." (it should...)
  it("additionne deux nombres", () => {
    // Le test va ici
  })
})
```

### `expect` — Vérifier le résultat

`expect` est le cœur du test. Il vérifie qu'une valeur correspond à ce qu'on attend.

```ts
// expect = "je m'attends à ce que..."
// toBe = "...soit égal à..."
expect(2 + 2).toBe(4)  // ✅ "Je m'attends à ce que 2+2 soit égal à 4"
expect(2 + 2).toBe(5)  // ❌ ÉCHEC ! 4 n'est pas égal à 5
```

> **Analogie** : `expect(...).toBe(...)` c'est comme dire "je parie que ce résultat est égal à cette valeur". Si tu as raison, le test passe ✅. Sinon, il échoue ❌.

---

## Mon tout premier test : tester une fonction simple

Commençons par le test le plus simple possible : tester une fonction qui fait de l'addition.

### Étape 1 : Écrire la fonction à tester

```ts
// utils/math.ts — Un fichier avec des fonctions utilitaires

// Fonction qui bloque une valeur entre un minimum et un maximum
// Exemple : clamp(15, 0, 10) → 10 (15 dépasse le max, on retourne 10)
// Exemple : clamp(5, 0, 10) → 5 (5 est entre 0 et 10, on le garde tel quel)
// Exemple : clamp(-3, 0, 10) → 0 (-3 est sous le min, on retourne 0)
export function clamp(value: number, min: number, max: number): number {
  return Math.min(             // Math.min prend le plus petit de deux nombres
    Math.max(value, min),      // Math.max prend le plus grand → assure que value >= min
    max                        // Puis on s'assure que le résultat ne dépasse pas max
  )
}

// Fonction qui convertit des centimes en prix affiché
// Exemple : formatPrice(1999) → "19.99 €"
export function formatPrice(cents: number): string {
  return (cents / 100)        // 1999 / 100 = 19.99
    .toFixed(2)               // Garde 2 décimales → "19.99"
    + " €"                    // Ajoute le symbole euro → "19.99 €"
}
```

### Étape 2 : Écrire les tests

```ts
// utils/__tests__/math.test.ts
// Convention : les tests vont dans un dossier __tests__ à côté du fichier testé
// Le fichier se termine par .test.ts pour que Vitest le trouve automatiquement

import { describe, it, expect } from "vitest"  // On importe les outils de test
import { clamp, formatPrice } from "../math"    // On importe les fonctions à tester
// "../math" = "remonte d'un dossier, puis va dans math.ts"

// Groupe de tests pour la fonction "clamp"
describe("clamp", () => {

  // Test 1 : si la valeur est déjà entre min et max, on la garde
  it("retourne la valeur si elle est dans les bornes", () => {
    // clamp(5, 0, 10) devrait retourner 5 car 5 est entre 0 et 10
    expect(clamp(5, 0, 10)).toBe(5)   // ✅ 5 est bien 5
  })

  // Test 2 : si la valeur est trop petite, on retourne le minimum
  it("retourne le minimum si la valeur est en dessous", () => {
    // clamp(-1, 0, 10) devrait retourner 0 car -1 est sous le min (0)
    expect(clamp(-1, 0, 10)).toBe(0)  // ✅ 0 est bien 0
  })

  // Test 3 : si la valeur est trop grande, on retourne le maximum
  it("retourne le maximum si la valeur est au dessus", () => {
    // clamp(15, 0, 10) devrait retourner 10 car 15 dépasse le max (10)
    expect(clamp(15, 0, 10)).toBe(10) // ✅ 10 est bien 10
  })
})

// Groupe de tests pour la fonction "formatPrice"
describe("formatPrice", () => {

  it("convertit les centimes en prix affiché avec le symbole euro", () => {
    expect(formatPrice(1999)).toBe("19.99 €")  // 1999 centimes = 19.99 €
    expect(formatPrice(0)).toBe("0.00 €")      // 0 centimes = 0.00 €
    expect(formatPrice(100)).toBe("1.00 €")    // 100 centimes = 1.00 €
  })
})
```

### Que se passe-t-il quand on lance les tests ?

```bash
pnpm test

# Résultat dans le terminal :
# ✅ clamp > retourne la valeur si elle est dans les bornes
# ✅ clamp > retourne le minimum si la valeur est en dessous
# ✅ clamp > retourne le maximum si la valeur est au dessus
# ✅ formatPrice > convertit les centimes en prix affiché avec le symbole euro
#
# Tests : 4 passés, 0 échoués
```

Si un test échoue, Vitest te montre exactement ce qui ne va pas :

```
❌ clamp > retourne le maximum si la valeur est au dessus
   Expected: 10
   Received: 15
   → La fonction a retourné 15 au lieu de 10, il y a un bug !
```

---

## Tester un composable Vue

Un **composable** est une fonction Vue réutilisable (les fonctions `use...`). On peut les tester comme des fonctions normales.

```ts
// composables/__tests__/useCounter.test.ts
import { describe, it, expect } from "vitest"
import { useCounter } from "../useCounter"  // Notre composable compteur

describe("useCounter", () => {

  // Test : le compteur démarre à 0 par défaut
  it("initialise avec la valeur par défaut (0)", () => {
    const { count } = useCounter()     // On appelle le composable
    expect(count.value).toBe(0)        // count est un ref, donc on lit .value
  })

  // Test : le compteur augmente quand on appelle increment()
  it("incrémente le compteur de 1", () => {
    const { count, increment } = useCounter()  // On récupère count et increment
    increment()                                // On incrémente
    expect(count.value).toBe(1)                // Le compteur vaut maintenant 1
  })

  // Test : le compteur ne dépasse pas le maximum
  it("ne dépasse pas la valeur maximum", () => {
    // useCounter(valeurInitiale, min, max)
    const { count, increment } = useCounter(9, 0, 10)  // Démarre à 9, max = 10
    increment()        // 9 → 10 ✅
    increment()        // 10 → toujours 10 (bloqué au max)
    expect(count.value).toBe(10)
  })

  // Test : le compteur ne descend pas sous le minimum
  it("ne descend pas sous la valeur minimum", () => {
    const { count, decrement } = useCounter(1, 0, 10)  // Démarre à 1, min = 0
    decrement()        // 1 → 0 ✅
    decrement()        // 0 → toujours 0 (bloqué au min)
    expect(count.value).toBe(0)
  })

  // Test : reset() remet le compteur à sa valeur initiale
  it("reset remet le compteur à sa valeur de départ", () => {
    const { count, increment, reset } = useCounter(5)  // Démarre à 5
    increment()        // 5 → 6
    increment()        // 6 → 7
    reset()            // 7 → 5 (retour à la valeur de départ)
    expect(count.value).toBe(5)
  })
})
```

---

## Les "matchers" : les différentes façons de vérifier

Le mot après `expect(valeur).` s'appelle un **matcher** (vérificateur). Il y en a beaucoup selon ce qu'on veut tester :

### Vérifier l'égalité

```ts
// toBe = comparaison stricte (===), pour les valeurs simples
expect(5).toBe(5)                    // ✅ même nombre
expect("bonjour").toBe("bonjour")    // ✅ même texte

// toEqual = comparaison profonde, pour les objets et tableaux
// (vérifie le contenu, pas la référence mémoire)
expect({ nom: "Alice" }).toEqual({ nom: "Alice" })  // ✅ même contenu
```

### Vérifier vrai/faux

```ts
expect(true).toBeTruthy()       // ✅ la valeur est "truthy" (considérée comme vraie)
expect(0).toBeFalsy()           // ✅ 0 est "falsy" (considéré comme faux)
expect(null).toBeNull()         // ✅ la valeur est null
expect("hello").toBeDefined()   // ✅ la valeur existe (n'est pas undefined)
```

### Vérifier les nombres

```ts
expect(10).toBeGreaterThan(5)        // ✅ 10 > 5
expect(3).toBeLessThanOrEqual(3)     // ✅ 3 <= 3
expect(0.1 + 0.2).toBeCloseTo(0.3)  // ✅ pour les décimaux (0.1+0.2 = 0.30000000004 en JS !)
```

### Vérifier les textes

```ts
expect("Bonjour Alice").toContain("Alice")  // ✅ le texte contient "Alice"
expect("abc123").toMatch(/[0-9]+/)          // ✅ le texte correspond au regex (contient des chiffres)
```

### Vérifier les tableaux

```ts
expect([1, 2, 3]).toContain(2)       // ✅ le tableau contient 2
expect(["a", "b"]).toHaveLength(2)   // ✅ le tableau a 2 éléments
```

### Vérifier les erreurs

```ts
// On entoure la fonction dans une autre fonction (arrow function)
// pour que expect puisse "attraper" l'erreur
expect(() => {
  throw new Error("Oups")  // Cette fonction lance une erreur
}).toThrow("Oups")          // ✅ l'erreur contient bien "Oups"
```

### Vérifier les fonctions asynchrones (avec async/await)

```ts
// Pour les fonctions qui retournent une Promise (opérations async)
await expect(fetchUser(1)).resolves.toBe("Alice")   // ✅ la Promise réussit avec "Alice"
await expect(fetchUser(-1)).rejects.toThrow()        // ✅ la Promise échoue avec une erreur
```

---

## Les Mocks : simuler des choses

Un **mock** c'est un "faux" objet ou une "fausse" fonction qu'on crée pour les tests.

> **Analogie** : Imagine que tu testes une application météo. Au lieu d'appeler un vrai serveur météo (qui peut être lent, en panne, ou donner des résultats différents), tu crées une **fausse réponse** que tu contrôles. "Aujourd'hui il fait 20°C" — voilà, c'est un mock.

### Créer une fausse fonction

```ts
import { vi } from "vitest"   // "vi" contient les outils de mock de Vitest

// vi.fn() crée une fausse fonction qui enregistre ses appels
const fausseFonction = vi.fn()

// On l'appelle comme une vraie fonction
fausseFonction("bonjour")

// On peut vérifier comment elle a été appelée
expect(fausseFonction).toHaveBeenCalledWith("bonjour")  // ✅ appelée avec "bonjour"
expect(fausseFonction).toHaveBeenCalledTimes(1)          // ✅ appelée 1 seule fois
```

### Simuler une réponse d'API

```ts
// Crée un faux fetch qui retourne toujours { ok: true }
// mockResolvedValue = "quand on m'appelle, je retourne cette valeur (en async)"
const fauxFetch = vi.fn().mockResolvedValue({
  ok: true,                    // Simule une réponse réussie
  json: () => []               // Simule la méthode .json() qui retourne un tableau vide
})
```

### Remplacer un module entier

```ts
// vi.mock remplace un fichier entier par des fausses fonctions
// Utile quand on ne veut pas appeler le vrai serveur pendant les tests
vi.mock("@/api/client", () => ({
  fetchUsers: vi.fn().mockResolvedValue([    // Fausse version de fetchUsers
    { id: 1, name: "Alice" }                 // Retourne toujours cette donnée
  ]),
}))
```

### Espionner une fonction existante

```ts
// vi.spyOn "espionne" une vraie fonction sans la remplacer complètement
// On peut quand même changer ce qu'elle retourne
const espion = vi.spyOn(localStorage, "getItem")  // Espionne localStorage.getItem
espion.mockReturnValue("une-valeur")               // Quand on l'appelle, retourne "une-valeur"
```

---

## Tester un composable asynchrone

Parfois nos composables font des appels réseau (fetch). Voici comment les tester avec des mocks :

```ts
// composables/__tests__/useAsyncData.test.ts
import { describe, it, expect, vi } from "vitest"
import { useAsyncData } from "../useAsyncData"

describe("useAsyncData", () => {

  it("gère le chargement puis le succès", async () => {
    // On crée un faux "fetcher" qui retourne des données après un délai
    const fauxFetcher = vi.fn().mockResolvedValue([{ id: 1 }])

    // On utilise le composable avec notre faux fetcher
    const { data, status, execute } = useAsyncData(fauxFetcher)

    // Au début, rien ne s'est passé encore
    expect(status.value).toBe("idle")     // "idle" = au repos

    // On lance l'exécution (mais on n'attend pas encore)
    const promesse = execute()
    expect(status.value).toBe("loading")  // Maintenant ça charge

    // On attend que ça finisse
    await promesse
    expect(status.value).toBe("success")          // ✅ Terminé avec succès
    expect(data.value).toEqual([{ id: 1 }])       // ✅ Les données sont là
  })

  it("gère les erreurs réseau", async () => {
    // Ce faux fetcher simule une erreur réseau
    const fauxFetcher = vi.fn().mockRejectedValue(
      new Error("Erreur réseau")   // mockRejectedValue = la Promise échoue
    )

    const { error, status, execute } = useAsyncData(fauxFetcher)

    await execute()  // On exécute et on attend

    expect(status.value).toBe("error")             // ✅ Statut = erreur
    expect(error.value).toBe("Erreur réseau")      // ✅ Message d'erreur correct
  })
})
```

---

## La pyramide des tests

Tous les tests ne se valent pas. On les organise en pyramide :

```
         /  E2E  \           ← Très peu : teste l'appli entière (lent, coûteux)
        / Intégra \          ← Quelques-uns : teste plusieurs parties ensemble
       / Compo-    \         ← Modéré : teste les composants critiques
      / sants       \
     / Composables    \      ← Beaucoup : teste la logique réutilisable
    /  Fonctions pures  \   ← Maximum : teste les fonctions simples (rapide !)
```

> **Conseil** : commence par tester tes **fonctions pures** (comme `clamp`, `formatPrice`) et tes **composables**. C'est le plus facile et le plus utile. Teste les composants seulement pour les comportements importants.

---

## Résumé

| Concept | C'est quoi ? |
|---------|-------------|
| **Test unitaire** | Vérification automatique d'un petit morceau de code |
| **Vitest** | L'outil qui exécute les tests et montre les résultats |
| **describe** | Regroupe des tests liés ("chapitre") |
| **it** | Un test individuel ("question d'examen") |
| **expect** | Vérifie qu'une valeur est correcte |
| **Mock** | Fausse version d'une fonction/module pour les tests |

## Suite

→ `cours/03-avance/04-tests-composants.md`
