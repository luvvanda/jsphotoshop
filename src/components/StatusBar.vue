<script setup>
import { computed } from 'vue'

const props = defineProps({
  info: Object,
  fileName: String
})

const depthText = computed(() => {
  if (!props.info) return ''
  const { colorDepth, channels, isGrayscale } = props.info

  if (isGrayscale) {
    return `${colorDepth} бит × 1 канал`
  }
  return `${colorDepth} бит/канал × ${channels} канала`
})
</script>

<template>
  <footer class="statusbar">
    <span v-if="fileName">{{ fileName }}</span>
    <span v-if="info">📐 {{ info.width }} × {{ info.height }} px</span>
    <span v-if="info">🎨 {{ depthText }}</span>
    <span v-if="info">📦 формат: {{ info.format }}</span>
    <span v-if="info?.hasMask">🎭 маска</span>
    <span v-if="!info" class="hint">Изображение не загружено</span>
  </footer>
</template>

<style scoped>
.statusbar {
  display: flex;
  gap: 24px;
  padding: 6px 16px;
  background: #1a1a1a;
  border-top: 1px solid #333;
  color: #aaa;
  font: 12px ui-monospace, monospace;
  min-height: 28px;
  align-items: center;
}
.hint { color: #555; font-style: italic; }
</style>