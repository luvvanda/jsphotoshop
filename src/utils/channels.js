export function imageChannels(info) {
  if (!info) return []
  return [...(info.isGrayscale ? ['gray'] : ['r', 'g', 'b']), ...(info.hasAlpha ? ['a'] : [])]
}

export function projectChannels(source, available, enabled) {
  const out = new Uint8ClampedArray(source.length)
  const alphaOn = available.includes('a') && enabled.a
  const alphaOnly = alphaOn && !available.some(key => key !== 'a' && enabled[key])
  for (let i = 0; i < source.length; i += 4) {
    if (alphaOnly) out[i] = out[i + 1] = out[i + 2] = source[i + 3]
    else if (available.includes('gray')) out[i] = out[i + 1] = out[i + 2] = enabled.gray ? source[i] : 0
    else {
      out[i] = enabled.r ? source[i] : 0
      out[i + 1] = enabled.g ? source[i + 1] : 0
      out[i + 2] = enabled.b ? source[i + 2] : 0
    }
    out[i + 3] = alphaOn && !alphaOnly ? source[i + 3] : 255
  }
  return out
}
