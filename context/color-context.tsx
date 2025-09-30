"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getColorInfo, generateColorVariants, type ColorInfo } from "@/lib/ColorUtils"

interface ColorContextType {
  landingPageColor: string
  setLandingPageColor: (color: string) => void
  colorInfo: ColorInfo
  colorVariants: ReturnType<typeof generateColorVariants>
  isLightColor: boolean
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

export function ColorProvider({ children }: { children: ReactNode }) {
  const [landingPageColor, setLandingPageColor] = useState("#4ECDC4")
  const [colorInfo, setColorInfo] = useState<ColorInfo>(getColorInfo("#4ECDC4"))
  const [colorVariants, setColorVariants] = useState(generateColorVariants("#4ECDC4"))

  // Update color info and variants when color changes
  useEffect(() => {
    const info = getColorInfo(landingPageColor)
    const variants = generateColorVariants(landingPageColor)
    setColorInfo(info)
    setColorVariants(variants)
  }, [landingPageColor])

  // Load color from localStorage on mount
  useEffect(() => {
    const savedColor = localStorage.getItem('landingPageColor')
    if (savedColor) {
      setLandingPageColor(savedColor)
    } else {
      // Fetch from API if not in localStorage
      fetchLandingPageColor()
    }
  }, [])

  const fetchLandingPageColor = async () => {
    try {
      const response = await fetch('/api/auth/agency-profile-admin')
      if (response.ok) {
        const data = await response.json()
        if (data.companyInformation?.landingPageColor) {
          const color = data.companyInformation.landingPageColor
          setLandingPageColor(color)
          localStorage.setItem('landingPageColor', color)
        }
      }
    } catch (error) {
      console.error('Failed to fetch landing page color:', error)
    }
  }

  const updateLandingPageColor = (color: string) => {
    setLandingPageColor(color)
    localStorage.setItem('landingPageColor', color)
  }

  return (
    <ColorContext.Provider
      value={{
        landingPageColor,
        setLandingPageColor: updateLandingPageColor,
        colorInfo,
        colorVariants,
        isLightColor: colorInfo.isLight
      }}
    >
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