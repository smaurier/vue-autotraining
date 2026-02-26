import { ref, watch, type Ref } from "vue";

/**
 * TODO: Synchronise une ref avec localStorage
 * @param key - Clé localStorage
 * @param defaultValue - Valeur par défaut
 * @returns Ref synchronisée avec localStorage
 */
export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  // TODO: Lire la valeur initiale depuis localStorage
  // TODO: Créer un ref avec la valeur
  // TODO: watch pour écrire dans localStorage à chaque changement
  return ref(defaultValue) as Ref<T>;
}
