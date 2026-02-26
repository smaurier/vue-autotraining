// TODO: Définir l'interface UserProfile
// - id: number
// - name: string
// - email: string
// - role: 'admin' | 'editor' | 'viewer'
// - preferences: { theme: 'light' | 'dark'; lang: string }
// - createdAt: Date
export interface UserProfile {
  // TODO
}

// TODO: Définir ApiResponse<T> comme discriminated union
// { status: 'success'; data: T } | { status: 'error'; message: string }
export type ApiResponse<T> = unknown;

// TODO: Fonction pickFields<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>
export function pickFields<T, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  // TODO
  return {} as Pick<T, K>;
}

// TODO: Type FormFields<T> — transforme chaque champ de T en string (mapped type)
export type FormFields<T> = {
  // TODO
};
