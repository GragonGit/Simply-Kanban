<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useGithub } from '../composables/useGithub';
import { useSettings } from '../composables/useSettings';

const { settings, save, clear } = useSettings()
const { testConnection } = useGithub()

const emit = defineEmits<{ (e: 'connected'): void }>()

const form = reactive({
  owner: settings.value.owner,
  repo: settings.value.repo,
  token: settings.value.token
})

const status = ref<'idle' | 'testing' | 'error'>('idle')
const errorMessage = ref('')

const canSubmit = computed(() => !!(form.owner.trim() && form.repo.trim() && form.token.trim()))

async function handleSubmit() {
  if (!canSubmit.value) return
  status.value = 'testing'
  errorMessage.value = ''

  save({ owner: form.owner.trim(), repo: form.repo.trim(), token: form.token.trim() })

  try {
    await testConnection()
    status.value = 'idle'
    emit('connected')
  } catch (err: any) {
    status.value = 'error'
    errorMessage.value = err?.message || 'Verbindung fehlgeschlagen.'
  }
}

function handleReset() {
  clear()
  form.owner = ''
  form.repo = ''
  form.token = ''
  status.value = 'idle'
  errorMessage.value = ''
}
</script>

<template>
  <div class="settings">
    <div class="settings__card">
      <p class="settings__eyebrow">Setup</p>
      <h1 class="settings__title">Board mit einem Repo verbinden</h1>
      <p class="settings__lead">
        Das Board arbeitet direkt mit den Issues eines einzelnen Repositories. Zugangsdaten bleiben
        ausschließlich in deinem Browser (localStorage) – es gibt keinen Server dazwischen.
      </p>

      <form class="settings__form" @submit.prevent="handleSubmit">
        <div class="settings__row">
          <label class="settings__field">
            <span class="settings__label">Owner</span>
            <input v-model="form.owner" type="text" placeholder="z. B. octocat" autocomplete="off" />
          </label>
          <label class="settings__field">
            <span class="settings__label">Repository</span>
            <input v-model="form.repo" type="text" placeholder="z. B. hello-world" autocomplete="off" />
          </label>
        </div>

        <label class="settings__field">
          <span class="settings__label">Personal Access Token</span>
          <input v-model="form.token" type="password" placeholder="github_pat_…" autocomplete="off" />
        </label>

        <p class="settings__hint">
          Fine-grained Token mit Lesen/Schreiben-Rechten für „Issues“ auf genau dieses Repo, erstellbar unter
          <code>github.com/settings/tokens?type=beta</code>.
        </p>

        <p v-if="status === 'error'" class="settings__error" role="alert">{{ errorMessage }}</p>

        <div class="settings__actions">
          <button type="submit" class="btn btn--primary" :disabled="!canSubmit || status === 'testing'">
            {{ status === 'testing' ? 'Verbinde…' : 'Verbinden' }}
          </button>
          <button type="button" class="btn btn--ghost" @click="handleReset">Zurücksetzen</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.settings {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-5;
}

.settings__card {
  width: 100%;
  max-width: 480px;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: $shadow-card;
}

.settings__eyebrow {
  font-family: $font-mono;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $color-muted;
  margin-bottom: $space-2;
}

.settings__title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: $space-2;
}

.settings__lead {
  color: $color-muted;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: $space-5;
}

.settings__form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.settings__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
}

.settings__field {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.settings__label {
  font-size: 12px;
  font-weight: 500;
  color: $color-ink-soft;
}

input {
  border: 1px solid $color-border-strong;
  border-radius: $radius-sm;
  padding: $space-2 $space-3;
  background: $color-bg;
  transition: border-color $transition-fast;

  &:focus-visible {
    border-color: $color-progress;
  }
}

.settings__hint {
  font-size: 12px;
  color: $color-muted;
  line-height: 1.5;

  code {
    font-family: $font-mono;
    background: $color-surface-sunken;
    padding: 1px 5px;
    border-radius: 4px;
  }
}

.settings__error {
  font-size: 13px;
  color: $color-danger;
  background: rgba($color-danger, 0.08);
  border: 1px solid rgba($color-danger, 0.25);
  border-radius: $radius-sm;
  padding: $space-2 $space-3;
}

.settings__actions {
  display: flex;
  gap: $space-2;
  margin-top: $space-2;
}

.btn {
  border: 1px solid transparent;
  border-radius: $radius-sm;
  padding: $space-2 $space-4;
  font-size: 14px;
  font-weight: 500;
  transition: transform $transition-fast, background $transition-fast, border-color $transition-fast;

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
  border-color: $color-border-strong;
  color: $color-ink-soft;

  &:hover {
    background: $color-surface-sunken;
  }
}
</style>
