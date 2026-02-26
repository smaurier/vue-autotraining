import { onMounted, onUnmounted, type Ref } from "vue";

/**
 * TODO: Piège le focus dans un container
 * Tab cycle, Shift+Tab cycle inverse, Escape pour libérer
 */
export function useFocusTrap(containerRef: Ref<HTMLElement | null>) {
  // TODO: Trouver tous les éléments focusables dans le container
  // TODO: Gérer Tab / Shift+Tab pour cycler
  // TODO: Gérer Escape pour libérer
  // TODO: Cleanup dans onUnmounted

  function activate(): void {
    // TODO
  }

  function deactivate(): void {
    // TODO
  }

  return { activate, deactivate };
}
