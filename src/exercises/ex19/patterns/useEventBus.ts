import { onUnmounted } from "vue";

type EventHandler<T> = (payload: T) => void;

/**
 * TODO: Event bus typé pour communication cross-component
 */
export function useEventBus<Events extends Record<string, unknown>>() {
  const listeners = new Map<keyof Events, Set<EventHandler<unknown>>>();

  function on<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>,
  ): void {
    // TODO: Ajouter un listener
  }

  function emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    // TODO: Émettre un événement
  }

  function off<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>,
  ): void {
    // TODO: Retirer un listener
  }

  // TODO: Cleanup automatique dans onUnmounted

  return { on, emit, off };
}
