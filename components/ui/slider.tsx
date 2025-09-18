import React from "react"

interface SliderProps {
  defaultValue?: number[]
  max?: number
  min?: number
  step?: number
  onValueChange?: (value: number[]) => void
  className?: string
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ defaultValue = [50], max = 100, min = 0, step = 1, onValueChange, className, ...props }, ref) => {
    const [value, setValue] = React.useState(defaultValue[0])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value)
      setValue(newValue)
      onValueChange?.([newValue])
    }

    return (
      <div className={`relative w-full ${className}`}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = "Slider"