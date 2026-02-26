import { watch, type Ref, isRef } from "vue";

interface HeadOptions {
  title?: string | Ref<string>;
}

/**
 * TODO: Simule useHead de Nuxt — met à jour document.title
 */
export function useHead(options: HeadOptions): void {
  // TODO: Si title est un Ref, watcher pour mettre à jour document.title
  // TODO: Si title est un string, mettre à jour une fois
}
