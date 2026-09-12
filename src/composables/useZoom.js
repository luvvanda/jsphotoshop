import { ref } from 'vue'

export function useZoom() {
  const zoom = ref(100)

  function setZoom(v) {
    const n = Number(v)
    if (Number.isFinite(n)) zoom.value = n
  }

  return { zoom, setZoom }
}