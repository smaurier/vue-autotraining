import { ref, onRenderTracked, onRenderTriggered } from "vue";

/**
 * TODO: Tracker les re-renders d'un composant
 */
export function useRenderTracker() {
  const renderCount = ref(0);
  const lastRenderTime = ref(0);

  // TODO: onRenderTracked → incrémenter renderCount
  // TODO: onRenderTriggered → enregistrer le timestamp

  return { renderCount, lastRenderTime };
}
