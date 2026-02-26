import type { IHttpService } from "../types";

/**
 * TODO: Implémentation mock de IHttpService
 * Stocke les données en mémoire, simule des délais
 */
export class MockHttpService implements IHttpService {
  private store: Map<string, unknown[]> = new Map();

  async get<T>(url: string): Promise<T> {
    // TODO: Récupérer les données pour l'URL
    await this.delay();
    return (this.store.get(url) ?? []) as T;
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    // TODO: Ajouter une entrée
    await this.delay();
    return data as T;
  }

  async put<T>(url: string, data: unknown): Promise<T> {
    // TODO: Mettre à jour une entrée
    await this.delay();
    return data as T;
  }

  async delete(url: string): Promise<void> {
    // TODO: Supprimer une entrée
    await this.delay();
  }

  private delay(ms: number = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
