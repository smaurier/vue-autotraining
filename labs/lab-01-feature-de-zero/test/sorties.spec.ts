// Oracle du lab 01 (Vue). Ne pas modifier.
import { createPinia, setActivePinia } from "pinia";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AjouterSortieForm from "@lab/AjouterSortieForm.vue";
import { useSortiesStore, validerNouvelleSortie, type Sortie, type SortiesApi } from "@lab/sorties.store";

beforeEach(() => {
  setActivePinia(createPinia());
});

function dateFuture(joursDecalage = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + joursDecalage);
  return d.toISOString().slice(0, 10);
}

function datePassee(): string {
  return dateFuture(-1);
}

describe("validerNouvelleSortie", () => {
  it("rejette un titre vide", () => {
    expect(validerNouvelleSortie({ titre: "  ", date: dateFuture() })).toBe("Le titre est requis.");
  });

  it("rejette une date vide", () => {
    expect(validerNouvelleSortie({ titre: "Piscine", date: "" })).toBe("La date est requise.");
  });

  it("rejette une date dans le passé", () => {
    expect(validerNouvelleSortie({ titre: "Piscine", date: datePassee() })).toBe(
      "La date ne peut pas être dans le passé.",
    );
  });

  it("accepte une entrée valide (titre + date future)", () => {
    expect(validerNouvelleSortie({ titre: "Piscine", date: dateFuture() })).toBeNull();
  });

  it("accepte la date d'aujourd'hui (comparaison à la journée, pas à l'heure)", () => {
    const aujourdHui = new Date().toISOString().slice(0, 10);
    expect(validerNouvelleSortie({ titre: "Piscine", date: aujourdHui })).toBeNull();
  });
});

describe("useSortiesStore — ajouterSortie", () => {
  it("entrée invalide : pas d'appel API, error renseignée, isLoading false", async () => {
    const store = useSortiesStore();
    const api: SortiesApi = { creerSortie: vi.fn() };

    const resultat = await store.ajouterSortie({ titre: "", date: dateFuture() }, api);

    expect(resultat).toBe(false);
    expect(api.creerSortie).not.toHaveBeenCalled();
    expect(store.error).toBe("Le titre est requis.");
    expect(store.isLoading).toBe(false);
  });

  it("isLoading passe à true PENDANT l'appel réseau, avant qu'il ne se résolve", async () => {
    const store = useSortiesStore();
    let resoudre!: (s: Sortie) => void;
    const api: SortiesApi = {
      creerSortie: () => new Promise<Sortie>((resolve) => (resoudre = resolve)),
    };

    const promesse = store.ajouterSortie({ titre: "Piscine", date: dateFuture() }, api);
    expect(store.isLoading).toBe(true);

    resoudre({ id: "s1", titre: "Piscine", date: dateFuture() });
    await promesse;
    expect(store.isLoading).toBe(false);
  });

  it("succès : la sortie est ajoutée EN TÊTE de la liste", async () => {
    const store = useSortiesStore();
    const api: SortiesApi = {
      creerSortie: vi.fn().mockResolvedValue({ id: "s2", titre: "Randonnée", date: dateFuture() }),
    };

    // Une sortie déjà présente, pour vérifier que la nouvelle passe bien EN TÊTE.
    store.sorties.push({ id: "s1", titre: "Piscine", date: dateFuture() });

    const resultat = await store.ajouterSortie({ titre: "Randonnée", date: dateFuture() }, api);

    expect(resultat).toBe(true);
    expect(store.sorties.map((s) => s.id)).toEqual(["s2", "s1"]);
    expect(store.error).toBeNull();
  });

  it("échec réseau : error renseignée, isLoading false, liste inchangée", async () => {
    const store = useSortiesStore();
    const api: SortiesApi = { creerSortie: vi.fn().mockRejectedValue(new Error("réseau down")) };

    const resultat = await store.ajouterSortie({ titre: "Piscine", date: dateFuture() }, api);

    expect(resultat).toBe(false);
    expect(store.error).toBe("Impossible de créer la sortie.");
    expect(store.isLoading).toBe(false);
    expect(store.sorties).toEqual([]);
  });
});

describe("AjouterSortieForm.vue — le geste complet, monté avec un vrai store Pinia", () => {
  it("une soumission avec des champs vides affiche l'erreur de validation, sans appeler l'API", async () => {
    const api: SortiesApi = { creerSortie: vi.fn() };
    const wrapper = mount(AjouterSortieForm, { props: { api } });

    await wrapper.get("form").trigger("submit");

    expect(api.creerSortie).not.toHaveBeenCalled();
    expect(wrapper.get('[role="alert"]').text()).toBe("Le titre est requis.");
  });

  it("une soumission valide crée la sortie, vide le formulaire, et émet 'created'", async () => {
    const api: SortiesApi = {
      creerSortie: vi.fn().mockResolvedValue({ id: "s1", titre: "Piscine", date: dateFuture() }),
    };
    const wrapper = mount(AjouterSortieForm, { props: { api } });

    await wrapper.get("#titre").setValue("Piscine");
    await wrapper.get("#date").setValue(dateFuture());
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(api.creerSortie).toHaveBeenCalledWith({ titre: "Piscine", date: dateFuture() });
    expect(wrapper.get("ul").text()).toContain("Piscine");
    expect((wrapper.get("#titre").element as HTMLInputElement).value).toBe("");
    expect(wrapper.emitted("created")).toHaveLength(1);
  });

  it("une soumission qui échoue affiche l'erreur et NE vide PAS le formulaire", async () => {
    const api: SortiesApi = { creerSortie: vi.fn().mockRejectedValue(new Error("boom")) };
    const wrapper = mount(AjouterSortieForm, { props: { api } });

    await wrapper.get("#titre").setValue("Piscine");
    await wrapper.get("#date").setValue(dateFuture());
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toBe("Impossible de créer la sortie.");
    expect((wrapper.get("#titre").element as HTMLInputElement).value).toBe("Piscine");
    expect(wrapper.emitted("created")).toBeUndefined();
  });
});
