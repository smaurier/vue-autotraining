import { ref, type Ref } from "vue";
import type { AppRouter } from "./router";
import { appRouter } from "./router";

/**
 * TODO: Créer un client tRPC typé qui infère les types du router
 * Le but : trpc.user.getAll.useQuery() retourne { data, loading, error }
 */

type InferResolveReturn<T> = T extends {
  resolve: (...args: infer _A) => Promise<infer R>;
}
  ? R
  : never;

// TODO: Implémenter createTRPCClient
export function createTRPCClient(router: AppRouter) {
  // TODO: Retourner un proxy qui permet d'appeler  .useQuery() sur chaque procédure
  return router; // placeholder
}

export const trpc = createTRPCClient(appRouter);
