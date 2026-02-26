import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import LoginForm from "../LoginForm.vue";

describe("LoginForm", () => {
  // TODO: Test rendu initial
  it.todo("affiche les inputs email et password");

  // TODO: Test validation email invalide
  it.todo("affiche une erreur pour un email invalide");

  // TODO: Test validation password court
  it.todo("affiche une erreur pour un mot de passe trop court");

  // TODO: Test submit valide → événement login
  it.todo("émet login avec les credentials quand le formulaire est valide");

  // TODO: Test bouton désactivé pendant loading
  it.todo("désactive le bouton pendant le chargement");
});
