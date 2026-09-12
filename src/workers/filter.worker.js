function createPadded(data, width, height, channelOffset, edgeMode) {
  const pw = width + 2
  const ph = height + 2
  const padded = new Uint8ClampedArray(pw * ph)

  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const sx = x - 1
      const sy = y - 1

      let value

      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        value = data[(sy * width + sx) * 4 + channelOffset]
      } else if (edgeMode === 'black') {
        value = 0
      } else if (edgeMode === 'white') {
        value = 255
      } else {
        const cx = Math.max(0, Math.min(width - 1, sx))
        const cy = Math.max(0, Math.min(height - 1, sy))
        value = data[(cy * width + cx) * 4 + channelOffset]
      }

      padded[y * pw + x] = value
    }
  }

  return { padded, pw, ph }
}

function convolvePadded(padded, pw, ph, width, height, kernel, divisor) {
  const out = new Uint8ClampedArray(width * height)

  const k00 = kernel[0][0], k01 = kernel[0][1], k02 = kernel[0][2]
  const k10 = kernel[1][0], k11 = kernel[1][1], k12 = kernel[1][2]
  const k20 = kernel[2][0], k21 = kernel[2][1], k22 = kernel[2][2]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 1
      const py = y + 1

      const p00 = padded[(py - 1) * pw + (px - 1)]
      const p01 = padded[(py - 1) * pw +  px]
      const p02 = padded[(py - 1) * pw + (px + 1)]
      const p10 = padded[ py      * pw + (px - 1)]
      const p11 = padded[ py      * pw +  px]
      const p12 = padded[ py      * pw + (px + 1)]
      const p20 = padded[(py + 1) * pw + (px - 1)]
      const p21 = padded[(py + 1) * pw +  px]
      const p22 = padded[(py + 1) * pw + (px + 1)]

      let sum = p00 * k00 + p01 * k01 + p02 * k02
              + p10 * k10 + p11 * k11 + p12 * k12
              + p20 * k20 + p21 * k21 + p22 * k22

      if (divisor && divisor !== 1) sum = sum / divisor

      out[y * width + x] = sum
    }
  }

  return out
}

self.onmessage = (e) => {
  const { imageData, width, height, kernel, divisor, channels, edgeMode, mode } = e.data

  const src = new Uint8ClampedArray(imageData)
  const dst = new Uint8ClampedArray(src.length)
  dst.set(src)

  const channelMap = { r: 0, g: 1, b: 2, a: 3 }
  const activeChannels = Object.keys(channels).filter(ch => channels[ch])

  for (const ch of activeChannels) {
    const offset = channelMap[ch]

    const { padded, pw, ph } = createPadded(src, width, height, offset, edgeMode)
    const result = convolvePadded(padded, pw, ph, width, height, kernel, divisor)

    for (let i = 0; i < result.length; i++) {
      dst[i * 4 + offset] = result[i]
    }
  }

  self.postMessage({ data: dst.buffer, width, height, mode }, [dst.buffer])
}