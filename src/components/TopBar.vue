<script setup>
import { ref } from 'vue'

defineProps({
  fileName: String,
  fileSize: Number,
  hasImage: Boolean,
  eyedropperActive: Boolean
})
const emit = defineEmits(['file', 'download', 'reset', 'toggle-eyedropper', 'open-levels'])

const fileInput = ref(null)

function onFile(e) {
  const file = e.target.files?.[0]
  if (file) emit('file', file)
  e.target.value = ''
}

function formatSize(bytes) {
  if (!bytes) return ''
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`
}
</script>

<template>
  <header class="topbar">
    <div class="brand">Лабораторная работа 1</div>

    <div class="actions">
      <v-btn size="small" variant="tonal" @click="fileInput.click()">
         Открыть
      </v-btn>
      <v-btn
      size="small"
      :color="eyedropperActive ? 'primary' : undefined"
      :variant="eyedropperActive ? 'flat' : 'tonal'"
      @click="emit('toggle-eyedropper')"
      title="Пипетка"
      >
        Пипетка
  </v-btn>
  <v-btn
        size="small"
        variant="tonal"
        :disabled="!hasImage"
        @click="emit('open-levels')"
        title="Градационная коррекция (Уровни)"
      >
         Уровни
      </v-btn>
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,.gb7"
        hidden
        @change="onFile"
      />
      <v-btn size="small" variant="tonal" :disabled="!hasImage" @click="emit('reset')">
        ↺ Сброс
      </v-btn>
      <v-btn size="small" color="primary" :disabled="!hasImage" @click="emit('download', 'result.png')">
         PNG
      </v-btn>
      <v-btn size="small" color="primary" :disabled="!hasImage" @click="emit('download', 'result.jpg')">
         JPG
      </v-btn>
      <v-btn size="small" color="primary" :disabled="!hasImage" @click="emit('download', 'result.gb7')">
         GB7
      </v-btn>
    </div>

    <div class="info" v-if="fileName">
      <span class="name">{{ fileName }}</span>
      <span class="size">{{ formatSize(fileSize) }}</span>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 10px 20px;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
  color: #ddd;
  font: 13px system-ui, sans-serif;
}
.brand { font-weight: 600; color: #4fc3f7; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.info { margin-left: auto; display: flex; gap: 12px; color: #888; }
.name { color: #ccc; }
</style>