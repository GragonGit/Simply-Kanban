<template>
  <main class="page">
    <template v-if="ready">
      <SettingsPanel v-if="!isConfigured" />
      <KanbanBoard v-else />
    </template>
  </main>
</template>

<script setup lang="ts">
const { isConfigured, hydrate } = useSettings()

const ready = ref(false)

onMounted(() => {
  hydrate()
  ready.value = true
})
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
}
</style>
