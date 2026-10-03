<script setup>
import { ref, watch, nextTick } from 'vue'
const props = defineProps({ imageData: Object, channels: Object, availableChannels: Array, isGrayscale: Boolean, hasAlpha: Boolean })
const emit = defineEmits(['toggle', 'show-all', 'alpha-only'])
const canvases = ref({})
const labels = { gray: 'Gray', r: 'R', g: 'G', b: 'B', a: 'Alpha' }
const names = { gray: 'Серый', r: 'Красный', g: 'Зелёный', b: 'Синий', a: 'Прозрачность' }
function draw() {
  if (!props.imageData) return
  const { width, height, data } = props.imageData
  for (const key of props.availableChannels || []) {
    const canvas = canvases.value[key]
    if (!canvas) continue
    // Bounded thumbnails preserve aspect ratio; alpha is always a grayscale mask.
    const scale = Math.min(150 / width, 90 / height)
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const ctx = canvas.getContext('2d'), preview = ctx.createImageData(canvas.width, canvas.height)
    const component = { gray: 0, r: 0, g: 1, b: 2, a: 3 }[key]
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const sx = Math.min(width - 1, Math.floor(x * width / canvas.width))
      const sy = Math.min(height - 1, Math.floor(y * height / canvas.height))
      const value = data[(sy * width + sx) * 4 + component], i = (y * canvas.width + x) * 4
      preview.data[i] = preview.data[i + 1] = preview.data[i + 2] = value
      preview.data[i + 3] = 255
    }
    ctx.putImageData(preview, 0, 0)
  }
}
watch(() => [props.imageData, props.availableChannels], async () => { await nextTick(); draw() }, { immediate: true })
</script>
<template>
  <div class="channels-panel">
    <h3>Каналы</h3>
    <template v-if="imageData">
      <div class="section-label">{{ isGrayscale ? 'Grayscale' : 'RGB' }}{{ hasAlpha ? ' + Alpha' : '' }} · {{ availableChannels.length }} канал(а)</div>
      <div class="thumbs">
        <button v-for="key in availableChannels" :key="key" class="thumb"
          :class="{ off: !channels[key] }" :aria-pressed="!!channels[key]"
          :aria-label="`${names[key]}: ${channels[key] ? 'включён' : 'выключен'}`"
          :title="names[key]" @click="emit('toggle', key)">
          <canvas :ref="el => { canvases[key] = el }" />
          <span>{{ labels[key] }} · {{ channels[key] ? 'вкл' : 'выкл' }}</span>
        </button>
      </div>
      <div class="actions">
        <button class="mini" @click="emit('show-all')">Все</button>
        <button v-if="hasAlpha" class="mini" @click="emit('alpha-only')">Только Alpha</button>
      </div>
    </template>
    <p v-else class="hint">Загрузите изображение</p>
  </div>
</template>
<style scoped>
.channels-panel {
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
.section-label {
  color: #666;
  font-size: 10px;
  text-transform: uppercase;
  margin: 12px 0 6px;
  letter-spacing: 0.5px;
}
.thumbs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.thumb {
  position: relative;
  aspect-ratio: 1;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  overflow: hidden;
  padding: 0;
  cursor: default;
  min-height: 90px;
}
.thumb canvas {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  image-rendering: pixelated;
}
button.thumb {
  cursor: pointer;
  transition: border-color 0.15s, opacity 0.15s;
}
button.thumb:hover {
  border-color: #4fc3f7;
}
button.thumb.off {
  opacity: 0.35;
  border-style: dashed;
}
button.thumb.off::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent 45%, #666 45%, #666 55%, transparent 55%);
}
.thumb span {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  background: rgba(0,0,0,0.6);
  padding: 0 4px;
  border-radius: 2px;
  color: #ccc;
}
.label-r { color: #ff6b6b !important; }
.label-g { color: #6bff6b !important; }
.label-b { color: #6bafff !important; }
.label-a { color: #ccc !important; }
.actions {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}
.mini {
  flex: 1;
  background: #2d2d2d;
  color: #ccc;
  border: 1px solid #444;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}
.mini:hover {
  background: #3a3a3a;
}
.hint {
  color: #555;
  font-style: italic;
}
</style>