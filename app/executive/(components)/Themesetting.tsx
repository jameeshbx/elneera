"use client"

import { useState } from "react"
import { useColor } from "@/context/color-context"

export function ThemeSettings() {
  const { landingPageColor, updateThemeColor } = useColor()
  const [selectedColor, setSelectedColor] = useState(landingPageColor)
  const [isSaving, setIsSaving] = useState(false)

  const presetColors = [
    { name: "Teal", value: "#4ECDC4" },
    { name: "Blue", value: "#3498db" },
    { name: "Purple", value: "#9b59b6" },
    { name: "Green", value: "#2ecc71" },
    { name: "Orange", value: "#e67e22" },
    { name: "Red", value: "#e74c3c" },
    { name: "Pink", value: "#fd79a8" },
    { name: "Indigo", value: "#6c5ce7" },
  ]

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
  }

  const handleSaveTheme = async () => {
    setIsSaving(true)
    try {
      // Save to API
      const response = await fetch('/api/auth/agency-profile-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyInformation: {
            landingPageColor: selectedColor
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update theme')
      }

      // Update context and trigger global update
      updateThemeColor(selectedColor)

      // Also dispatch event for components not using context
      window.dispatchEvent(new CustomEvent('themeUpdated', {
        detail: { color: selectedColor }
      }))

      alert('Theme updated successfully!')
    } catch (error) {
      console.error('Error updating theme:', error)
      alert('Failed to update theme')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Theme Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Current Theme Color
          </label>
          <div 
            className="w-full h-20 rounded-lg border-2 border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
          <p className="mt-2 text-sm text-gray-500">
            {selectedColor}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preset Colors
          </label>
          <div className="grid grid-cols-4 gap-3">
            {presetColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className={`relative h-16 rounded-lg border-2 transition-all ${
                  selectedColor === color.value
                    ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {selectedColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white drop-shadow-lg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Custom Color
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSaveTheme}
            disabled={isSaving || selectedColor === landingPageColor}
            className="flex-1 px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: selectedColor,
              opacity: isSaving || selectedColor === landingPageColor ? 0.5 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Theme'}
          </button>
          <button
            onClick={() => setSelectedColor(landingPageColor)}
            disabled={selectedColor === landingPageColor}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}