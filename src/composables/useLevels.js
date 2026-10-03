import { ref, computed } from 'vue'
import { buildLUT, applyLUTToChannel, normalizeLevels } from '../utils/levels.js'

const CHANNELS = ['master', 'r', 'g', 'b', 'a']

function defaultSettings() {
  return { black: 0, white: 255, gamma: 1 }
}

export function useLevels() {
  const settings = ref({
    master: defaultSettings(),
    r: defaultSettings(),
    g: defaultSettings(),
    b: defaultSettings(),
    a: defaultSettings()
  })

  const activeChannel = ref('master')

  const previewEnabled = ref(true)

  const current = computed(() => settings.value[activeChannel.value])

  function setBlack(v) {
    const s = current.value, candidate = Number(v)
    if (Number.isFinite(candidate)) s.black = Math.max(0, Math.min(Math.round(candidate), s.white - 1))
    Object.assign(s, normalizeLevels(s.black, s.white, s.gamma))
    return s.black
  }
  function setWhite(v) {
    const s = current.value, candidate = Number(v)
    if (Number.isFinite(candidate)) s.white = Math.max(s.black + 1, Math.min(Math.round(candidate), 255))
    Object.assign(s, normalizeLevels(s.black, s.white, s.gamma))
    return s.white
  }
  function setGamma(v) {
    const s = current.value
    if (Number.isFinite(Number(v))) s.gamma = Number(v)
    Object.assign(s, normalizeLevels(s.black, s.white, s.gamma))
    return s.gamma
  }

  function resetCurrent() {
    settings.value[activeChannel.value] = defaultSettings()
  }

  function resetAll() {
    settings.value = {
      master: defaultSettings(),
      r: defaultSettings(),
      g: defaultSettings(),
      b: defaultSettings(),
      a: defaultSettings()
    }
  }

  function apply(source) {
    if (!source) return null

    const { width, height, data } = source
    const out = new Uint8ClampedArray(data.length)
    out.set(data)

    const result = new ImageData(out, width, height)

    for (const ch of CHANNELS) {
      const s = settings.value[ch]
      if (s.black === 0 && s.white === 255 && s.gamma === 1) continue

      const lut = buildLUT(s.black, s.white, s.gamma)

      if (ch === 'master') {
        applyLUTToChannel(result, 0, lut)
        applyLUTToChannel(result, 1, lut)
        applyLUTToChannel(result, 2, lut)
      } else {
        const idx = { r: 0, g: 1, b: 2, a: 3 }[ch]
        applyLUTToChannel(result, idx, lut)
      }
    }

    return result
  }

  const hasChanges = computed(() => {
    return CHANNELS.some(ch => {
      const s = settings.value[ch]
      return s.black !== 0 || s.white !== 255 || s.gamma !== 1
    })
  })

  return {
    settings,
    activeChannel,
    previewEnabled,
    current,
    setBlack,
    setWhite,
    setGamma,
    resetCurrent,
    resetAll,
    apply,
    hasChanges
  }
}