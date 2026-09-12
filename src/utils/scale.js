export const ZOOM_MIN = 12
export const ZOOM_MAX = 300
export const MIN_PADDING = 50

export function fitZoom(srcW, srcH, canvasW, canvasH, padding = MIN_PADDING) {
  const availW = Math.max(1, canvasW - padding * 2)
  const availH = Math.max(1, canvasH - padding * 2)

  const scaleX = availW / srcW
  const scaleY = availH / srcH
  const scale = Math.min(scaleX, scaleY)

  let percent = Math.round(scale * 100)
  if (percent < ZOOM_MIN) percent = ZOOM_MIN
  if (percent > ZOOM_MAX) percent = ZOOM_MAX
  return percent
}

export function validateResize(width, height, mode, srcW, srcH) {
  const errors = {}

  if (mode === 'percent') {
    if (width < ZOOM_MIN || width > ZOOM_MAX) {
      errors.width = `От ${ZOOM_MIN}% до ${ZOOM_MAX}%`
    }
    if (height < ZOOM_MIN || height > ZOOM_MAX) {
      errors.height = `От ${ZOOM_MIN}% до ${ZOOM_MAX}%`
    }
  } else {
    const minW = Math.max(1, Math.round(srcW * ZOOM_MIN / 100))
    const maxW = Math.round(srcW * ZOOM_MAX / 100)
    const minH = Math.max(1, Math.round(srcH * ZOOM_MIN / 100))
    const maxH = Math.round(srcH * ZOOM_MAX / 100)

    if (width < minW || width > maxW) {
      errors.width = `От ${minW} до ${maxW} px`
    }
    if (height < minH || height > maxH) {
      errors.height = `От ${minH} до ${maxH} px`
    }
  }

  return errors
}

export function toPixels(width, height, mode, srcW, srcH) {
  if (mode === 'percent') {
    return {
      w: Math.max(1, Math.round(srcW * width / 100)),
      h: Math.max(1, Math.round(srcH * height / 100))
    }
  }
  return { w: Math.round(width), h: Math.round(height) }
}

export function toMegapixels(w, h) {
  return (w * h / 1_000_000).toFixed(2)
}