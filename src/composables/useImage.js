import { ref, computed } from 'vue'
import { decodeGB7, encodeGB7 } from '../formats/gb7'

export function useImage() {
  const imageBitmap = ref(null)
  const imageData = ref(null)
  const imageInfo = ref(null)
  const fileName = ref('')
  const fileSize = ref(0)

  const width = computed(() => imageInfo.value?.width ?? 0)
  const height = computed(() => imageInfo.value?.height ?? 0)

  function isGB7(file) {
    return /\.gb7$/i.test(file.name)
  }

  async function loadFile(file) {
    if (!file) throw new Error('Файл не выбран')
    fileName.value = file.name
    fileSize.value = file.size

    if (isGB7(file)) {
      const buf = await file.arrayBuffer()
      const decoded = decodeGB7(buf)
      imageBitmap.value = null
      imageData.value = decoded.data
      imageInfo.value = {
        width: decoded.width,
        height: decoded.height,
        colorDepth: decoded.colorDepth,
        hasMask: decoded.hasMask,
        format: 'GB7'
      }
    } else if (file.type.startsWith('image/')) {
      const bitmap = await createImageBitmap(file)
      imageBitmap.value = bitmap

      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(bitmap, 0, 0)
      imageData.value = ctx.getImageData(0, 0, bitmap.width, bitmap.height)

      imageInfo.value = {
        width: bitmap.width,
        height: bitmap.height,
        colorDepth: 8,
        hasMask: false,
        format: file.type.split('/')[1].toUpperCase()
      }
    } else {
      throw new Error('Неподдерживаемый формат файла')
    }
  }

  function reset() {
    if (!imageBitmap.value) return
    const canvas = new OffscreenCanvas(imageBitmap.value.width, imageBitmap.value.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(imageBitmap.value, 0, 0)
    imageData.value = ctx.getImageData(0, 0, imageBitmap.value.width, imageBitmap.value.height)
  }

  function getPixel(x, y) {
    if (!imageData.value) return null
    const { width, height, data } = imageData.value
    if (x < 0 || y < 0 || x >= width || y >= height) return null
    const i = (y * width + x) * 4
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
  }

  function triggerDownload(blob, name) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  async function download(name = 'result.png') {
    if (!imageData.value) return

    if (/\.gb7$/i.test(name)) {
      const buf = encodeGB7(imageData.value, { useMask: false })
      const blob = new Blob([buf], { type: 'application/octet-stream' })
      triggerDownload(blob, name)
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = imageData.value.width
    canvas.height = imageData.value.height
    canvas.getContext('2d').putImageData(imageData.value, 0, 0)

    const mime = /\.jpe?g$/i.test(name) ? 'image/jpeg' : 'image/png'
    const blob = await new Promise(res => canvas.toBlob(res, mime, 0.92))
    triggerDownload(blob, name)
  }

  return {
    imageBitmap, imageData, imageInfo,
    fileName, fileSize,
    width, height,
    loadFile, reset, download, getPixel
  }
}