import { ref, computed, type Ref, type ComputedRef } from "vue";
import type { Route, NavigationGuard } from "../types";

interface UseSimpleRouterReturn {
  currentRoute: Ref<string>;
  params: Ref<Record<string, string>>;
  currentComponent: ComputedRef<any>;
  navigate: (path: string, params?: Record<string, string>) => void;
  back: () => void;
  addGuard: (guard: NavigationGuard) => void;
}

/**
 * TODO: Mini-routeur réactif basé sur un état local
 */
export function useSimpleRouter(routes: Route[]): UseSimpleRouterReturn {
  // TODO: refs currentRoute, params, history
  // TODO: guards array
  // TODO: computed currentComponent (trouver la route qui matche)
  // TODO: function navigate (exécuter les guards avant)
  // TODO: function back
  // TODO: function addGuard
  const currentRoute = ref("/");
  const params = ref<Record<string, string>>({});
  const currentComponent = computed(() => null);
  const navigate = (_path: string, _p?: Record<string, string>): void => {
    /* TODO */
  };
  const back = (): void => {
    /* TODO */
  };
  const addGuard = (_guard: NavigationGuard): void => {
    /* TODO */
  };
  return { currentRoute, params, currentComponent, navigate, back, addGuard };
}
