<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  imageData: Object
})
const emit = defineEmits(['hover'])

const canvasRef = ref(null)

function draw() {
  if (!canvasRef.value || !props.imageData) return
  const { width, height } = props.imageData
  canvasRef.value.width = width
  canvasRef.value.height = height
  const ctx = canvasRef.value.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.putImageData(props.imageData, 0, 0)
}

watch(() => props.imageData, draw, { deep: false })
onMounted(draw)

function onMouseMove(e) {
  if (!props.imageData) return
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height
  const x = Math.floor((e.clientX - rect.left) * scaleX)
  const y = Math.floor((e.clientY - rect.top) * scaleY)
  emit('hover', { x, y })
}

function onLeave() {
  emit('hover', null)
}
</script>

<template>
  <div class="canvas-wrap">
    <canvas
      v-if="imageData"
      ref="canvasRef"
      @mousemove="onMouseMove"
      @mouseleave="onLeave"
    />
    <div v-else class="empty">
      <p>Перетащите изображение сюда<br>или нажмите «Открыть»</p>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrap {
  flex: 1;
  min-width: 0;      
  min-height: 0;     
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    repeating-conic-gradient(#2a2a2a 0% 25%, #222 0% 50%) 50% / 20px 20px;
  overflow: auto;
  padding: 20px;
}

canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 0 0 1px #444, 0 8px 24px rgba(0,0,0,0.5);
  image-rendering: pixelated;
  cursor: crosshair;
}

.empty {
  color: #666;
  text-align: center;
  font: 14px system-ui, sans-serif;
}
</style>
