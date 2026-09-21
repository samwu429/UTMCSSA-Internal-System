export interface AccentPalette {
  accent: string
  strong: string
  soft: string
  border: string
  contrast: string
}

interface RgbColour {
  red: number
  green: number
  blue: number
}

function parseHexColour(value: string): RgbColour | null {
  const hex = value.trim().replace('#', '')
  const normalized = hex.length === 3 ? hex.split('').map((part) => `${part}${part}`).join('') : hex
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null
  }

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function toHex({ red, green, blue }: RgbColour): string {
  const channel = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
  return `#${channel(red)}${channel(green)}${channel(blue)}`
}

function mix(source: RgbColour, target: RgbColour, amount: number): RgbColour {
  return {
    red: source.red + (target.red - source.red) * amount,
    green: source.green + (target.green - source.green) * amount,
    blue: source.blue + (target.blue - source.blue) * amount,
  }
}

function relativeLuminance({ red, green, blue }: RgbColour): number {
  const channel = (value: number) => {
    const scaled = value / 255
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
}

/**
 * Build the CSS custom properties a portal paints itself with from the department accent colour.
 *
 * 由部门主色推导门户使用的一组 CSS 自定义属性。
 */
export function deriveAccentPalette(accentHex: string): AccentPalette {
  const parsed = parseHexColour(accentHex) ?? { red: 140, green: 29, blue: 64 }
  const white = { red: 255, green: 255, blue: 255 }
  const black = { red: 23, green: 23, blue: 23 }

  return {
    accent: toHex(parsed),
    strong: toHex(mix(parsed, black, 0.22)),
    soft: toHex(mix(parsed, white, 0.88)),
    border: toHex(mix(parsed, white, 0.62)),
    contrast: relativeLuminance(parsed) < 0.45 ? '#ffffff' : '#171717',
  }
}
