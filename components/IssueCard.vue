<template>
<article class="card" tabindex="0" @click="$emit('open', issue)" @keydown.enter="$emit('open', issue)">
  <header class="card__head">
    <span class="card__number">#{{ issue.number }}</span>
    <span v-if="issue.assignee" class="card__avatar" :title="issue.assignee.login">
      <img :src="issue.assignee.avatarUrl" :alt="issue.assignee.login" />
    </span>
  </header>

  <h3 class="card__title">{{ issue.title }}</h3>

  <div v-if="issue.labels.length" class="card__labels">
    <span v-for="label in issue.labels.filter((l) => !l.name.startsWith('status:'))" :key="label.name" class="chip"
      :style="{ '--chip-color': `#${label.color}` }">
      {{ label.name }}
    </span>
  </div>

  <footer class="card__foot">
    <span class="card__time">{{ relativeTime }}</span>
  </footer>
</article>
</template>

<script setup lang="ts">
const props = defineProps<{ issue: BoardIssue }>()
defineEmits<{ (e: 'open', issue: BoardIssue): void }>()

const relativeTime = computed(() => {
  const updated = new Date(props.issue.updatedAt).getTime()
  const diffMs = Date.now() - updated
  const diffH = Math.round(diffMs / 3_600_000)
  if (diffH < 1) return 'gerade eben'
  if (diffH < 24) return `vor ${diffH}h`
  const diffD = Math.round(diffH / 24)
  if (diffD < 30) return `vor ${diffD}d`
  return new Date(props.issue.updatedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
})
</script>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.card {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: $space-3;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  cursor: grab;
  box-shadow: $shadow-card;
  transition: box-shadow $transition-base, transform $transition-base, border-color $transition-base;

  &:hover,
  &:focus-visible {
    box-shadow: $shadow-card-hover;
    border-color: $color-border-strong;
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
  }
}

.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card__number {
  font-family: $font-mono;
  font-size: 12px;
  color: $color-muted;
}

.card__avatar img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: block;
}

.card__title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: $color-ink;
}

.card__labels {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
}

.chip {
  font-family: $font-mono;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--chip-color) 14%, white);
  color: color-mix(in srgb, var(--chip-color) 65%, black);
  border: 1px solid color-mix(in srgb, var(--chip-color) 35%, white);
}

.card__foot {
  display: flex;
  justify-content: flex-end;
}

.card__time {
  font-size: 11px;
  color: $color-muted;
}
</style>
