<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  title?: string;
}>();

const emit = defineEmits<{ close: [] }>();

// TODO: Fermeture via Escape (onKeydown) et clic overlay
// TODO: Focus trap basique
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content" role="dialog" aria-modal="true">
        <!-- TODO: Slot header / default / footer -->
        <header v-if="title">
          <h3>{{ title }}</h3>
          <button @click="emit('close')" aria-label="Fermer">&times;</button>
        </header>
        <div class="modal-body">
          <slot />
        </div>
        <footer>
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>
