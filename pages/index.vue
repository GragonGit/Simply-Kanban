<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSettings } from '../composables/useSettings'

const { isConfigured, hydrate } = useSettings()

// localStorage ist erst nach dem Mount verfügbar -> erst danach wissen wir,
// ob bereits Zugangsdaten hinterlegt sind.
const ready = ref(false)

onMounted(() => {
  hydrate()
  ready.value = true
})
</script>

<template>
  <main class="page">
    <template v-if="ready">
      <SettingsPanel v-if="!isConfigured" />
      <KanbanBoard v-else />
    </template>
  </main>
</template>

<style lang="scss" scoped>
.page {
  height: 100vh;
}
</style>
