<script setup>
import { computed, ref, watch } from 'vue'
import BaseDialog from './BaseDialog.vue'
import HistogramCanvas from './HistogramCanvas.vue'
import { computeHistogram, gammaMarker, markerGamma } from '../utils/levels.js'

const props = defineProps({
  open: Boolean,
  imageData: Object,
  imageInfo: Object,
  levels: Object
})
const emit = defineEmits(['close', 'apply', 'preview'])

const {
  settings, activeChannel, previewEnabled,
  current, setBlack, setWhite, setGamma,
  resetCurrent, resetAll
} = props.levels

const histogram = computed(() => {
  if (!props.imageData) return null
  return computeHistogram(props.imageData, activeChannel.value)
})

const channelList = computed(() => {
  const list = [{ value: 'master', label: props.imageInfo?.isGrayscale ? 'Яркость (Gray)' : 'RGB (Master)' }]
  if (!props.imageInfo?.isGrayscale) list.push(
    { value: 'r', label: 'Красный (R)' }, { value: 'g', label: 'Зелёный (G)' }, { value: 'b', label: 'Синий (B)' })
  if (props.imageInfo?.hasAlpha) list.push({ value: 'a', label: 'Альфа (A)' })
  return list
})
const middle = computed(() => gammaMarker(current.value.black, current.value.white, current.value.gamma))
watch(channelList, list => {
  if (!list.some(item => item.value === activeChannel.value)) activeChannel.value = 'master'
}, { immediate: true })
watch(previewEnabled, () => emit('preview'))

const logScaleUI = ref(false)

watch(() => JSON.stringify(settings.value), () => {
  if (previewEnabled.value) emit('preview')
})

function onReset() {
  resetCurrent()
}

function onResetAll() {
  resetAll()
}

function onCancel() {
  resetAll()
  emit('close')
}

function onApply() {
  emit('apply')
  emit('close')
}

function onBlackInput(e) {
  e.target.value = String(setBlack(e.target.value === '' ? current.value.black : Number(e.target.value)))
}
function onWhiteInput(e) {
  e.target.value = String(setWhite(e.target.value === '' ? current.value.white : Number(e.target.value)))
}
function onGammaInput(e) {
  e.target.value = String(setGamma(e.target.value === '' ? current.value.gamma : Number(e.target.value)))
}
function onMiddleInput(e) {
  setGamma(markerGamma(current.value.black, current.value.white, Number(e.target.value)))
  e.target.value = String(middle.value)
}
</script>

<template>
  <BaseDialog
    :open="open"
    title="Уровни (Levels)"
    max-width="560px"
    @close="onCancel"
  >
    <div class="controls-row">
      <label class="field">
        <span>Канал:</span>
        <select v-model="activeChannel">
          <option v-for="c in channelList" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </label>

      <label class="field checkbox">
        <input type="checkbox" v-model="previewEnabled" />
        <span>Предпросмотр</span>
      </label>

      <label class="field checkbox">
        <input type="checkbox" v-model="logScaleUI" />
        <span>Логарифм. шкала</span>
      </label>
    </div>

    <HistogramCanvas
      :histogram="histogram"
      :log-scale="logScaleUI"
      :black-point="current.black"
      :white-point="current.white"
      :gamma="current.gamma"
    />

    <div class="sliders">
      <div class="slider-row">
        <span class="mark black">■</span>
        <input
          type="range"
          :min="0"
          max="255"
          :value="current.black"
          @input="onBlackInput"
        />
        <span class="value">{{ current.black }}</span>
      </div>

      <div class="slider-row">
        <span class="mark gamma">▲</span>
        <input
          type="range"
          min="0"
          max="255"
          step="0.001"
          :value="middle"
          @input="onMiddleInput"
        />
        <span class="value">{{ current.gamma.toFixed(1) }}</span>
      </div>

      <div class="slider-row">
        <span class="mark white">□</span>
        <input
          type="range"
          min="0"
          max="255"
          :value="current.white"
          @input="onWhiteInput"
        />
        <span class="value">{{ current.white }}</span>
      </div>
    </div>

    <div class="numerics">
      <label>
        <span>Чёрная:</span>
        <input
          type="number"
          :min="0"
          :max="current.white - 1"
          :value="current.black"
          @input="onBlackInput"
        />
      </label>
      <label>
        <span>Гамма:</span>
        <input
          type="number"
          min="0.1"
          max="9.9"
          step="0.1"
          :value="current.gamma"
          @input="onGammaInput"
        />
      </label>
      <label>
        <span>Белая:</span>
        <input
          type="number"
          :min="current.black + 1"
          :max="255"
          :value="current.white"
          @input="onWhiteInput"
        />
      </label>
    </div>

    <template #footer>
      <button @click="onReset">Сброс</button>
      <button @click="onResetAll">Сбросить всё</button>
      <div class="spacer" />
      <button @click="onCancel">Отмена</button>
      <button class="primary" @click="onApply">Применить</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.controls-row {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.field {
  display: flex;
  align-items: center;
  gap: 6px;
}
.field select {
  background: #1a1a1a;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 8px;
}
.field.checkbox {
  cursor: pointer;
  user-select: none;
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.slider-row input[type="range"] {
  flex: 1;
}
.slider-row .value {
  width: 48px;
  text-align: right;
  font-family: ui-monospace, monospace;
  color: #aaa;
}
.slider-row .mark {
  width: 20px;
  text-align: center;
  font-size: 14px;
}
.mark.black { color: #000; }
.mark.gamma { color: #888; }
.mark.white { color: #fff; }

.numerics {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.numerics label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.numerics input {
  width: 60px;
  background: #1a1a1a;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 6px;
}
</style>