// Read the SOF component count: grayscale JPEG has one channel, RGB has three.
export async function readJpegHeader(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes[0] !== 255 || bytes[1] !== 216) return null
  const frames = new Set([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207])
  let offset = 2
  while (offset < bytes.length) {
    if (bytes[offset++] !== 255) continue
    while (bytes[offset] === 255) offset++
    const marker = bytes[offset++]
    if (marker === 217 || marker === 218) break
    if (marker === 216 || marker === 1 || (marker >= 208 && marker <= 215)) continue
    if (offset + 2 > bytes.length) break
    const size = (bytes[offset] << 8) | bytes[offset + 1]
    if (size < 2 || offset + size > bytes.length) break
    if (frames.has(marker)) {
      if (size < 8) break
      const sampleBitDepth = bytes[offset + 2], components = bytes[offset + 7]
      if (![1, 3, 4].includes(components)) break
      return { sampleBitDepth, colorDepth: sampleBitDepth * components, channels: components === 1 ? 1 : 3, isGrayscale: components === 1 }
    }
    offset += size
  }
  throw new Error('Повреждён заголовок JPEG')
}
