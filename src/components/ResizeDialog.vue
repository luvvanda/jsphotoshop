<script setup>
import { computed, ref, watch } from 'vue'
import BaseDialog from './BaseDialog.vue'
import {
  ZOOM_MIN, ZOOM_MAX, validateResize, toPixels, toMegapixels
} from '../utils/scale.js'
import { INTERPOLATIONS } from '../utils/interpolation.js'

const props = defineProps({
  open: Boolean,
  imageData: Object
})
const emit = defineEmits(['close', 'apply'])

const mode = ref('percent')
const width = ref(100)
const height = ref(100)
const linked = ref(true)
const method = ref('bilinear')

const errors = computed(() => {
  if (!props.imageData) return {}
  return validateResize(width.value, height.value, mode.value, props.imageData.width, props.imageData.height)
})

const hasErrors = computed(() => Object.keys(errors.value).length > 0)

const srcW = computed(() => props.imageData?.width ?? 0)
const srcH = computed(() => props.imageData?.height ?? 0)

const dstPixels = computed(() => {
  if (!props.imageData) return { w: 0, h: 0 }
  return toPixels(width.value, height.value, mode.value, srcW.value, srcH.value)
})

const srcMP = computed(() => toMegapixels(srcW.value, srcH.value))
const dstMP = computed(() => toMegapixels(dstPixels.value.w, dstPixels.value.h))

watch(() => props.open, (val) => {
  if (val) {
    mode.value = 'percent'
    width.value = 100
    height.value = 100
    linked.value = true
    method.value = 'bilinear'
  }
})

watch(mode, () => {
  if (mode.value === 'percent') {
    width.value = 100
    height.value = 100
  } else {
    width.value = srcW.value
    height.value = srcH.value
  }
})

function onWidthInput(e) {
  const v = Number(e.target.value)
  width.value = v
  if (linked.value) {
    const ratio = srcH.value / srcW.value
    if (mode.value === 'percent') {
      height.value = Math.round(v)
    } else {
      height.value = Math.round(v * ratio)
    }
  }
}

function onHeightInput(e) {
  const v = Number(e.target.value)
  height.value = v
  if (linked.value) {
    const ratio = srcW.value / srcH.value
    if (mode.value === 'percent') {
      width.value = Math.round(v)
    } else {
      width.value = Math.round(v * ratio)
    }
  }
}

const currentMethod = computed(() => INTERPOLATIONS[method.value])

function onCancel() {
  emit('close')
}

function onApply() {
  if (hasErrors.value) return
  const { w, h } = dstPixels.value
  emit('apply', { width: w, height: h, method: method.value })
}
</script>

<template>
  <BaseDialog
    :open="open"
    title="Изменить размер"
    max-width="480px"
    @close="onCancel"
  >
    <div class="mp-row">
      <div class="mp">
        <span class="label">До:</span>
        <span class="value">{{ srcMP }} Мп</span>
        <span class="dims">{{ srcW }} × {{ srcH }}</span>
      </div>
      <div class="mp-arrow">→</div>
      <div class="mp">
        <span class="label">После:</span>
        <span class="value">{{ dstMP }} Мп</span>
        <span class="dims">{{ dstPixels.w }} × {{ dstPixels.h }}</span>
      </div>
    </div>

    <div class="field">
      <label>Единицы:</label>
      <select v-model="mode">
        <option value="percent">Проценты</option>
        <option value="pixels">Пиксели</option>
      </select>
    </div>

    <div class="size-row">
      <div class="field">
        <label>Ширина:</label>
        <input
          type="number"
          :value="width"
          :min="mode === 'percent' ? ZOOM_MIN : 1"
          :max="mode === 'percent' ? ZOOM_MAX : 100000"
          @input="onWidthInput"
        />
        <span v-if="errors.width" class="err">{{ errors.width }}</span>
      </div>

      <div class="field">
        <label>Высота:</label>
        <input
          type="number"
          :value="height"
          :min="mode === 'percent' ? ZOOM_MIN : 1"
          :max="mode === 'percent' ? ZOOM_MAX : 100000"
          @input="onHeightInput"
        />
        <span v-if="errors.height" class="err">{{ errors.height }}</span>
      </div>
    </div>

    <div class="field checkbox">
      <input type="checkbox" v-model="linked" id="link-props" />
      <label for="link-props">Сохранять пропорции</label>
    </div>

    <div class="field">
      <label>Алгоритм интерполяции:</label>
      <select v-model="method">
        <option v-for="(m, id) in INTERPOLATIONS" :key="id" :value="id">
          {{ m.label }}
        </option>
      </select>
      <div class="method-info">
        <strong>{{ currentMethod.label }}</strong>
        <p>{{ currentMethod.description }}</p>
      </div>
    </div>

    <template #footer>
      <div class="spacer" />
      <button @click="onCancel">Отмена</button>
      <button class="primary" :disabled="hasErrors" @click="onApply">Применить</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.mp-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #1e1e1e;
  border-radius: 6px;
  margin-bottom: 14px;
  font-size: 12px;
}
.mp {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mp .label { color: #666; }
.mp .value { color: #4fc3f7; font-weight: 600; }
.mp .dims { color: #888; font-family: ui-monospace, monospace; }
.mp-arrow { color: #666; }

.field {
  margin-bottom: 10px;
  position: relative;
}
.field label {
  display: block;
  color: #888;
  margin-bottom: 4px;
  font-size: 12px;
}
.field input[type="number"],
.field select {
  width: 100%;
  background: #1a1a1a;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 13px;
}
.field input[type="number"]:focus,
.field select:focus {
  outline: none;
  border-color: #4fc3f7;
}
.field.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}
.field.checkbox label {
  margin: 0;
  color: #ccc;
}
.field.checkbox input[type="checkbox"] {
  width: auto;
}

.size-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.err {
  display: block;
  color: #ff9999;
  font-size: 11px;
  margin-top: 2px;
}

.method-info {
  margin-top: 6px;
  padding: 8px 10px;
  background: #1e1e1e;
  border-left: 3px solid #4fc3f7;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
}
.method-info strong {
  display: block;
  color: #4fc3f7;
  margin-bottom: 2px;
}
.method-info p {
  margin: 0;
  color: #999;
}
</style>