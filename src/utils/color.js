function srgbToLinear(c) {
  const v = c / 255
  return v <= 0.04045
    ? v / 12.92
    : Math.pow((v + 0.055) / 1.055, 2.4)
}

function rgbToXyz(r, g, b) {
  const R = srgbToLinear(r)
  const G = srgbToLinear(g)
  const B = srgbToLinear(b)

  const x = R * 0.4124564 + G * 0.3575761 + B * 0.1804375
  const y = R * 0.2126729 + G * 0.7151522 + B * 0.0721750
  const z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041

  return { x, y, z }
}

function f(t) {
  const EPSILON = 216 / 24389
  const KAPPA = 24389 / 27
  return t > EPSILON
    ? Math.cbrt(t)
    : (KAPPA * t + 16) / 116
}

function xyzToLab(x, y, z) {
  const Xn = 0.95047
  const Yn = 1.00000
  const Zn = 1.08883

  const fx = f(x / Xn)
  const fy = f(y / Yn)
  const fz = f(z / Zn)

  const L = 116 * fy - 16
  const a = 500 * (fx - fy)
  const b = 200 * (fy - fz)

  return { L, a, b }
}

export function rgbToLab(r, g, b) {
  const { x, y, z } = rgbToXyz(r, g, b)
  return xyzToLab(x, y, z)
}

export function round2(v) {
  return Math.round(v * 100) / 100
}