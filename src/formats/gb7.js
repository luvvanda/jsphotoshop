const SIGNATURE = [0x47, 0x42, 0x37, 0x1d]
const VERSION = 0x01
const HEADER_SIZE = 12

export function decodeGB7(buffer) {
  if (buffer.byteLength < HEADER_SIZE) {
    throw new Error('GB7: файл слишком короткий')
  }
  const bytes = new Uint8Array(buffer)

  for (let i = 0; i < 4; i++) {
    if (bytes[i] !== SIGNATURE[i]) {
      throw new Error('GB7: неверная сигнатура файла')
    }
  }

  const version = bytes[4]
  if (version !== VERSION) {
    throw new Error(`GB7: неподдерживаемая версия ${version}`)
  }

  const flag = bytes[5]
  const hasMask = (flag & 0x01) === 1

  const width  = (bytes[6] << 8) | bytes[7]
  const height = (bytes[8] << 8) | bytes[9]

  if (width === 0 || height === 0) {
    throw new Error('GB7: нулевые размеры изображения')
  }

  const pixelCount = width * height
  const expected = HEADER_SIZE + pixelCount
  if (buffer.byteLength < expected) {
    throw new Error(`GB7: ожидалось ${expected} байт, получено ${buffer.byteLength}`)
  }

  const out = new Uint8ClampedArray(pixelCount * 4)

  for (let i = 0; i < pixelCount; i++) {
    const byte = bytes[HEADER_SIZE + i]
    const gray7 = byte & 0x7f
    const gray8 = (gray7 << 1) | (gray7 >> 6)

    let alpha = 255
    if (hasMask) {
      const maskBit = (byte >> 7) & 1
      alpha = maskBit === 1 ? 255 : 0
    }

    const o = i * 4
    out[o]     = gray8
    out[o + 1] = gray8
    out[o + 2] = gray8
    out[o + 3] = alpha
  }

  return {
    width,
    height,
    colorDepth: 7,
    hasMask,
    data: new ImageData(out, width, height)
  }
}

export function encodeGB7(imageData, opts = {}) {
  const { useMask = false, maskThreshold = 128 } = opts
  const { width, height, data } = imageData

  if (width > 0xffff || height > 0xffff) {
    throw new Error('GB7: размеры не влезают в uint16 (макс 65535)')
  }

  const pixelCount = width * height
  const buffer = new ArrayBuffer(HEADER_SIZE + pixelCount)
  const bytes = new Uint8Array(buffer)

  bytes[0] = SIGNATURE[0]
  bytes[1] = SIGNATURE[1]
  bytes[2] = SIGNATURE[2]
  bytes[3] = SIGNATURE[3]
  bytes[4] = VERSION
  bytes[5] = useMask ? 0x01 : 0x00

  bytes[6] = (width  >> 8) & 0xff
  bytes[7] = width         & 0xff
  bytes[8] = (height >> 8) & 0xff
  bytes[9] = height        & 0xff
  bytes[10] = 0x00
  bytes[11] = 0x00

  for (let i = 0; i < pixelCount; i++) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const a = data[o + 3]

    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    let gray7 = Math.round(lum * 127 / 255)
    if (gray7 > 127) gray7 = 127
    if (gray7 < 0) gray7 = 0

    let byte = gray7 & 0x7f

    if (useMask) {
      const opaque = a >= maskThreshold ? 1 : 0
      byte |= (opaque << 7)
    }

    bytes[HEADER_SIZE + i] = byte
  }

  return buffer
}