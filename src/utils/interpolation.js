export function nearestNeighbor(src, srcW, srcH, dstW, dstH) {
  const dst = new Uint8ClampedArray(dstW * dstH * 4)
  const scaleX = srcW / dstW
  const scaleY = srcH / dstH

  for (let y = 0; y < dstH; y++) {
    const sy = Math.min(srcH - 1, Math.floor(y * scaleY))
    for (let x = 0; x < dstW; x++) {
      const sx = Math.min(srcW - 1, Math.floor(x * scaleX))
      const si = (sy * srcW + sx) * 4
      const di = (y * dstW + x) * 4
      dst[di]     = src[si]
      dst[di + 1] = src[si + 1]
      dst[di + 2] = src[si + 2]
      dst[di + 3] = src[si + 3]
    }
  }
  return dst
}

export function bilinear(src, srcW, srcH, dstW, dstH) {
  const dst = new Uint8ClampedArray(dstW * dstH * 4)
  const scaleX = srcW / dstW
  const scaleY = srcH / dstH

  for (let y = 0; y < dstH; y++) {
    const fy = (y + 0.5) * scaleY - 0.5
    let y0 = Math.floor(fy)
    let y1 = y0 + 1
    const wy = fy - y0

    if (y0 < 0) y0 = 0
    if (y1 < 0) y1 = 0
    if (y0 > srcH - 1) y0 = srcH - 1
    if (y1 > srcH - 1) y1 = srcH - 1

    for (let x = 0; x < dstW; x++) {
      const fx = (x + 0.5) * scaleX - 0.5
      let x0 = Math.floor(fx)
      let x1 = x0 + 1
      const wx = fx - x0

      if (x0 < 0) x0 = 0
      if (x1 < 0) x1 = 0
      if (x0 > srcW - 1) x0 = srcW - 1
      if (x1 > srcW - 1) x1 = srcW - 1

      const i00 = (y0 * srcW + x0) * 4
      const i10 = (y0 * srcW + x1) * 4
      const i01 = (y1 * srcW + x0) * 4
      const i11 = (y1 * srcW + x1) * 4

      const di = (y * dstW + x) * 4

      for (let c = 0; c < 4; c++) {
        const v00 = src[i00 + c]
        const v10 = src[i10 + c]
        const v01 = src[i01 + c]
        const v11 = src[i11 + c]

        const top = v00 * (1 - wx) + v10 * wx
        const bot = v01 * (1 - wx) + v11 * wx
        const v = top * (1 - wy) + bot * wy

        dst[di + c] = v + 0.5
      }
    }
  }
  return dst
}

export const INTERPOLATIONS = {
  bilinear: {
    id: 'bilinear',
    label: 'Билинейная',
    description: 'Усредняет 4 соседних пикселя с весами по расстоянию. Даёт гладкие переходы, подходит для фотографий. По умолчанию.',
    resize: bilinear
  },
  nearest: {
    id: 'nearest',
    label: 'Ближайший сосед',
    description: 'Берёт ближайший пиксель без усреднения. Быстро, но даёт ступенчатые края. Хорош для пиксель-арта.',
    resize: nearestNeighbor
  }
}

export const DEFAULT_INTERPOLATION = 'bilinear'

export function resizeImageData(srcImageData, dstW, dstH, methodId = DEFAULT_INTERPOLATION) {
  const method = INTERPOLATIONS[methodId] || INTERPOLATIONS[DEFAULT_INTERPOLATION]
  const src = srcImageData.data
  const srcW = srcImageData.width
  const srcH = srcImageData.height
  const result = method.resize(src, srcW, srcH, dstW, dstH)
  return new ImageData(result, dstW, dstH)
}