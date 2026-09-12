<script setup>
import { computed, watch } from 'vue'
import BaseDialog from './BaseDialog.vue'
import { KERNEL_PRESETS, EDGE_MODES, CUSTOM_PRESET } from '../utils/kernels.js'

const props = defineProps({
  open: Boolean,
  imageData: Object,
  filter: Object
})
const emit = defineEmits(['close', 'apply', 'preview'])

const f = props.filter

watch(() => JSON.stringify({
  k: f.kernel.value,
  d: f.divisor.value,
  c: f.channels.value,
  e: f.edgeMode.value
}), () => {
  if (f.previewEnabled.value) emit('preview')
})

function onPresetChange(e) {
  const id = e.target.value
  if (id === 'custom') return
  f.applyPreset(id)
}

function onCellInput(row, col, e) {
  f.setKernelValue(row, col, e.target.value)
}

function onDivisorInput(e) {
  f.setDivisor(e.target.value)
}

function onEdgeChange(e) {
  f.edgeMode.value = e.target.value
}

function onCancel() {
  f.reset()
  emit('close')
}

function onApply() {
  emit('apply')
  emit('close')
}

function onReset() {
  f.reset()
}
</script>

<template>
  <BaseDialog
    :open="open"
    title="Фильтрация (Kernel)"
    max-width="560px"
    @close="onCancel"
  >
    <div class="field">
      <label>Преднастройка:</label>
      <select :value="f.presetId.value" @change="onPresetChange">
        <option v-for="(p, id) in KERNEL_PRESETS" :key="id" :value="id">
          {{ p.label }}
        </option>
        <option v-if="f.presetId.value === 'custom'" :value="CUSTOM_PRESET.id" disabled>
          {{ CUSTOM_PRESET.label }}
        </option>
      </select>
    </div>

    <div class="field">
      <label>Ядро 3×3:</label>
      <div class="kernel-grid">
        <template v-for="(row, ri) in f.kernel.value" :key="ri">
          <input
            v-for="(cell, ci) in row"
            :key="`${ri}-${ci}`"
            type="number"
            step="any"
            :value="cell"
            @input="onCellInput(ri, ci, $event)"
          />
        </template>
      </div>
    </div>

    <div class="field">
      <label>Делитель (нормализация):</label>
      <input
        type="number"
        step="any"
        :value="f.divisor.value"
        @input="onDivisorInput"
      />
    </div>

    <div class="field">
      <label>Применить к каналам:</label>
      <div class="channels">
        <label class="ch">
          <input type="checkbox" :checked="f.channels.value.r" @change="f.toggleChannel('r')" />
          R
        </label>
        <label class="ch">
          <input type="checkbox" :checked="f.channels.value.g" @change="f.toggleChannel('g')" />
          G
        </label>
        <label class="ch">
          <input type="checkbox" :checked="f.channels.value.b" @change="f.toggleChannel('b')" />
          B
        </label>
        <label class="ch">
          <input type="checkbox" :checked="f.channels.value.a" @change="f.toggleChannel('a')" />
          A
        </label>
        <button class="mini" @click="f.toggleAllChannels()">Все / ничего</button>
      </div>
    </div>

    <div class="field">
      <label>Обработка края (padding):</label>
      <select :value="f.edgeMode.value" @change="onEdgeChange">
        <option v-for="(m, id) in EDGE_MODES" :key="id" :value="id">{{ m.label }}</option>
      </select>
    </div>

    <label class="field checkbox">
      <input type="checkbox" v-model="f.previewEnabled.value" />
      <span>Предпросмотр</span>
    </label>

    <div v-if="f.processing.value" class="processing">
        <span class="spinner" />
         Обработка...
    </div>

    <template #footer>
      <button @click="onReset">Сброс</button>
      <div class="spacer" />
      <button @click="onCancel">Отмена</button>
      <button class="primary" @click="onApply">Применить</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.field {
  margin-bottom: 12px;
}
.field label {
  display: block;
  color: #888;
  margin-bottom: 4px;
  font-size: 12px;
}
.field select,
.field input[type="number"] {
  background: #1a1a1a;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 13px;
  width: 100%;
}
.field select:focus,
.field input[type="number"]:focus {
  outline: none;
  border-color: #4fc3f7;
}
.field.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}
.field.checkbox input {
  width: auto;
}
.field.checkbox span {
  color: #ccc;
  margin: 0;
}

.kernel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.kernel-grid input {
  width: 100%;
  text-align: center;
  font-family: ui-monospace, monospace;
}

.channels {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.channels .ch {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ccc;
  cursor: pointer;
}
.channels .ch input {
  width: auto;
}
.channels .mini {
  background: #2d2d2d;
  color: #ccc;
  border: 1px solid #444;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  margin-left: auto;
}
.channels .mini:hover {
  background: #3a3a3a;
}

.processing {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4fc3f7;
  font-size: 12px;
  margin-top: 8px;
}
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #4fc3f7;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>