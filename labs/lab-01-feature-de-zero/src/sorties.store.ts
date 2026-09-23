// sorties.store.ts — PAGE BLANCHE. TribuZen : proposer une nouvelle sortie (titre + date),
// de bout en bout (module 09 Composables + module 15 Pinia) — Composition API, store Pinia,
// validation, appel réseau injecté (testable sans vrai fetch), gestion d'erreur.
//
// export interface Sortie { id: string; titre: string; date: string }
// export interface NouvelleSortieInput { titre: string; date: string }
// export interface SortiesApi { creerSortie(input: NouvelleSortieInput): Promise<Sortie> }
//
// export function validerNouvelleSortie(input: NouvelleSortieInput): string | null
//   - Retourne un message d'erreur (affiché tel quel dans le formulaire) si invalide, `null`
//     si valide.
//   - `titre` : requis, non vide après `trim()`.
//   - `date` : requise, ET ne doit pas être dans le passé (comparée à AUJOURD'HUI, à la
//     journée près — module 10, gestion async : ne jamais comparer des dates avec l'heure
//     courante incluse, sinon "aujourd'hui à 14h" rejette "aujourd'hui à 9h").
//
// export const useSortiesStore = defineStore("sorties", () => { ... })
//   - État : `sorties: Sortie[]` (vide au départ), `isLoading: boolean`, `error: string | null`.
//   - `async function ajouterSortie(input: NouvelleSortieInput, api: SortiesApi): Promise<boolean>`
//     1. Valide D'ABORD via `validerNouvelleSortie`. Si invalide : `error.value` = le message,
//        retourne `false`, **sans jamais appeler `api.creerSortie`** (le piège classique :
//        valider côté client ET ne jamais taper le réseau pour rien).
//     2. Sinon : `isLoading.value = true`, `error.value = null`, appelle `api.creerSortie(input)`.
//     3. Succès : insère la nouvelle sortie EN TÊTE de `sorties.value` (les plus récentes
//        d'abord), retourne `true`.
//     4. Échec (rejet) : `error.value = "Impossible de créer la sortie."`, retourne `false`.
//     5. **Dans TOUS les cas** (succès, échec, erreur de validation déjà couverte au point 1) :
//        `isLoading.value` doit valoir `false` à la fin — piège classique : un `isLoading`
//        qui reste bloqué à `true` sur le chemin d'erreur.
import { defineStore } from "pinia";

export interface Sortie {
  id: string;
  titre: string;
  date: string;
}

export interface NouvelleSortieInput {
  titre: string;
  date: string;
}

export interface SortiesApi {
  creerSortie(input: NouvelleSortieInput): Promise<Sortie>;
}

export function validerNouvelleSortie(_input: NouvelleSortieInput): string | null {
  throw new Error("validerNouvelleSortie n'est pas encore implémenté");
}

interface SortiesStoreShape {
  sorties: Sortie[];
  isLoading: boolean;
  error: string | null;
  ajouterSortie: (input: NouvelleSortieInput, api: SortiesApi) => Promise<boolean>;
}

export const useSortiesStore = defineStore("sorties", (): SortiesStoreShape => {
  throw new Error("useSortiesStore n'est pas encore implémenté");
});
