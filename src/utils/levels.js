const CHANNEL_INDEX = { r: 0, g: 1, b: 2, a: 3 }

function srgbToLinear(v8) {
  const v = v8 / 255
  return v <= 0.04045
    ? v / 12.92
    : Math.pow((v + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(r, g, b) {
  const R = srgbToLinear(r)
  const G = srgbToLinear(g)
  const B = srgbToLinear(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

export function luminance255(r, g, b) {
  return relativeLuminance(r, g, b) * 255
}

export function luma601(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function buildLUT(black, white, gamma) {
  const lut = new Uint8ClampedArray(256)

  if (white <= black) white = black + 1
  if (gamma <= 0) gamma = 1

  const range = white - black
  const invGamma = 1 / gamma

  for (let i = 0; i < 256; i++) {
    let v = (i - black) / range
    if (v < 0) v = 0
    else if (v > 1) v = 1
    v = Math.pow(v, invGamma)
    lut[i] = Math.round(v * 255)
  }
  return lut
}

export function applyLUTToChannel(imageData, channelIndex, lut) {
  const data = imageData.data
  for (let i = channelIndex; i < data.length; i += 4) {
    data[i] = lut[data[i]]
  }
}

export function computeHistogram(imageData, channel = 'master') {
  const hist = new Uint32Array(256)
  const data = imageData.data

  if (channel === 'master') {
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.round(luminance255(data[i], data[i + 1], data[i + 2]))
      hist[v > 255 ? 255 : v]++
    }
  } else {
    const idx = CHANNEL_INDEX[channel]
    for (let i = 0; i < data.length; i += 4) {
      hist[data[i + idx]]++
    }
  }
  return hist
}

export function logScale(hist) {
  const out = new Float64Array(256)
  for (let i = 0; i < 256; i++) {
    out[i] = hist[i] > 0 ? Math.log(hist[i] + 1) : 0
  }
  return out
}