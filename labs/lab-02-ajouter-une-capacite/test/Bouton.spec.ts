// Oracle du lab 02 (Vue). Ne pas modifier.
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Bouton from "@lab/Bouton.vue";

describe("Bouton — non-régression (déjà correct, ne doit jamais casser)", () => {
  it("affiche le contenu du slot", () => {
    const wrapper = mount(Bouton, { slots: { default: "Envoyer l'invitation" } });
    expect(wrapper.text()).toBe("Envoyer l'invitation");
  });

  it("applique la classe de la variante primaire par défaut", () => {
    const wrapper = mount(Bouton, { slots: { default: "OK" } });
    expect(wrapper.get("button").classes()).toContain("btn-primaire");
  });

  it("applique la classe de la variante secondaire quand demandé", () => {
    const wrapper = mount(Bouton, { props: { variant: "secondaire" }, slots: { default: "OK" } });
    expect(wrapper.get("button").classes()).toContain("btn-secondaire");
  });

  it("émet 'click' sur un clic normal (hors chargement)", async () => {
    const wrapper = mount(Bouton, { slots: { default: "OK" } });
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
  });
});

describe("Bouton — nouvelle capacité : état de chargement (le ticket)", () => {
  it("désactive le bouton quand loading est vrai", () => {
    const wrapper = mount(Bouton, { props: { loading: true }, slots: { default: "Envoyer" } });
    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
  });

  it("porte aria-busy=\"true\" quand loading est vrai", () => {
    const wrapper = mount(Bouton, { props: { loading: true }, slots: { default: "Envoyer" } });
    expect(wrapper.get("button").attributes("aria-busy")).toBe("true");
  });

  it("affiche un indicateur visuel de chargement", () => {
    const wrapper = mount(Bouton, { props: { loading: true }, slots: { default: "Envoyer" } });
    expect(wrapper.find(".spinner").exists()).toBe(true);
  });

  it("n'affiche AUCUN indicateur de chargement hors chargement (par défaut)", () => {
    const wrapper = mount(Bouton, { slots: { default: "Envoyer" } });
    expect(wrapper.find(".spinner").exists()).toBe(false);
  });

  it("n'émet JAMAIS 'click' pendant le chargement — plus d'invitation envoyée en double", async () => {
    const wrapper = mount(Bouton, { props: { loading: true }, slots: { default: "Envoyer" } });
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("click")).toBeUndefined();
  });

  it("le contenu du slot reste affiché même en chargement (le spinner s'ajoute, ne remplace pas)", () => {
    const wrapper = mount(Bouton, { props: { loading: true }, slots: { default: "Envoyer l'invitation" } });
    expect(wrapper.text()).toContain("Envoyer l'invitation");
  });
});
