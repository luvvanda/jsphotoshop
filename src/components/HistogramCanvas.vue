<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  histogram: Uint32Array,   
  logScale: Boolean,        
  blackPoint: Number,      
  whitePoint: Number,        
  gamma: Number             
})

const canvasRef = ref(null)

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, W, H)

  if (!props.histogram) return

  let max = 0
  for (let i = 0; i < 256; i++) {
    if (props.histogram[i] > max) max = props.histogram[i]
  }
  if (max === 0) max = 1

  let values = props.histogram
  if (props.logScale) {
    values = new Float64Array(256)
    for (let i = 0; i < 256; i++) {
      values[i] = props.histogram[i] > 0 ? Math.log(props.histogram[i] + 1) : 0
    }
    max = 0
    for (let i = 0; i < 256; i++) if (values[i] > max) max = values[i]
    if (max === 0) max = 1
  }

  const barW = W / 256
  ctx.fillStyle = '#9aa0a6'
  for (let i = 0; i < 256; i++) {
    const h = (values[i] / max) * (H - 4)
    if (h > 0) {
      ctx.fillRect(i * barW, H - h, Math.max(barW, 1), h)
    }
  }

  ctx.strokeStyle = '#333'
  ctx.beginPath()
  ctx.moveTo(0, H - 0.5)
  ctx.lineTo(W, H - 0.5)
  ctx.stroke()
}

watch(() => [props.histogram, props.logScale], draw, { deep: false })
onMounted(draw)
</script>

<template>
  <canvas ref="canvasRef" class="histogram-canvas" width="512" height="120" />
</template>

<style scoped>
.histogram-canvas {
  display: block;
  width: 100%;
  height: 120px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  image-rendering: pixelated;
}
</style>