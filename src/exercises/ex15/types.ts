import type { Component } from "vue";

export interface Route {
  path: string;
  name: string;
  component: Component;
  meta?: {
    requiresAuth?: boolean;
    title?: string;
  };
}

export type NavigationGuard = (to: string, from: string) => boolean | string;

export interface RouterState {
  currentRoute: string;
  params: Record<string, string>;
  history: string[];
}
