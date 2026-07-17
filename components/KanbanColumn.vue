<template>
  <section class="column">
    <header class="column__head" :style="{ '--accent': `#${column.color}` }">
      <div class="column__accent" />
      <h2 class="column__title">{{ column.label }}</h2>
      <span class="column__count">{{ issues.length }}</span>
      <button class="column__add" :title="$t('kanbanColumn.newIssue')" @click="emit('add', column.key)">+</button>
    </header>

    <draggable
      v-model="localIssues"
      :list="issues"
      class="column__list"
      group="board-issues"
      item-key="id"
      animation="150"
      ghost-class="card--ghost"
      @change="handleChange"
    >
      <template #item="{ element }">
        <IssueCard :issue="element" @open="emit('open', $event)" />
      </template>

      <template #footer>
        <p v-if="!issues.length" class="column__empty">{{ $t('kanbanColumn.noIssues')}}</p>
      </template>
    </draggable>
  </section>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'

const props = defineProps<{
  column: StatusColumn
  issues: BoardIssue[]
}>()  

const emit = defineEmits<{
  (e: 'open', issue: BoardIssue): void
  (e: 'moved', issue: BoardIssue, newStatusKey: string): void
  (e: 'add', statusKey: string): void
}>()  

// Lokale, mutierbare Kopie für vuedraggable (v-model). Die eigentliche
// Quelle der Wahrheit bleiben die GitHub-Issues; diese Liste ist nur die
// visuelle Repräsentation während des Drag-Vorgangs.
const localIssues = computed({
  get: () => props.issues,
  set: () => {
    /* vuedraggable mutiert hier zwischendurch – die eigentliche Umsortierung
       wird über das @change-Event unten behandelt, nicht über den Setter. */
  }     
})  

function handleChange(evt: any) {
  if (evt.added) {
    emit('moved', evt.added.element as BoardIssue, props.column.key)
  }  
}  
</script>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.column {
  display: flex;
  flex-direction: column;
  min-width: 280px;
  max-width: 280px;
  background: $color-surface-sunken;
  border-radius: $radius-lg;
  padding: $space-3;
  gap: $space-3;
}

.column__head {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-1 $space-1 $space-2;
}

.column__accent {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.column__title {
  font-family: $font-mono;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $color-ink-soft;
}

.column__count {
  font-family: $font-mono;
  font-size: 11px;
  color: $color-muted;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: 999px;
  padding: 1px 7px;
  margin-left: auto;
}

.column__add {
  background: transparent;
  border: 1px solid transparent;
  color: $color-muted;
  font-size: 16px;
  line-height: 1;
  width: 22px;
  height: 22px;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background $transition-fast, color $transition-fast;

  &:hover {
    background: $color-surface;
    color: $color-ink;
  }
}

.column__list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  min-height: 40px;
  flex: 1;
}

.column__empty {
  font-size: 12px;
  color: $color-muted;
  text-align: center;
  padding: $space-3 0;
  border: 1px dashed $color-border-strong;
  border-radius: $radius-md;
}

:deep(.card--ghost) {
  opacity: 0.4;
}
</style>
