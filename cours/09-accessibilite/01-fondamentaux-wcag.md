# 01 — Fondamentaux WCAG

## C'est quoi l'accessibilité web ?

L'**accessibilité** (souvent abrégée **a11y** — il y a 11 lettres entre le "a" et le "y" de "accessibility"), c'est le fait de rendre ton site web **utilisable par tout le monde**, y compris les personnes en situation de handicap.

Ça concerne par exemple :
- Les personnes **aveugles ou malvoyantes** (qui utilisent un lecteur d'écran)
- Les personnes **sourdes** (qui ont besoin de sous-titres)
- Les personnes avec un **handicap moteur** (qui naviguent au clavier, sans souris)
- Les personnes avec des **troubles cognitifs** (qui ont besoin de textes clairs)

### 🏗️ L'analogie du bâtiment avec une rampe

Imagine un bâtiment avec **seulement des escaliers** à l'entrée.
La majorité des gens montent les marches sans problème. Mais certaines personnes sont **bloquées** :

- Une personne en **fauteuil roulant**
- Un parent avec une **poussette**
- Une personne avec une **jambe cassée**
- Une personne âgée avec une **canne**

Si tu ajoutes une **rampe d'accès**, tout le monde peut entrer — y compris ceux qui prenaient les escaliers (c'est souvent plus pratique !).

**L'accessibilité web, c'est la rampe de ton site.** Elle aide les personnes qui en ont besoin, mais elle améliore aussi l'expérience pour tout le monde.

## Pourquoi c'est important ?

```
📊 Quelques chiffres :
- ~15% de la population mondiale a un handicap (source : OMS)
- En France, c'est ~12 millions de personnes
- 100% des gens un jour — handicap temporaire (bras cassé),
  situationnel (soleil sur l'écran), ou lié à l'âge
```

Voici pourquoi tu dois t'en préoccuper :

| Raison        | Explication |
| ------------- | ----------- |
| **Légal**     | En France, la loi RGAA impose l'accessibilité aux services publics et grandes entreprises. C'est **obligatoire**. |
| **Éthique**   | Tout le monde mérite d'accéder à l'information et aux services en ligne. |
| **Qualité**   | Un site accessible est mieux structuré, mieux testé, et mieux référencé sur Google (SEO). |
| **Business**  | C'est un critère de plus en plus demandé dans les appels d'offres et les entreprises. |

## C'est quoi le WCAG ?

**WCAG** = **Web Content Accessibility Guidelines** (Directives pour l'accessibilité des contenus web).

> 💡 **Analogie** : Si l'accessibilité d'un bâtiment suit des **normes de construction** (largeur des portes, hauteur des rampes...), l'accessibilité d'un site web suit le **WCAG**. Ce sont les **"codes du bâtiment" pour le web**.

Le WCAG est un standard international créé par le **W3C** (l'organisme qui définit les standards du web). La version actuelle est **WCAG 2.1**.

En France, le **RGAA** (Référentiel Général d'Amélioration de l'Accessibilité) est basé sur le WCAG.

## Les 4 principes du WCAG : P.O.U.R.

Le WCAG repose sur **4 grands principes**. On les retient avec l'acronyme **POUR** :

```
P → Perceptible    (on peut voir/entendre le contenu)
O → Opérable       (on peut interagir avec le site)
U → Understandable (on comprend le contenu)    ← en anglais !
R → Robuste        (ça marche avec tous les outils)
```

### 1. 👁️ Perceptible — « Je peux voir ou entendre le contenu »

L'information doit être présentable **de plusieurs façons**, pas seulement visuellement :

```html
<!-- ❌ PROBLÈME : une image sans texte alternatif -->
<!-- Une personne aveugle ne saura JAMAIS ce que montre l'image -->
<img src="chat.jpg" />

<!-- ✅ SOLUTION : on ajoute un attribut "alt" qui décrit l'image -->
<!-- Le lecteur d'écran lira : "Photo d'un chat roux dormant" -->
<img src="chat.jpg" alt="Photo d'un chat roux dormant" />
```

**Ce que ça implique :**

- **Images** → toujours un texte alternatif (`alt="..."`)
- **Vidéos** → toujours des sous-titres
- **Contraste** → le texte doit être assez contrasté par rapport au fond (on verra les ratios plus bas)
- **Zoom** → le site doit rester lisible quand on zoome à 200%

### 2. ⌨️ Opérable — « Je peux utiliser le site »

L'interface doit être utilisable **sans souris**, uniquement au clavier :

```
Rappel : les touches clavier essentielles pour naviguer :

Tab       → Avancer vers l'élément interactif suivant (lien, bouton, champ...)
Shift+Tab → Reculer vers l'élément interactif précédent
Enter     → Activer un lien ou un bouton
Espace    → Cocher une case, activer un bouton
Escape    → Fermer un menu déroulant, une modal...
Flèches   → Naviguer dans les menus, onglets, listes
```

**Ce que ça implique :**

- **Tout au clavier** : chaque bouton, lien, champ est atteignable avec Tab
- **Pas de piège clavier** : on peut toujours "sortir" d'un élément (si tu ouvres un menu, Escape doit le fermer)
- **Temps suffisant** : pas de compte à rebours trop court pour remplir un formulaire
- **Pas de flash** : rien ne doit clignoter plus de 3 fois par seconde (risque d'épilepsie)

### 3. 💬 Compréhensible (Understandable) — « Je comprends le contenu »

Le contenu et l'interface doivent être **clairs et prévisibles** :

```html
<!-- La langue de la page doit être déclarée -->
<!-- Ça permet au lecteur d'écran de prononcer correctement le texte -->
<html lang="fr">

<!-- Chaque champ de formulaire DOIT avoir une étiquette (label) -->
<!-- Sans label, l'utilisateur ne sait pas quoi taper dans le champ -->

<!-- ❌ PROBLÈME : un champ seul, sans étiquette -->
<input type="email" />

<!-- ✅ SOLUTION : un label associé au champ grâce à for/id -->
<label for="email">Adresse email</label>
<input id="email" type="email" />
```

**Ce que ça implique :**

- **Langue** : l'attribut `lang="fr"` sur la balise `<html>`
- **Labels** : chaque champ de formulaire a une étiquette visible
- **Erreurs claires** : quand un champ est mal rempli, le message d'erreur doit dire quoi corriger
- **Cohérence** : le menu de navigation est au même endroit sur toutes les pages

### 4. 🔧 Robuste — « Ça marche partout »

Le contenu doit fonctionner avec les **technologies d'assistance** (lecteurs d'écran, loupes, etc.) :

```html
<!-- ❌ PROBLÈME : du HTML invalide ou non-sémantique -->
<!-- Un lecteur d'écran ne sait pas que c'est un bouton -->
<div onclick="save()">Sauvegarder</div>

<!-- ✅ SOLUTION : du HTML sémantique, valide -->
<!-- Le navigateur et le lecteur d'écran savent que c'est un bouton -->
<button onclick="save()">Sauvegarder</button>
```

**Ce que ça implique :**

- **HTML sémantique** : utiliser les bonnes balises (`<nav>`, `<main>`, `<button>`...) — on les détaille juste en-dessous
- **ARIA** : des attributs spéciaux quand le HTML ne suffit pas (on verra ça au chapitre suivant)
- **HTML valide** : pas de balises mal fermées ou imbriquées n'importe comment

## Les niveaux de conformité : A, AA, AAA

Le WCAG définit **3 niveaux** de conformité, du minimum au maximum :

| Niveau | Description | C'est quoi concrètement ? | Requis en France (RGAA) |
| ------ | ----------- | ------------------------- | ----------------------- |
| **A**    | Minimum     | Le strict nécessaire — sans ça, c'est inutilisable | Oui |
| **AA**   | Standard    | Le niveau à viser — couvre la grande majorité des besoins | **Oui (c'est la cible)** |
| **AAA**  | Optimal     | Le nec plus ultra — très exigeant, rarement atteint à 100% | Recommandé mais pas obligatoire |

> 💡 **En pratique** : vise toujours le niveau **AA**. C'est ce qui est demandé par la loi en France et c'est un bon équilibre entre effort et résultat.

## Le contraste : un exemple concret

Le **contraste**, c'est la différence de luminosité entre le texte et son fond. Si le contraste est trop faible, le texte est **illisible** pour beaucoup de gens.

```
Ratio minimum exigé (niveau AA) :

📝 Texte normal (< 18px)                → ratio de 4.5:1 minimum
📝 Grand texte (≥ 18px gras ou ≥ 24px)  → ratio de 3:1 minimum
🎨 Éléments d'interface (bordures, icônes) → ratio de 3:1 minimum
```

> 💡 **Le ratio**, c'est quoi ? C'est un chiffre qui mesure l'écart entre deux couleurs. **1:1** = même couleur (invisible !). **21:1** = noir sur blanc (contraste maximum). Plus le chiffre est grand, mieux c'est.

**Comment vérifier le contraste ?**

1. **Chrome DevTools** : clique sur un élément → dans l'inspecteur, clique sur la couleur du texte → tu verras le ratio de contraste
2. **axe DevTools** : une extension navigateur qui scanne toute la page
3. **Sites en ligne** : cherche "contrast checker" sur Google — tu rentres 2 couleurs et il te dit le ratio

## HTML sémantique = 80% du travail d'accessibilité

> 📖 **Rappel : c'est quoi le HTML sémantique ?**
>
> Le HTML "sémantique", c'est utiliser des balises qui **décrivent le rôle** de ton contenu, au lieu de tout mettre dans des `<div>` génériques. C'est comme mettre des **panneaux** dans un bâtiment : "Entrée", "Accueil", "Sortie de secours"... Au lieu de laisser les gens deviner.

Voici la différence entre du HTML "à la div" et du HTML sémantique :

```html
<!-- ❌ "Divite" — tout est en <div>, aucune structure compréhensible -->
<!-- Un lecteur d'écran voit : "div, div, div, div..." → inutile -->
<div class="header">           <!-- C'est un en-tête ? On sait pas -->
  <div class="nav">            <!-- C'est une navigation ? On sait pas -->
    <div onclick="navigate()">Accueil</div>  <!-- C'est un lien ? Non... -->
  </div>
</div>
<div class="content">...</div> <!-- C'est le contenu principal ? Aucune idée -->

<!-- ✅ HTML sémantique — chaque balise dit ce qu'elle est -->
<!-- Un lecteur d'écran voit : "en-tête, navigation, lien, contenu principal" -->
<header>                       <!-- "Ceci est l'en-tête de la page" -->
  <nav>                        <!-- "Ceci est la zone de navigation" -->
    <a href="/">Accueil</a>    <!-- "Ceci est un lien vers l'accueil" -->
  </nav>
</header>
<main>...</main>               <!-- "Ceci est le contenu principal" -->
```

### Les balises sémantiques principales

| Balise      | Rôle | Analogie 🏗️ |
| ----------- | ---- | ------------ |
| `<header>`  | En-tête du site ou d'une section | L'enseigne au-dessus de la porte |
| `<nav>`     | Zone de navigation (menus, liens) | Les panneaux directionnels |
| `<main>`    | Contenu principal de la page | La salle principale |
| `<article>` | Contenu autonome (article de blog, carte produit) | Un livre sur une étagère — il se suffit à lui-même |
| `<section>` | Section thématique | Une pièce dédiée à un sujet |
| `<aside>`   | Contenu connexe (sidebar, encadré) | Un panneau d'information sur le côté |
| `<footer>`  | Pied de page | Le panneau "Sortie" en bas |
| `<button>`  | Une action (sauvegarder, supprimer, ouvrir un menu) | Un interrupteur — on appuie dessus pour déclencher quelque chose |
| `<a>`       | Un lien de navigation (aller vers une autre page) | Une porte — on passe au travers pour aller ailleurs |

> ⚠️ **Erreur fréquente chez les débutants** : utiliser un `<div onclick="...">` au lieu d'un `<button>`. Un `<div>` n'est **pas focusable au clavier** et n'est **pas annoncé comme bouton** par les lecteurs d'écran. Utilise **toujours** `<button>` pour une action et `<a>` pour un lien.

## Résumé

```
✅ L'accessibilité (a11y) = rendre ton site utilisable par TOUT LE MONDE
✅ WCAG = les "normes de construction" pour le web
✅ 4 principes : Perceptible, Opérable, Understandable, Robuste (POUR)
✅ Vise le niveau AA
✅ Utilise du HTML sémantique = 80% du travail est fait
✅ Vérifie le contraste de tes couleurs
✅ Teste avec le clavier (Tab, Enter, Escape)
```

## Suite

→ `cours/09-accessibilite/02-aria-et-vue.md`
