<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import HistogramCanvas from './HistogramCanvas.vue'
import { computeHistogram } from '../utils/levels.js'

const props = defineProps({
  open: Boolean,
  imageData: Object,           
  levels: Object                  
})
const emit = defineEmits(['close', 'apply', 'preview'])

const dialogRef = ref(null)

const {
  settings, activeChannel, previewEnabled,
  current, setBlack, setWhite, setGamma,
  resetCurrent, resetAll
} = props.levels

const histogram = computed(() => {
  if (!props.imageData) return null
  return computeHistogram(props.imageData, activeChannel.value)
})

const channelList = [
  { value: 'master', label: 'RGB (Master)' },
  { value: 'r', label: 'Красный (R)' },
  { value: 'g', label: 'Зелёный (G)' },
  { value: 'b', label: 'Синий (B)' },
  { value: 'a', label: 'Альфа (A)' }
]

watch(() => props.open, async (val) => {
  await nextTick()
  const dlg = dialogRef.value
  if (!dlg) return
  if (val && !dlg.open) dlg.showModal()
  else if (!val && dlg.open) dlg.close()
})

watch(() => JSON.stringify(settings.value), () => {
  if (previewEnabled.value) emit('preview')
})

function onClose() {
  emit('close')
}

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
  setBlack(Number(e.target.value))
}
function onWhiteInput(e) {
  setWhite(Number(e.target.value))
}
function onGammaInput(e) {
  setGamma(Number(e.target.value))
}
</script>

<template>
  <dialog ref="dialogRef" class="levels-dialog" @close="onClose" @cancel.prevent="onCancel">
    <div class="dialog-content">
      <header>
        <h2>Уровни (Levels)</h2>
        <button class="close-btn" @click="onCancel">×</button>
      </header>

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
            type="range" min="0" max="254"
            :value="current.black"
            @input="onBlackInput"
          />
          <span class="value">{{ current.black }}</span>
        </div>

        <div class="slider-row">
          <span class="mark gamma">▲</span>
          <input
            type="range" min="1" max="9.9" step="0.1"
            :value="current.gamma"
            @input="onGammaInput"
          />
          <span class="value">{{ current.gamma.toFixed(1) }}</span>
        </div>

        <div class="slider-row">
          <span class="mark white">□</span>
          <input
            type="range" min="1" max="255"
            :value="current.white"
            @input="onWhiteInput"
          />
          <span class="value">{{ current.white }}</span>
        </div>
      </div>

      <div class="numerics">
        <label>
          <span>Чёрная:</span>
          <input type="number" min="0" max="254"
                 :value="current.black"
                 @input="onBlackInput" />
        </label>
        <label>
          <span>Гамма:</span>
          <input type="number" min="0.1" max="9.9" step="0.1"
                 :value="current.gamma"
                 @input="onGammaInput" />
        </label>
        <label>
          <span>Белая:</span>
          <input type="number" min="1" max="255"
                 :value="current.white"
                 @input="onWhiteInput" />
        </label>
      </div>

      <footer>
        <button @click="onReset">Сброс</button>
        <button @click="onResetAll">Сбросить всё</button>
        <div class="spacer" />
        <button @click="onCancel">Отмена</button>
        <button class="primary" @click="onApply">Применить</button>
      </footer>
    </div>
  </dialog>
</template>

<script>
export default {
  data() {
    return { logScaleUI: false }
  }
}
</script>

<style scoped>
.levels-dialog {
  border: none;
  border-radius: 8px;
  background: #252525;
  color: #ddd;
  padding: 0;
  max-width: 560px;
  width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
.levels-dialog::backdrop {
  background: rgba(0,0,0,0.6);
}

.dialog-content {
  padding: 16px 20px 20px;
  font: 13px system-ui, sans-serif;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}
.close-btn:hover { color: #fff; }

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

footer {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #333;
}
footer button {
  background: #2d2d2d;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 13px;
}
footer button:hover { background: #3a3a3a; }
footer button.primary {
  background: #4fc3f7;
  color: #000;
  border-color: #4fc3f7;
}
footer button.primary:hover { background: #63cdfa; }
.spacer { flex: 1; }
</style>