import { ref, computed } from 'vue'
import { KERNEL_PRESETS, EDGE_MODES, getDefaultKernel } from '../utils/kernels.js'

export function useFilter() {
  const kernel = ref(getDefaultKernel())
  const presetId = ref('identity')
  const divisor = ref(1)

  const channels = ref({ r: true, g: true, b: true, a: false })
  const edgeMode = ref('copy')
  const previewEnabled = ref(true)
  const filterOpen = ref(false)

  const processing = ref(false)

  function applyPreset(id) {
    const preset = KERNEL_PRESETS[id]
    if (!preset) return
    presetId.value = id
    kernel.value = preset.kernel.map(row => [...row])
    divisor.value = preset.divisor || 1
  }

  function setKernelValue(row, col, value) {
    const v = Number(value)
    if (Number.isFinite(v)) {
      kernel.value[row][col] = v
      presetId.value = 'custom'
    }
  }

  function setDivisor(value) {
    const v = Number(value)
    if (Number.isFinite(v) && v !== 0) {
      divisor.value = v
      if (presetId.value !== 'custom') presetId.value = 'custom'
    }
  }

  function reset() {
    applyPreset('identity')
    channels.value = { r: true, g: true, b: true, a: false }
    edgeMode.value = 'copy'
    previewEnabled.value = true
    processing.value = false
  }

  function toggleChannel(ch) {
    channels.value[ch] = !channels.value[ch]
  }

  function toggleAllChannels() {
    const all = channels.value.r && channels.value.g && channels.value.b && channels.value.a
    channels.value = { r: !all, g: !all, b: !all, a: !all }
  }

  const anyChannel = computed(() =>
    channels.value.r || channels.value.g || channels.value.b || channels.value.a
  )

  return {
    kernel,
    presetId,
    divisor,
    channels,
    edgeMode,
    previewEnabled,
    filterOpen,
    processing,
    anyChannel,
    applyPreset,
    setKernelValue,
    setDivisor,
    reset,
    toggleChannel,
    toggleAllChannels,
    KERNEL_PRESETS,
    EDGE_MODES
  }
}