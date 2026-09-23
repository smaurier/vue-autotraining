// sorties.store.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.
import { defineStore } from "pinia";
import { ref } from "vue";

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

export function validerNouvelleSortie(input: NouvelleSortieInput): string | null {
  if (input.titre.trim() === "") return "Le titre est requis.";
  if (input.date.trim() === "") return "La date est requise.";

  // Comparaison à la JOURNÉE près (module 10) : "aujourd'hui à 14h" ne doit pas rejeter
  // "aujourd'hui à 9h" — on compare des dates à minuit, pas des horodatages complets.
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);
  const dateSortie = new Date(input.date);
  dateSortie.setHours(0, 0, 0, 0);

  if (dateSortie.getTime() < aujourdHui.getTime()) return "La date ne peut pas être dans le passé.";

  return null;
}

export const useSortiesStore = defineStore("sorties", () => {
  const sorties = ref<Sortie[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function ajouterSortie(input: NouvelleSortieInput, api: SortiesApi): Promise<boolean> {
    const messageValidation = validerNouvelleSortie(input);
    if (messageValidation) {
      // Erreur de validation : jamais d'appel réseau pour une entrée qu'on sait déjà invalide.
      error.value = messageValidation;
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const nouvelleSortie = await api.creerSortie(input);
      sorties.value = [nouvelleSortie, ...sorties.value]; // les plus récentes en tête
      return true;
    } catch {
      error.value = "Impossible de créer la sortie.";
      return false;
    } finally {
      // Piège classique : isLoading qui reste bloqué à true sur le chemin d'erreur.
      isLoading.value = false;
    }
  }

  return { sorties, isLoading, error, ajouterSortie };
});
