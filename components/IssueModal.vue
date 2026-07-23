<template>
  <div class="overlay" @mousedown="handleOverlayClick">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal__head">
        <span v-if="isEditMode" class="modal__eyebrow">Issue #{{ issue!.number }}</span>
        <span v-else class="modal__eyebrow">{{ $t('issueModal.newIssue') }}</span>
        <a v-if="isEditMode" :href="issue!.htmlUrl" target="_blank" rel="noopener" class="modal__link">
          {{ $t('issueModal.openInGitHub') }} ↗
        </a>
      </header>

      <label class="field">
        <span class="field__label">{{ $t('issueModal.title') }}</span>
        <input v-model="form.title" type="text" :placeholder="$t('issueModal.titlePlaceholder')" />
      </label>

      <label class="field">
        <span class="field__label">{{ $t('issueModal.description') }}</span>
        <textarea v-model="form.body" rows="6" :placeholder="$t('issueModal.descriptionPlaceholder')" />
      </label>

      <label class="field">
        <span class="field__label">{{ $t('issueModal.status') }}</span>
        <select v-model="form.status">
          <option v-for="col in STATUS_COLUMNS" :key="col.key" :value="col.key">{{ col.label }}</option>
        </select>
      </label>

      <label v-if="isEditMode && form.status === 'done'" class="field field--checkbox">
        <input v-model="form.closeIssue" type="checkbox" />
        <span>{{ $t('issueModal.closeIssue') }}</span>
      </label>

      <div class="field">
        <span class="field__label">{{ $t('issueModal.labels') }}</span>
        <div ref="labelMenuRef" class="multiselect" :class="{ 'multiselect--open': labelMenuOpen }">
          <button type="button" class="multiselect__control" @click="toggleLabelMenu">
            <span v-if="form.labels.length === 0" class="multiselect__placeholder">
              {{ $t('issueModal.selectLabels') }}
            </span>
            <span v-else class="multiselect__chips">
              <span
                v-for="name in form.labels"
                :key="name"
                class="chip"
                :style="{ '--chip-color': '#' + labelColor(name) }"
              >
                {{ name }}
                <button
                  type="button"
                  class="chip__remove"
                  :aria-label="$t('issueModal.removeLabel')"
                  @click.stop="removeLabel(name)"
                >×</button>
              </span>
            </span>
            <span class="multiselect__caret" aria-hidden="true">▾</span>
          </button>

          <div v-if="labelMenuOpen" class="multiselect__panel">
            <input
              v-if="selectableLabels.length > 6"
              v-model="labelSearch"
              type="text"
              class="multiselect__search"
              :placeholder="$t('issueModal.searchLabels')"
            />

            <p v-if="labelsLoading" class="multiselect__hint">{{ $t('issueModal.loadingLabels') }}</p>
            <p v-else-if="labelsError" class="multiselect__hint multiselect__hint--error">{{ labelsError }}</p>
            <p v-else-if="filteredSelectableLabels.length === 0" class="multiselect__hint">
              {{ $t('issueModal.noLabels') }}
            </p>
            <label v-for="label in filteredSelectableLabels" :key="label.name" class="multiselect__option">
              <input v-model="form.labels" type="checkbox" :value="label.name" />
              <span class="multiselect__dot" :style="{ background: '#' + label.color }" />
              <span class="multiselect__option-name">{{ label.name }}</span>
            </label>
          </div>
        </div>
      </div>

      <footer class="modal__actions">
        <button class="btn btn--ghost" @click="emit('close')">{{ $t('issueModal.cancel') }}</button>
        <button class="btn btn--primary" :disabled="!canSave || saving" @click="handleSave">
          {{ saving ? $t('issueModal.saving') : isEditMode ? $t('issueModal.save') : $t('issueModal.createIssue') }}
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
  (e: 'save', payload: { title: string; body: string; status: string; closeIssue: boolean; labels: string[] }): void
}>()

const { t } = useI18n()
const { fetchLabels } = useGithub()

const isEditMode = computed(() => !!props.issue)

const form = reactive({
  title: props.issue?.title ?? '',
  body: props.issue?.body ?? '',
  status: props.issue?.status ?? props.defaultStatus ?? 'todo',
  closeIssue: false,
  labels: (props.issue?.labels ?? [])
    .map((l) => l.name)
    .filter((name) => !name.startsWith('status:')) as string[]
})

const saving = ref(false)
const canSave = computed(() => form.title.trim().length > 0)

const availableLabels = ref<IssueLabel[]>([])
const labelsLoading = ref(false)
const labelsError = ref<string | null>(null)
const labelMenuOpen = ref(false)
const labelMenuRef = ref<HTMLElement | null>(null)
const labelSearch = ref('')

const selectableLabels = computed(() => availableLabels.value.filter((l) => !l.name.startsWith('status:')))

const filteredSelectableLabels = computed(() => {
  const term = labelSearch.value.trim().toLowerCase()
  if (!term) return selectableLabels.value
  return selectableLabels.value.filter((l) => l.name.toLowerCase().includes(term))
})

function labelColor(name: string): string {
  return availableLabels.value.find((l) => l.name === name)?.color ?? '888888'
}

function toggleLabelMenu() {
  labelMenuOpen.value = !labelMenuOpen.value
}

function removeLabel(name: string) {
  form.labels = form.labels.filter((n) => n !== name)
}

async function loadLabels() {
  labelsLoading.value = true
  labelsError.value = null
  try {
    availableLabels.value = await fetchLabels()
  } catch (err: any) {
    labelsError.value = err?.message ?? t('issueModal.loadingLabelsError')
  } finally {
    labelsLoading.value = false
  }
}

async function handleSave() {
  if (!canSave.value) return
  saving.value = true
  emit('save', {
    title: form.title.trim(),
    body: form.body,
    status: form.status,
    closeIssue: form.closeIssue,
    labels: form.labels
  })
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (labelMenuOpen.value) {
    labelMenuOpen.value = false
  } else {
    emit('close')
  }
}

function handleClickOutsideLabelMenu(e: MouseEvent) {
  if (!labelMenuOpen.value) return
  if (labelMenuRef.value && !labelMenuRef.value.contains(e.target as Node)) {
    labelMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('mousedown', handleClickOutsideLabelMenu)
  loadLabels()
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('mousedown', handleClickOutsideLabelMenu)
})
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

.multiselect {
  position: relative;
}

.multiselect__control {
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: $space-2;
  border: 1px solid $color-border-strong;
  border-radius: $radius-sm;
  background: $color-bg;
  padding: $space-2 $space-3;
  cursor: pointer;
  text-align: left;
  transition: border-color $transition-fast;

  .multiselect--open & {
    border-color: $color-progress;
  }
}

.multiselect__placeholder {
  color: $color-muted;
  font-size: 14px;
  flex: 1;
}

.multiselect__chips {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px $space-2;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: $color-ink;
  background: color-mix(in srgb, var(--chip-color) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--chip-color) 55%, transparent);
}

.chip__remove {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  opacity: 0.6;

  &:hover {
    opacity: 1;
  }
}

.multiselect__caret {
  color: $color-muted;
  font-size: 12px;
}

.multiselect__panel {
  position: absolute;
  top: calc(100% + #{$space-1});
  left: 0;
  right: 0;
  z-index: 10;
  max-height: 220px;
  overflow-y: auto;
  background: $color-surface;
  border: 1px solid $color-border-strong;
  border-radius: $radius-sm;
  box-shadow: $shadow-modal;
  padding: $space-2;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.multiselect__search {
  margin-bottom: $space-1;
}

.multiselect__hint {
  font-size: 12px;
  color: $color-muted;
  padding: $space-2;
  margin: 0;

  &--error {
    color: $color-danger;
  }
}

.multiselect__option {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2;
  border-radius: $radius-sm;
  font-size: 13px;
  color: $color-ink-soft;
  cursor: pointer;

  &:hover {
    background: $color-surface-sunken;
  }

  input {
    width: 14px;
    height: 14px;
  }
}

.multiselect__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.multiselect__option-name {
  flex: 1;
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