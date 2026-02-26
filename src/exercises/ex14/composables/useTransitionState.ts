import { ref, type Ref } from "vue";

interface TransitionStateReturn {
  isVisible: Ref<boolean>;
  isAnimating: Ref<boolean>;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

/**
 * TODO: Gère un état de visibilité avec tracking d'animation
 */
export function useTransitionState(
  initial: boolean = false,
): TransitionStateReturn {
  // TODO: refs isVisible, isAnimating
  // TODO: functions show, hide, toggle
  const isVisible = ref(initial);
  const isAnimating = ref(false);
  const show = (): void => {
    /* TODO */
  };
  const hide = (): void => {
    /* TODO */
  };
  const toggle = (): void => {
    /* TODO */
  };
  return { isVisible, isAnimating, show, hide, toggle };
}
