import { defineStore } from "pinia";
import { ref } from "vue";
import type { Notification } from "../types";

/**
 * TODO: Store notifications (setup syntax)
 */
export const useNotificationStore = defineStore("notifications", () => {
  const notifications = ref<Notification[]>([]);

  // TODO: notify(message, type) — ajouter + auto-dismiss après 5s
  function notify(
    _message: string,
    _type: Notification["type"] = "info",
  ): void {
    // TODO
  }

  // TODO: dismiss(id) — supprimer une notification
  function dismiss(_id: number): void {
    // TODO
  }

  return { notifications, notify, dismiss };
});
