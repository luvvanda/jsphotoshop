<script setup>
import { ref } from 'vue'
import TopBar from './components/TopBar.vue'
import SidePanel from './components/SidePanel.vue'
import CanvasView from './components/CanvasView.vue'
import PixelInfo from './components/PixelInfo.vue'
import StatusBar from './components/StatusBar.vue'
import { useImage } from './composables/useImage.js'

const {
  imageData, imageInfo, fileName, fileSize,
  loadFile, reset, download, getPixel
} = useImage()

const hoveredPixel = ref(null)
const error = ref('')

async function onFile(file) {
  try {
    error.value = ''
    hoveredPixel.value = null
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
</script>

<template>
  <v-app>
    <div class="app" @drop="onDrop" @dragover="onDragOver">
      <TopBar
        :file-name="fileName"
        :file-size="fileSize"
        :has-image="!!imageData"
        @file="onFile"
        @reset="reset"
        @download="onDownload"
      />

      <div v-if="error" class="error">{{ error }}</div>

      <main class="workspace">
        <SidePanel :info="imageInfo" />
        <CanvasView :image-data="imageData" @hover="hoveredPixel = $event" />
        <aside class="right">
          <PixelInfo :pixel="hoveredPixel" :data="imageData" :get-pixel="getPixel" />
        </aside>
      </main>

      <StatusBar :info="imageInfo" :file-name="fileName" />
    </div>
  </v-app>
</template>

<style>
* { box-sizing: border-box; }
html, body, #app {
  margin: 0;
  height: 100%;
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
}
.workspace {
  flex: 1;
  display: flex;
  min-height: 0;
}
.right {
  width: 220px;
  background: #252525;
  border-left: 1px solid #333;
  overflow-y: auto;
}
.error {
  background: #4a1a1a;
  color: #ff9999;
  padding: 8px 16px;
  font-size: 13px;
}
</style>