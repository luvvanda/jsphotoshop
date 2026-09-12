<script setup>
import { computed } from 'vue'

const props = defineProps({
  zoom: Number,
  min: { type: Number, default: 12 },
  max: { type: Number, default: 300 }
})
const emit = defineEmits(['update:zoom'])

const zoomModel = computed({
  get: () => props.zoom,
  set: (v) => emit('update:zoom', Number(v))
})

function onRange(e) {
  emit('update:zoom', Number(e.target.value))
}
function onSelect(e) {
  emit('update:zoom', Number(e.target.value))
}

const presets = [12, 25, 50, 75, 100, 150, 200, 250, 300]
</script>

<template>
  <div class="zoom-panel">
    <h3>Масштаб</h3>

    <div class="row">
      <input
        type="range"
        :min="min" :max="max"
        :value="zoom"
        @input="onRange"
      />
      <span class="value">{{ zoom }}%</span>
    </div>

    <select :value="zoom" @change="onSelect">
      <option v-for="p in presets" :key="p" :value="p">{{ p }}%</option>
    </select>

    <div class="hint">от {{ min }}% до {{ max }}%</div>
  </div>
</template>

<style scoped>
.zoom-panel {
  padding: 12px 16px;
  font: 12px/1.6 ui-monospace, monospace;
  color: #ccc;
  border-top: 1px solid #333;
}
h3 {
  font: 600 11px system-ui, sans-serif;
  text-transform: uppercase;
  color: #888;
  letter-spacing: 0.5px;
  margin: 0 0 8px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.row input[type="range"] {
  flex: 1;
}
.value {
  width: 48px;
  text-align: right;
  color: #aaa;
}
select {
  width: 100%;
  margin-top: 8px;
  background: #1a1a1a;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 8px;
}
.hint {
  margin-top: 4px;
  color: #666;
  font-size: 11px;
}
</style>