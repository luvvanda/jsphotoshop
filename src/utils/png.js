const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]
const SAMPLES = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }
const DEPTHS = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] }

// IHDR stores bits per sample (or palette index), not total bits per pixel.
// tRNS describes transparency without adding samples to the pixel stream.
export async function readPngHeader(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!SIGNATURE.every((value, i) => bytes[i] === value)) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (bytes.length < 33 || view.getUint32(8) !== 13 || String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR') {
    throw new Error('Повреждён заголовок PNG')
  }
  const bitDepth = bytes[24], colorType = bytes[25]
  if (!DEPTHS[colorType]?.includes(bitDepth)) throw new Error('Недопустимый тип цвета или глубина PNG')
  let hasAlpha = colorType === 4 || colorType === 6
  let offset = 33
  while (offset + 12 <= bytes.length) {
    const size = view.getUint32(offset)
    if (size > bytes.length - offset - 12) throw new Error('Повреждена длина блока PNG')
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8))
    if (type === 'tRNS') {
      hasAlpha = colorType === 3
        ? bytes.slice(offset + 8, offset + 8 + size).some(value => value < 255)
        : colorType === 0 || colorType === 2 || hasAlpha
    }
    if (type === 'IDAT' || type === 'IEND') break
    offset += size + 12
  }
  const isGrayscale = colorType === 0 || colorType === 4
  return {
    bitDepth, colorType, colorDepth: bitDepth * SAMPLES[colorType],
    sampleBitDepth: colorType === 3 ? 8 : bitDepth,
    storedChannels: SAMPLES[colorType], indexed: colorType === 3,
    channels: (isGrayscale ? 1 : 3) + Number(hasAlpha),
    hasAlpha, isGrayscale,
    colorTypeName: colorType === 3 ? 'Palette' : isGrayscale ? (hasAlpha ? 'Grayscale + Alpha' : 'Grayscale') : (hasAlpha ? 'RGBA' : 'RGB')
  }
}
