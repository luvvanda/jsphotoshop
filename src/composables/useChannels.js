import { ref, computed, watch } from 'vue'
import { imageChannels, projectChannels } from '../utils/channels.js'

export function useChannels(imageDataRef, imageInfoRef) {
  const channels = ref({ gray: true, r: true, g: true, b: true, a: true })
  const availableChannels = computed(() => imageChannels(imageInfoRef.value))
  function showAll() {
    channels.value = Object.fromEntries(availableChannels.value.map(key => [key, true]))
  }
  watch(imageInfoRef, showAll, { immediate: true, flush: 'sync' })
  const displayData = computed(() => {
    const src = imageDataRef.value
    if (!src) return null
    return new ImageData(projectChannels(src.data, availableChannels.value, channels.value), src.width, src.height)
  })
  function toggle(key) {
    if (availableChannels.value.includes(key)) channels.value[key] = !channels.value[key]
  }
  function setChannel(key, value) {
    if (availableChannels.value.includes(key)) channels.value[key] = Boolean(value)
  }
  function showAlphaOnly() {
    if (!availableChannels.value.includes('a')) return
    channels.value = Object.fromEntries(availableChannels.value.map(key => [key, key === 'a']))
  }
  return { channels, availableChannels, displayData, toggle, setChannel, showAll, showAlphaOnly }
}
