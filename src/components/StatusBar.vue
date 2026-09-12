<script setup>
defineProps({
  info: Object,
  fileName: String
})
</script>

<template>
  <footer class="statusbar">
    <span v-if="fileName">{{ fileName }}</span>
    <span v-if="info"> {{ info.width }} × {{ info.height }} px</span>
    <span v-if="info"> глубина: {{ info.colorDepth }} бит</span>
    <span v-if="info"> формат: {{ info.format }}</span>
    <span v-if="info?.hasMask"> маска</span>
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