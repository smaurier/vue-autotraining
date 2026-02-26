import { ref } from "vue";
import type { AriaLivePriority } from "../types";

/**
 * TODO: Annonceur pour lecteurs d'écran via aria-live
 */
export function useAnnouncer() {
  const message = ref("");
  const priority = ref<AriaLivePriority>("polite");

  function announce(text: string, level: AriaLivePriority = "polite"): void {
    // TODO: Mettre à jour message et priority
    // TODO: Réinitialiser après un court délai (pour permittre la ré-annonce)
  }

  return { message, priority, announce };
}
