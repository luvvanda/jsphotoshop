<script setup>
import { computed } from 'vue'
import { rgbToLab, round2 } from '../utils/color'

const props = defineProps({
  pixel: Object,         // { x, y } или null
  imageData: Object,     // оригинал
  eyedropperActive: Boolean
})

const pixelData = computed(() => {
  if (!props.pixel || !props.imageData) return null
  const { x, y } = props.pixel
  const { width, height, data } = props.imageData
  if (x < 0 || y < 0 || x >= width || y >= height) return null

  const i = (y * width + x) * 4
  return {
    x, y,
    r: data[i],
    g: data[i + 1],
    b: data[i + 2],
    a: data[i + 3]
  }
})

const lab = computed(() => {
  if (!pixelData.value) return null
  const { r, g, b } = pixelData.value
  const { L, a, b: bb } = rgbToLab(r, g, b)
  return {
    L: round2(L),
    a: round2(a),
    b: round2(bb)
  }
})

function toHex(c) {
  if (!c) return '—'
  return '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}
</script>

<template>
  <div class="panel">
    <h3>Пипетка</h3>

    <template v-if="pixelData">
      <div class="row"><span>X, Y</span><b>{{ pixelData.x }}, {{ pixelData.y }}</b></div>

      <div class="section">RGB</div>
      <div class="row"><span>R</span><b class="c-r">{{ pixelData.r }}</b></div>
      <div class="row"><span>G</span><b class="c-g">{{ pixelData.g }}</b></div>
      <div class="row"><span>B</span><b class="c-b">{{ pixelData.b }}</b></div>
      <div class="row"><span>A</span><b>{{ pixelData.a }}</b></div>
      <div class="row"><span>HEX</span><b>{{ toHex(pixelData) }}</b></div>

      <div class="section">CIELAB</div>
      <div class="row"><span>L*</span><b>{{ lab.L }}</b></div>
      <div class="row"><span>a*</span><b>{{ lab.a }}</b></div>
      <div class="row"><span>b*</span><b>{{ lab.b }}</b></div>

      <div
        class="swatch"
        :style="{ background: `rgba(${pixelData.r},${pixelData.g},${pixelData.b},${pixelData.a/255})` }"
      />
    </template>

    <p v-else-if="eyedropperActive" class="hint active">
      Кликните по изображению на холсте
    </p>
    <p v-else class="hint">
      Активируйте инструмент «Пипетка» в панели инструментов
    </p>
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
.section {
  margin-top: 10px;
  margin-bottom: 4px;
  color: #666;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}
.row span { color: #777; }
.c-r { color: #ff6b6b; }
.c-g { color: #6bff6b; }
.c-b { color: #6bafff; }
.swatch {
  margin-top: 10px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid #444;
}
.hint { color: #555; font-style: italic; }
.hint.active { color: #4fc3f7; }
</style>