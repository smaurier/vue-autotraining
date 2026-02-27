// ---- Problème 1 ----
let compteur = "0";
// Quel est le type de "compteur" ici ? String, type inféré
compteur = compteur + 1;
// Quel sera le résultat ? "01" ou 1 ? "01" (concaténation de texte)
// Indice : en JavaScript, "0" + 1 donne "01" (concaténation de texte !)
// car quand on additionne un string + un number, JS convertit le nombre en texte

// ---- Problème 2 ----
function saluer(nom: string): string {
  // Quelle erreur en mode strict ? Pas de type pour "nom"
  return "Bonjour " + nom;
}
// Indice : en mode strict, TypeScript exige que chaque paramètre ait un type

