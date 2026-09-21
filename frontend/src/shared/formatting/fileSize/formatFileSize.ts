const UNIT_LABELS = ['B', 'KB', 'MB', 'GB', 'TB'] as const
const UNIT_STEP = 1024

export function formatFileSize(sizeInBytes: number | null | undefined): string {
  if (sizeInBytes === null || sizeInBytes === undefined || sizeInBytes < 0) {
    return '—'
  }

  let remaining = sizeInBytes
  let unitIndex = 0
  while (remaining >= UNIT_STEP && unitIndex < UNIT_LABELS.length - 1) {
    remaining /= UNIT_STEP
    unitIndex += 1
  }

  const rounded = unitIndex === 0 ? remaining : Math.round(remaining * 10) / 10
  return `${rounded} ${UNIT_LABELS[unitIndex]}`
}
