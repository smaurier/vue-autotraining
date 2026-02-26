import type { InjectionKey, Ref, ComputedRef } from "vue";

export interface ThemeColors {
  bg: string;
  text: string;
  primary: string;
  secondary: string;
}

export interface ThemeContext {
  theme: Ref<"light" | "dark">;
  colors: ComputedRef<ThemeColors>;
  toggleTheme: () => void;
}

export const THEME_KEY: InjectionKey<ThemeContext> = Symbol("theme");
