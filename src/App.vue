<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import TopBar from './components/TopBar.vue'
import SidePanel from './components/SidePanel.vue'
import CanvasView from './components/CanvasView.vue'
import ChannelPanel from './components/ChannelPanel.vue'
import EyedropperPanel from './components/EyedropperPanel.vue'
import StatusBar from './components/StatusBar.vue'
import LevelsDialog from './components/LevelsDialog.vue'
import ZoomPanel from './components/ZoomPanel.vue'
import ResizeDialog from './components/ResizeDialog.vue'
import FilterDialog from './components/FilterDialog.vue'
import { useImage } from './composables/useImage.js'
import { useChannels } from './composables/useChannels.js'
import { useLevels } from './composables/useLevels.js'
import { useZoom } from './composables/useZoom.js'
import { useFilter } from './composables/useFilter.js'
import { fitZoom } from './utils/scale.js'
import { resizeImageData } from './utils/interpolation.js'

const {
  imageData, imageInfo, fileName, fileSize,
  loadFile, reset, download
} = useImage()

const {
  channels, displayData,
  toggle, showAll, showAlphaOnly
} = useChannels(imageData)

const levels = useLevels()
const { zoom, setZoom } = useZoom()
const filter = useFilter()

const hoveredPixel = ref(null)
const pickedPixel = ref(null)
const eyedropperActive = ref(false)
const error = ref('')

const levelsOpen = ref(false)
const levelsPreviewData = ref(null)

const resizeOpen = ref(false)

const filterPreviewData = ref(null)

let previewRafId = null
let filterRafId = null

let workerBusy = false
let workerQueued = null

const filterWorker = new Worker(
  new URL('./workers/filter.worker.js', import.meta.url),
  { type: 'module' }
)

filterWorker.onmessage = (e) => {
  console.log('Worker ответил. mode =', e.data.mode, 'size =', e.data.width, 'x', e.data.height)
  const { data, width, height, mode } = e.data
  const result = new ImageData(new Uint8ClampedArray(data), width, height)

  const effectiveMode = mode || 'preview'

  if (effectiveMode === 'apply') {
    imageData.value = result
    filterPreviewData.value = null
  } else {
    filterPreviewData.value = result
  }

  workerBusy = false

  if (workerQueued) {
    const next = workerQueued
    workerQueued = null
    dispatchFilterJob(next)
  } else {
    filter.processing.value = false
  }
}

filterWorker.onerror = (e) => {
  console.error('Worker error:', e.message || e)
  workerBusy = false
  workerQueued = null
  filter.processing.value = false
}

onBeforeUnmount(() => {
  filterWorker.terminate()
})

function dispatchFilterJob(job) {
  console.log('Отправка в воркер:', job.mode, job.width, 'x', job.height)
  const { width, height, data, mode } = job
  const copy = new Uint8ClampedArray(data)

  const kernelPlain = filter.kernel.value.map(row => [...row])
  const channelsPlain = {
    r: !!filter.channels.value.r,
    g: !!filter.channels.value.g,
    b: !!filter.channels.value.b,
    a: !!filter.channels.value.a
  }

  workerBusy = true
  filter.processing.value = true
  filterWorker.postMessage({
    imageData: copy.buffer,
    width,
    height,
    kernel: kernelPlain,
    divisor: Number(filter.divisor.value),
    channels: channelsPlain,
    edgeMode: String(filter.edgeMode.value),
    mode
  }, [copy.buffer])
}

function sendFilterJob(mode) {
  if (!imageData.value) return
  const src = imageData.value
  const job = {
    width: src.width,
    height: src.height,
    data: src.data,
    mode
  }

  if (workerBusy) {
    workerQueued = job
  } else {
    dispatchFilterJob(job)
  }
}

async function onFile(file) {
  try {
    if (previewRafId !== null) {
      cancelAnimationFrame(previewRafId)
      previewRafId = null
    }
    if (filterRafId !== null) {
      cancelAnimationFrame(filterRafId)
      filterRafId = null
    }
    workerQueued = null
    error.value = ''
    hoveredPixel.value = null
    pickedPixel.value = null
    levels.resetAll()
    levelsPreviewData.value = null
    filterPreviewData.value = null
    filter.reset()
    await loadFile(file)

    await nextTick()
    const canvasWrap = document.querySelector('.canvas-wrap')
    if (canvasWrap && imageData.value) {
      const rect = canvasWrap.getBoundingClientRect()
      const z = fitZoom(
        imageData.value.width,
        imageData.value.height,
        rect.width,
        rect.height
      )
      setZoom(z)
    } else {
      setZoom(100)
    }
  } catch (e) {
    error.value = e.message
  }
}

function onDownload(name) {
  download(name)
}

function onDrop(e) {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (file) onFile(file)
}
function onDragOver(e) { e.preventDefault() }

function onPick(coords) {
  if (!imageData.value) return
  const { width, height, data } = imageData.value
  if (coords.x < 0 || coords.y < 0 || coords.x >= width || coords.y >= height) return
  const i = (coords.y * width + coords.x) * 4
  pickedPixel.value = {
    x: coords.x,
    y: coords.y,
    r: data[i],
    g: data[i + 1],
    b: data[i + 2],
    a: data[i + 3]
  }
}

function onOpenLevels() {
  levelsOpen.value = true
}

function onLevelsPreview() {
  if (!imageData.value) return

  if (!levels.previewEnabled.value) {
    if (previewRafId !== null) {
      cancelAnimationFrame(previewRafId)
      previewRafId = null
    }
    levelsPreviewData.value = null
    return
  }

  if (previewRafId !== null) {
    cancelAnimationFrame(previewRafId)
  }

  previewRafId = requestAnimationFrame(() => {
    levelsPreviewData.value = levels.apply(imageData.value)
    previewRafId = null
  })
}

function onLevelsClose() {
  if (previewRafId !== null) {
    cancelAnimationFrame(previewRafId)
    previewRafId = null
  }
  levelsOpen.value = false
  levelsPreviewData.value = null
  levels.resetAll()
}

function onLevelsApply() {
  if (previewRafId !== null) {
    cancelAnimationFrame(previewRafId)
    previewRafId = null
  }
  if (!imageData.value) return
  const result = levels.apply(imageData.value)
  if (result) {
    imageData.value = result
  }
  levelsOpen.value = false
  levelsPreviewData.value = null
  levels.resetAll()
}

function onOpenResize() {
  resizeOpen.value = true
}

function onResizeClose() {
  resizeOpen.value = false
}

async function onResizeApply({ width, height, method }) {
  if (!imageData.value) return
  const resized = resizeImageData(imageData.value, width, height, method)
  imageData.value = resized
  resizeOpen.value = false

  await nextTick()
  const canvasWrap = document.querySelector('.canvas-wrap')
  if (canvasWrap && imageData.value) {
    const rect = canvasWrap.getBoundingClientRect()
    const z = fitZoom(
      imageData.value.width,
      imageData.value.height,
      rect.width,
      rect.height
    )
    setZoom(z)
  }
}

function onOpenFilter() {
  filter.filterOpen.value = true
}

function onFilterPreview() {
  if (!imageData.value) return

  if (!filter.previewEnabled.value) {
    if (filterRafId !== null) {
      cancelAnimationFrame(filterRafId)
      filterRafId = null
    }
    filterPreviewData.value = null
    return
  }

  if (filterRafId !== null) {
    cancelAnimationFrame(filterRafId)
  }

  filterRafId = requestAnimationFrame(() => {
    sendFilterJob('preview')
    filterRafId = null
  })
}

function onFilterApply() {
  if (!imageData.value) return
  if (filterRafId !== null) {
    cancelAnimationFrame(filterRafId)
    filterRafId = null
  }
  sendFilterJob('apply')
}

function onFilterClose() {
  if (filterRafId !== null) {
    cancelAnimationFrame(filterRafId)
    filterRafId = null
  }
  filter.filterOpen.value = false
  filterPreviewData.value = null
  filter.processing.value = false
  workerQueued = null
  filter.reset()
}

const canvasData = computed(() => {
  if (filter.filterOpen.value && filterPreviewData.value) {
    return filterPreviewData.value
  }
  if (levelsOpen.value && levelsPreviewData.value) {
    return levelsPreviewData.value
  }
  return displayData.value
})
</script>

<template>
  <div class="app" @drop="onDrop" @dragover="onDragOver">
    <TopBar
      :file-name="fileName"
      :file-size="fileSize"
      :has-image="!!imageData"
      :eyedropper-active="eyedropperActive"
      @file="onFile"
      @reset="reset"
      @download="onDownload"
      @toggle-eyedropper="eyedropperActive = !eyedropperActive"
      @open-levels="onOpenLevels"
      @open-resize="onOpenResize"
      @open-filter="onOpenFilter"
    />

    <div v-if="error" class="error">{{ error }}</div>

    <main class="workspace">
      <aside class="left">
        <SidePanel :info="imageInfo" />
        <ZoomPanel :zoom="zoom" @update:zoom="setZoom" />
        <ChannelPanel
          :image-data="imageData"
          :channels="channels"
          @toggle="toggle"
          @show-all="showAll"
          @alpha-only="showAlphaOnly"
        />
      </aside>

      <CanvasView
        :image-data="canvasData"
        :eyedropper-active="eyedropperActive"
        :zoom="zoom"
        @hover="hoveredPixel = $event"
        @pick="onPick"
      />

      <aside class="right">
        <EyedropperPanel
          :pixel="pickedPixel || hoveredPixel"
          :image-data="imageData"
          :eyedropper-active="eyedropperActive"
        />
      </aside>
    </main>

    <StatusBar :info="imageInfo" :file-name="fileName" />

    <LevelsDialog
      :open="levelsOpen"
      :image-data="imageData"
      :levels="levels"
      @close="onLevelsClose"
      @apply="onLevelsApply"
      @preview="onLevelsPreview"
    />

    <ResizeDialog
      :open="resizeOpen"
      :image-data="imageData"
      @close="onResizeClose"
      @apply="onResizeApply"
    />

    <FilterDialog
      :open="filter.filterOpen.value"
      :image-data="imageData"
      :filter="filter"
      @close="onFilterClose"
      @apply="onFilterApply"
      @preview="onFilterPreview"
    />
  </div>
</template>

<style>
* { box-sizing: border-box; }
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #1a1a1a;
  color: #ddd;
}
body { font-family: system-ui, sans-serif; }
</style>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.workspace {
  flex: 1 1 0;
  display: flex;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.left {
  width: 240px;
  min-width: 240px;
  max-width: 240px;
  flex-shrink: 0;
  background: #252525;
  border-right: 1px solid #333;
  overflow-y: auto;
  overflow-x: hidden;
}

.right {
  width: 240px;
  min-width: 240px;
  max-width: 240px;
  flex-shrink: 0;
  background: #252525;
  border-left: 1px solid #333;
  overflow-y: auto;
  overflow-x: hidden;
}

.error {
  background: #4a1a1a;
  color: #ff9999;
  padding: 8px 16px;
  font-size: 13px;
}
</style>