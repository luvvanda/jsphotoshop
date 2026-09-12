<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  imageData: Object,
  channels: Object
})
const emit = defineEmits(['toggle', 'show-all', 'alpha-only'])

const previewCanvases = ref({
  gray: null,
  grayAlpha: null,
  rgb: null,
  rgba: null,
  r: null,
  g: null,
  b: null,
  a: null
})

function setRef(name, el) {
  if (el) previewCanvases.value[name] = el
}

function drawPreview(canvas, mode) {
  if (!canvas || !props.imageData) return

  const { width, height, data } = props.imageData
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  const out = ctx.createImageData(width, height)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    let vr = 0, vg = 0, vb = 0, va = 255

    switch (mode) {
      case 'gray':
        // Формула яркости Rec.601
        vr = vg = vb = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
        break
      case 'grayAlpha':
        vr = vg = vb = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
        va = a
        break
      case 'rgb':
        vr = r; vg = g; vb = b
        break
      case 'rgba':
        vr = r; vg = g; vb = b; va = a
        break
      case 'r':
        // Красный канал в grayscale (стандарт фоторедакторов)
        vr = vg = vb = r
        break
      case 'g':
        vr = vg = vb = g
        break
      case 'b':
        vr = vg = vb = b
        break
      case 'a':
        // Альфа — всегда в grayscale
        vr = vg = vb = a
        break
    }

    out.data[i]     = vr
    out.data[i + 1] = vg
    out.data[i + 2] = vb
    out.data[i + 3] = va
  }

  ctx.putImageData(out, 0, 0)
}

function redrawAll() {
  const c = previewCanvases.value
  drawPreview(c.gray, 'gray')
  drawPreview(c.grayAlpha, 'grayAlpha')
  drawPreview(c.rgb, 'rgb')
  drawPreview(c.rgba, 'rgba')
  drawPreview(c.r, 'r')
  drawPreview(c.g, 'g')
  drawPreview(c.b, 'b')
  drawPreview(c.a, 'a')
}

watch(() => props.imageData, redrawAll, { immediate: true })

const isGrayMode = computed(() => {
  const c = props.channels
  return c.r === c.g && c.g === c.b
})
</script>

<template>
  <div class="channels-panel">
    <h3>Каналы</h3>

    <template v-if="imageData">
      <div class="section-label">Представление</div>
      <div class="thumbs">
        <div class="thumb" title="Grayscale">
          <canvas :ref="el => setRef('gray', el)" />
          <span>1</span>
        </div>
        <div class="thumb" title="Grayscale + Alpha">
          <canvas :ref="el => setRef('grayAlpha', el)" />
          <span>2</span>
        </div>
        <div class="thumb" title="RGB">
          <canvas :ref="el => setRef('rgb', el)" />
          <span>3</span>
        </div>
        <div class="thumb" title="RGB + Alpha">
          <canvas :ref="el => setRef('rgba', el)" />
          <span>4</span>
        </div>
      </div>

      <div class="section-label">Отдельные каналы</div>
      <div class="thumbs">
        <button
          class="thumb"
          :class="{ off: !channels.r }"
          @click="emit('toggle', 'r')"
          title="Красный канал"
        >
          <canvas :ref="el => setRef('r', el)" />
          <span class="label-r">R</span>
        </button>

        <button
          class="thumb"
          :class="{ off: !channels.g }"
          @click="emit('toggle', 'g')"
          title="Зелёный канал"
        >
          <canvas :ref="el => setRef('g', el)" />
          <span class="label-g">G</span>
        </button>

        <button
          class="thumb"
          :class="{ off: !channels.b }"
          @click="emit('toggle', 'b')"
          title="Синий канал"
        >
          <canvas :ref="el => setRef('b', el)" />
          <span class="label-b">B</span>
        </button>

        <button
          class="thumb"
          :class="{ off: !channels.a }"
          @click="emit('toggle', 'a')"
          title="Альфа-канал (прозрачность)"
        >
          <canvas :ref="el => setRef('a', el)" />
          <span class="label-a">A</span>
        </button>
      </div>

      <div class="actions">
        <button class="mini" @click="emit('show-all')">Все</button>
        <button class="mini" @click="emit('alpha-only')">Только A</button>
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