// hooks/useColorIntegration.ts
"use client"

import { useEffect } from 'react'
import { useColor } from '@/context/color-context'

interface UseColorIntegrationProps {
  onColorChange?: (color: string) => void
  updateAPI?: boolean
}

export function useColorIntegration({ 
  onColorChange, 
  updateAPI = true 
}: UseColorIntegrationProps = {}) {
  const { landingPageColor, setLandingPageColor, isLightColor } = useColor()

  // Function to update color both locally and in API
  const updateColor = async (newColor: string) => {
    try {
      // Update context (this will also update localStorage)
      setLandingPageColor(newColor)
      
      // Call optional callback
      if (onColorChange) {
        onColorChange(newColor)
      }

      // Update API if requested
      if (updateAPI) {
        const response = await fetch('/api/update-landing-color', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ landingPageColor: newColor }),
        })

        if (!response.ok) {
          console.error('Failed to update color in API:', await response.text())
        }
      }
    } catch (error) {
      console.error('Error updating color:', error)
    }
  }

  return {
    landingPageColor,
    isLightColor,
    updateColor,
    setLandingPageColor
  }
}