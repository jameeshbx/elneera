"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ColorContextType {
  landingPageColor: string
  isLightColor: boolean
  setLandingPageColor: (color: string) => void
  updateThemeColor: (color: string) => void
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

export function ColorProvider({ children }: { children: ReactNode }) {
  const [landingPageColor, setLandingPageColor] = useState("#4ECDC4")
  const [isLightColor, setIsLightColor] = useState(false)

  const checkIfLightColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    setIsLightColor(luminance > 0.5)
  }

  const adjustBrightness = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }

  const updateThemeColor = (color: string) => {
    setLandingPageColor(color)
    checkIfLightColor(color)
    
    // Update CSS variables
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-color', color)
      document.documentElement.style.setProperty('--theme-color-light', color + '20')
      document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(color, -20))
    }

    // Dispatch event for components not using context
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('themeUpdated', { 
        detail: { color } 
      }))
    }
  }

  useEffect(() => {
    checkIfLightColor(landingPageColor)
  }, [landingPageColor])

  return (
    <ColorContext.Provider value={{ 
      landingPageColor, 
      isLightColor, 
      setLandingPageColor,
      updateThemeColor
    }}>
      {children}
    </ColorContext.Provider>
  )
}

export function useColor() {
  const context = useContext(ColorContext)
  if (context === undefined) {
    throw new Error('useColor must be used within a ColorProvider')
  }
  return context
}