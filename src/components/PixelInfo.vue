<script setup>
import { computed } from 'vue'

const props = defineProps({
  pixel: Object,
  data: Object,
  getPixel: Function
})

const pixelData = computed(() => {
  if (!props.pixel || !props.data) return null
  return props.getPixel(props.pixel.x, props.pixel.y)
})

function toHex(c) {
  if (!c) return '—'
  return '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}
</script>

<template>
  <div class="panel">
    <h3>Пиксель</h3>
    <template v-if="pixelData">
      <div class="row"><span>X, Y</span><b>{{ pixel.x }}, {{ pixel.y }}</b></div>
      <div class="row"><span>R</span><b>{{ pixelData.r }}</b></div>
      <div class="row"><span>G</span><b>{{ pixelData.g }}</b></div>
      <div class="row"><span>B</span><b>{{ pixelData.b }}</b></div>
      <div class="row"><span>A</span><b>{{ pixelData.a }}</b></div>
      <div class="row"><span>HEX</span><b>{{ toHex(pixelData) }}</b></div>
      <div
        class="swatch"
        :style="{ background: `rgba(${pixelData.r},${pixelData.g},${pixelData.b},${pixelData.a/255})` }"
      />
    </template>
    <p v-else class="hint">Наведите на canvas</p>
  </div>
</template>

<style scoped>
.panel {
  padding: 12px 16px;
  font: 12px/1.6 ui-monospace, monospace;
  color: #ccc;
}
h3 {
  font: 600 11px system-ui, sans-serif;
  text-transform: uppercase;
  color: #888;
  letter-spacing: 0.5px;
  margin: 0 0 8px;
}
.row { display: flex; justify-content: space-between; padding: 2px 0; }
.row span { color: #777; }
.swatch {
  margin-top: 8px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #444;
}
.hint { color: #555; font-style: italic; }
</style>