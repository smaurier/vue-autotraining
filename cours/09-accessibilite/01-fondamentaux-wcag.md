# 01 — Fondamentaux WCAG

## Pourquoi l'accessibilite ?

- **Legal** : en France, la loi RGAA impose l'accessibilite aux services publics et grandes entreprises
- **Ethique** : ~15% de la population a un handicap
- **Qualite** : un site accessible est mieux structure, mieux teste, mieux reference (SEO)
- **ESN** : c'est un critere de plus en plus demande en appels d'offres

## WCAG 2.1 : les 4 principes (POUR)

### 1. Perceptible

L'information doit etre presentable de plusieurs facons :

- **Images** : texte alternatif (`alt`)
- **Videos** : sous-titres
- **Contraste** : ratio minimum 4.5:1 (texte normal), 3:1 (grand texte)
- **Responsive** : zoomable a 200% sans perte de contenu

### 2. Operable

L'interface doit etre utilisable :

- **Clavier** : tout est accessible au clavier (Tab, Enter, Escape)
- **Pas de piege clavier** : on peut toujours sortir d'un élément
- **Temps suffisant** : pas de timeout trop court
- **Pas de flash** : rien ne clignote > 3 fois/seconde

### 3. Understandable (comprehensible)

Le contenu doit etre compris :

- **Langue** : attribut `lang` sur `<html>`
- **Labels** : chaque input a un label
- **Erreurs** : messages d'erreur clairs et associes au champ
- **Coherence** : navigation et nommage coherents entre pages

### 4. Robuste

Le contenu doit fonctionner avec les technologies d'assistance :

- **HTML sémantique** : `<nav>`, `<main>`, `<article>`, `<button>`
- **ARIA** : quand le HTML sémantique ne suffit pas
- **Validation** : HTML valide

## Niveaux de conformite

| Niveau | Description | Requis en France (RGAA)    |
| ------ | ----------- | -------------------------- |
| A      | Minimum     | Oui                        |
| AA     | Standard    | **Oui (cible)**            |
| AAA    | Optimal     | Non requis mais recommande |

## Contraste

```
Ratio minimum :
- Texte normal (< 18px) : 4.5:1
- Grand texte (≥ 18px bold ou ≥ 24px) : 3:1
- Elements UI (bordures, icones) : 3:1
```

Outils : Chrome DevTools (inspecteur → contraste), axe DevTools, Contrast Checker

## HTML sémantique = 80% du travail

```html
<!-- ❌ Divite (tout en div) -->
<div class="header">
  <div class="nav">
    <div onclick="navigate()">Accueil</div>
  </div>
</div>
<div class="content">...</div>

<!-- ✅ Semantique -->
<header>
  <nav>
    <a href="/">Accueil</a>
  </nav>
</header>
<main>...</main>
```

| Élément     | Role                              |
| ----------- | --------------------------------- |
| `<header>`  | En-tete                           |
| `<nav>`     | Navigation                        |
| `<main>`    | Contenu principal                 |
| `<article>` | Contenu autonome                  |
| `<section>` | Section thematique                |
| `<aside>`   | Contenu connexe                   |
| `<footer>`  | Pied de page                      |
| `<button>`  | Action (pas `<div onclick>`)      |
| `<a>`       | Navigation (pas `<span onclick>`) |

## Suite

→ `cours/09-accessibilite/02-aria-et-vue.md`
