import { describe, it, expect } from "vitest";
import { validateEmail, validatePassword } from "../utils/validators";

describe("validateEmail", () => {
  // TODO: Tester email valide → retourne null
  // TODO: Tester email vide → retourne message
  // TODO: Tester email sans @ → retourne message
  // TODO: Tester email sans domaine → retourne message
  it.todo("retourne null pour un email valide");
  it.todo("retourne un message pour un email vide");
  it.todo("retourne un message pour un email sans @");
});

describe("validatePassword", () => {
  // TODO: Tester password valide (>= 6 chars) → retourne null
  // TODO: Tester password trop court → retourne message
  // TODO: Tester password vide → retourne message
  it.todo("retourne null pour un mot de passe de 6+ caractères");
  it.todo("retourne un message pour un mot de passe trop court");
  it.todo("retourne un message pour un mot de passe vide");
});
