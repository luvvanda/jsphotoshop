<script setup>
import { ref } from 'vue'
import TopBar from './components/TopBar.vue'
import SidePanel from './components/SidePanel.vue'
import CanvasView from './components/CanvasView.vue'
import ChannelPanel from './components/ChannelPanel.vue'
import EyedropperPanel from './components/EyedropperPanel.vue'
import StatusBar from './components/StatusBar.vue'
import { useImage } from './composables/useImage.js'
import { useChannels } from './composables/useChannels.js'

const {
  imageData, imageInfo, fileName, fileSize,
  loadFile, reset, download
} = useImage()

const {
  channels, displayData,
  toggle, showAll, showAlphaOnly
} = useChannels(imageData)

const hoveredPixel = ref(null)
const pickedPixel = ref(null)
const eyedropperActive = ref(false)
const error = ref('')

async function onFile(file) {
  try {
    error.value = ''
    hoveredPixel.value = null
    pickedPixel.value = null
    await loadFile(file)
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

// Пипетка читает из ОРИГИНАЛА, не из displayData
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
    />

    <div v-if="error" class="error">{{ error }}</div>

    <main class="workspace">
      <aside class="left">
        <SidePanel :info="imageInfo" />
        <ChannelPanel
          :image-data="imageData"
          :channels="channels"
          @toggle="toggle"
          @show-all="showAll"
          @alpha-only="showAlphaOnly"
        />
      </aside>

      <CanvasView
        :image-data="displayData"
        :eyedropper-active="eyedropperActive"
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