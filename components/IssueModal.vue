<template>
  <div class="overlay" @mousedown="handleOverlayClick">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal__head">
        <span v-if="isEditMode" class="modal__eyebrow">Issue #{{ issue!.number }}</span>
        <span v-else class="modal__eyebrow">Neues Issue</span>
        <a v-if="isEditMode" :href="issue!.htmlUrl" target="_blank" rel="noopener" class="modal__link">
          Auf GitHub öffnen ↗
        </a>
      </header>

      <label class="field">
        <span class="field__label">Titel</span>
        <input v-model="form.title" type="text" placeholder="Kurze, klare Beschreibung" />
      </label>

      <label class="field">
        <span class="field__label">Beschreibung</span>
        <textarea v-model="form.body" rows="6" placeholder="Details, Kontext, Akzeptanzkriterien…" />
      </label>

      <label class="field">
        <span class="field__label">Status</span>
        <select v-model="form.status">
          <option v-for="col in STATUS_COLUMNS" :key="col.key" :value="col.key">{{ col.label }}</option>
        </select>
      </label>

      <label v-if="isEditMode && form.status === 'done'" class="field field--checkbox">
        <input v-model="form.closeIssue" type="checkbox" />
        <span>Issue auf GitHub zusätzlich schließen</span>
      </label>

      <footer class="modal__actions">
        <button class="btn btn--ghost" @click="emit('close')">Abbrechen</button>
        <button class="btn btn--primary" :disabled="!canSave || saving" @click="handleSave">
          {{ saving ? 'Speichere…' : isEditMode ? 'Speichern' : 'Issue erstellen' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  issue: BoardIssue | null
  defaultStatus?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { title: string; body: string; status: string; closeIssue: boolean }): void
}>()

const isEditMode = computed(() => !!props.issue)

const form = reactive({
  title: props.issue?.title ?? '',
  body: props.issue?.body ?? '',
  status: props.issue?.status ?? props.defaultStatus ?? 'todo',
  closeIssue: false
})

const saving = ref(false)
const canSave = computed(() => form.title.trim().length > 0)

async function handleSave() {
  if (!canSave.value) return
  saving.value = true
  emit('save', {
    title: form.title.trim(),
    body: form.body,
    status: form.status,
    closeIssue: form.closeIssue
  })
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 23, 31, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
  z-index: 100;
}

.modal {
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  background: $color-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-modal;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal__eyebrow {
  font-family: $font-mono;
  font-size: 12px;
  color: $color-muted;
  letter-spacing: 0.04em;
}

.modal__link {
  font-size: 12px;
  color: $color-progress;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.field__label {
  font-size: 12px;
  font-weight: 500;
  color: $color-ink-soft;
}

input[type='text'],
textarea,
select {
  border: 1px solid $color-border-strong;
  border-radius: $radius-sm;
  padding: $space-2 $space-3;
  background: $color-bg;
  transition: border-color $transition-fast;
  resize: vertical;
  font-family: $font-sans;

  &:focus-visible {
    border-color: $color-progress;
  }
}

.field--checkbox {
  flex-direction: row;
  align-items: center;
  gap: $space-2;
  font-size: 13px;
  color: $color-ink-soft;

  input {
    width: 16px;
    height: 16px;
  }
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  margin-top: $space-2;
}

.btn {
  border: 1px solid transparent;
  border-radius: $radius-sm;
  padding: $space-2 $space-4;
  font-size: 14px;
  font-weight: 500;
  transition: transform $transition-fast, background $transition-fast;

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn--primary {
  background: $color-ink;
  color: $color-surface;

  &:hover:not(:disabled) {
    background: $color-ink-soft;
  }
}

.btn--ghost {
  background: transparent;
  border: 1px solid $color-border-strong;
  color: $color-ink-soft;

  &:hover {
    background: $color-surface-sunken;
  }
}
</style>
