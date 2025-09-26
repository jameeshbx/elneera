// lib/colorUtils.ts
export interface ColorInfo {
    hex: string
    rgb: { r: number; g: number; b: number }
    hsl: { h: number; s: number; l: number }
    luminance: number
    isLight: boolean
  }
  
  export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }
  
  export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255
    g /= 255
    b /= 255
  
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2
  
    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }
  
    return { h: h * 360, s: s * 100, l: l * 100 }
  }
  
  export function getColorLuminance(hex: string): number {
    const { r, g, b } = hexToRgb(hex)
    
    // Convert to sRGB
    const sRGB = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    // Calculate relative luminance
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  }
  
  export function isLightColor(hex: string): boolean {
    return getColorLuminance(hex) > 0.5
  }
  
  export function getContrastingTextColor(hex: string): string {
    return isLightColor(hex) ? '#1f2937' : '#ffffff' // gray-800 or white
  }
  
  export function getColorInfo(hex: string): ColorInfo {
    const rgb = hexToRgb(hex)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const luminance = getColorLuminance(hex)
    
    return {
      hex,
      rgb,
      hsl,
      luminance,
      isLight: luminance > 0.5
    }
  }
  
  export function generateColorVariants(hex: string) {
    const { r, g, b } = hexToRgb(hex)
    
    return {
      light: `rgba(${r}, ${g}, ${b}, 0.1)`,
      medium: `rgba(${r}, ${g}, ${b}, 0.3)`,
      dark: `rgba(${r}, ${g}, ${b}, 0.8)`,
      gradient: `linear-gradient(135deg, ${hex}E6 0%, ${hex}CC 50%, ${hex}B3 100%)`,
      shadow: `0 4px 20px rgba(${r}, ${g}, ${b}, 0.3)`
    }
  }