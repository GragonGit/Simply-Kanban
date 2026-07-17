<template>
  <div class="board-page">
    <header class="topbar">
      <div class="topbar__identity">
        <span class="topbar__dot" />
        <span class="topbar__repo">{{ settings.owner }}/{{ settings.repo }}</span>
      </div>
      <div class="topbar__actions">
        <button class="btn btn--ghost" :disabled="loading" @click="load">
          {{ loading ? $t('kanbanBoard.loading') : $t('kanbanBoard.refresh') }}
        </button>
        <button class="btn btn--ghost" @click="disconnect">{{ $t('kanbanBoard.changeRepo') }}</button>
      </div>
    </header>

    <p v-if="errorMessage" class="banner banner--error" role="alert">{{ errorMessage }}</p>

    <div v-if="loading && !issues.length" class="loading">{{ $t('kanbanBoard.loadingIssues') }}</div>

    <div v-else class="board">
      <KanbanColumn
        v-for="col in columns"
        :key="col.key"
        :column="col"
        :issues="col.issues"
        @open="openIssue"
        @moved="handleMoved"
        @add="openNewIssue"
      />
    </div>

    <IssueModal
      v-if="showModal"
      :issue="activeIssue"
      :default-status="modalDefaultStatus"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
const { settings, clear } = useSettings()
const { fetchIssues, updateIssueStatus, updateIssueContent, createIssue, ensureStatusLabelsExist } = useGithub()

const issues = ref<BoardIssue[]>([])
const loading = ref(true)
const errorMessage = ref('')
const activeIssue = ref<BoardIssue | null>(null)
const showModal = ref(false)
const modalDefaultStatus = ref('todo')
const labelSetupDone = ref(false)

const columns = computed(() =>
  STATUS_COLUMNS.map((col) => ({
    ...col,
    issues: issues.value.filter((issue) => issue.status === col.key)
  }))
)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    if (!labelSetupDone.value) {
      await ensureStatusLabelsExist()
      labelSetupDone.value = true
    }
    issues.value = await fetchIssues()
  } catch (err: any) {
    errorMessage.value = err?.message || $t('kanbanBoard.couldNotLoadIssues')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openIssue(issue: BoardIssue) {
  activeIssue.value = issue
  showModal.value = true
}

function openNewIssue(statusKey: string) {
  activeIssue.value = null
  modalDefaultStatus.value = statusKey
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  activeIssue.value = null
}

async function handleMoved(issue: BoardIssue, newStatusKey: string) {
  const previousStatus = issue.status
  issue.status = newStatusKey
  try {
    await updateIssueStatus(issue, newStatusKey)
  } catch (err: any) {
    issue.status = previousStatus
    errorMessage.value = err?.message || $t('kanbanBoard.couldUpdateStatus')
  }
}

async function handleSave(payload: { title: string; body: string; status: string; closeIssue: boolean }) {
  errorMessage.value = ''
  try {
    if (activeIssue.value) {
      const issueNumber = activeIssue.value.number
      const statusChanged = activeIssue.value.status !== payload.status
      await updateIssueContent(issueNumber, {
        title: payload.title,
        body: payload.body,
        ...(payload.closeIssue ? { state: 'closed' as const } : {})
      })
      if (statusChanged) {
        await updateIssueStatus(activeIssue.value, payload.status)
      }
    } else {
      await createIssue(payload.title, payload.body, payload.status)
    }
    closeModal()
    await load()
  } catch (err: any) {
    errorMessage.value = err?.message || $t('kanbanBoard.savingFailed')
  }
}

function disconnect() {
  clear()
}
</script>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.board-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-4 $space-5;
  border-bottom: 1px solid $color-border;
  background: $color-surface;
}

.topbar__identity {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.topbar__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: $color-done;
}

.topbar__repo {
  font-family: $font-mono;
  font-size: 14px;
  font-weight: 500;
}

.topbar__actions {
  display: flex;
  gap: $space-2;
}

.banner {
  margin: $space-3 $space-5 0;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  font-size: 13px;
}

.banner--error {
  background: rgba($color-danger, 0.08);
  border: 1px solid rgba($color-danger, 0.25);
  color: $color-danger;
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $color-muted;
  font-family: $font-mono;
  font-size: 13px;
}

.board {
  flex: 1;
  display: flex;
  gap: $space-4;
  padding: $space-5;
  overflow-x: auto;
  align-items: flex-start;
}

.btn {
  border: 1px solid $color-border-strong;
  border-radius: $radius-sm;
  padding: $space-2 $space-3;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  color: $color-ink-soft;
  transition: background $transition-fast;

  &:hover:not(:disabled) {
    background: $color-surface-sunken;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
