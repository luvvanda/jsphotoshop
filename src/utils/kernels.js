export const KERNEL_PRESETS = {
  identity: {
    label: 'Тождественное отображение',
    kernel: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ]
  },
  sharpen: {
    label: 'Повышение резкости',
    kernel: [
      [ 0, -1,  0],
      [-1,  5, -1],
      [ 0, -1,  0]
    ]
  },
  gaussian: {
    label: 'Фильтр Гаусса 3×3',
    kernel: [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ],
    divisor: 16
  },
  boxBlur: {
    label: 'Прямоугольное размытие',
    kernel: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ],
    divisor: 9
  },
  prewittX: {
    label: 'Прюитт X (горизонтальный)',
    kernel: [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1]
    ]
  },
  prewittY: {
    label: 'Прюитт Y (вертикальный)',
    kernel: [
      [-1, -1, -1],
      [ 0,  0,  0],
      [ 1,  1,  1]
    ]
  }
}

export const CUSTOM_PRESET = {
  id: 'custom',
  label: 'Пользовательское ядро'
}

export const EDGE_MODES = {
  black: { label: 'Чёрный' },
  white: { label: 'Белый' },
  copy:  { label: 'Копирование' }
}

export function getDefaultKernel() {
  return KERNEL_PRESETS.identity.kernel.map(row => [...row])
}