import { ref, computed } from 'vue'

export function useChannels(imageDataRef) {
  const channels = ref({ r: true, g: true, b: true, a: true })

  const sourceChannels = computed(() => {
    const data = imageDataRef.value?.data
    if (!data) return { hasAlpha: false, isGrayscale: false }
    let hasAlpha = false
    let isGrayscale = true
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] !== 255) hasAlpha = true
      if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) isGrayscale = false
      if (hasAlpha && !isGrayscale) break
    }
    return { hasAlpha, isGrayscale }
  })

const displayData = computed(() => {
  const src = imageDataRef.value
  if (!src) return null

  const { width, height, data } = src
  const out = new Uint8ClampedArray(width * height * 4)

  const rOn = channels.value.r
  const gOn = channels.value.g
  const bOn = channels.value.b
  const aOn = channels.value.a

  const alphaOnly = aOn && !rOn && !gOn && !bOn

  for (let i = 0; i < data.length; i += 4) {
    if (alphaOnly) {
      const a = data[i + 3]
      out[i]     = a
      out[i + 1] = a
      out[i + 2] = a
      out[i + 3] = 255
    } else {
      out[i]     = rOn ? data[i]     : 0
      out[i + 1] = gOn ? data[i + 1] : 0
      out[i + 2] = bOn ? data[i + 2] : 0
      out[i + 3] = aOn ? data[i + 3] : 255
    }
  }

  return new ImageData(out, width, height)
})
  function toggle(channel) {
    channels.value[channel] = !channels.value[channel]
  }

  function setChannel(channel, value) {
    channels.value[channel] = value
  }

  function showAll() {
    channels.value = { r: true, g: true, b: true, a: true }
  }

  function showAlphaOnly() {
    channels.value = { r: false, g: false, b: false, a: true }
  }

  return {
    channels,
    displayData,
    sourceChannels,
    toggle,
    setChannel,
    showAll,
    showAlphaOnly
  }
}