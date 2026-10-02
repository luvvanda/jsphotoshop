export async function readPngHeader(file) {
  const slice = file.slice(0, 33)
  const buf = await slice.arrayBuffer()
  const bytes = new Uint8Array(buf)

  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 &&
    bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a &&
    bytes[6] === 0x1a && bytes[7] === 0x0a

  if (!isPng) return null

  const bitDepth = bytes[24]
  const colorType = bytes[25]

  const colorTypeNames = {
    0: 'Grayscale',
    2: 'RGB',
    3: 'Palette',
    4: 'Grayscale + Alpha',
    6: 'RGBA'
  }

  const channelsMap = {
    0: 1,
    2: 3,
    3: 3,
    4: 2,
    6: 4
  }

  const hasAlphaMap = {
    0: false,
    2: false,
    3: true,
    4: true,
    6: true
  }

  const isGrayscaleMap = {
    0: true,
    2: false,
    3: false,
    4: true,
    6: false
  }

  return {
    bitDepth,
    colorType,
    colorTypeName: colorTypeNames[colorType] || 'Unknown',
    channels: channelsMap[colorType] || 4,
    hasAlpha: hasAlphaMap[colorType] ?? false,
    isGrayscale: isGrayscaleMap[colorType] ?? false
  }
}