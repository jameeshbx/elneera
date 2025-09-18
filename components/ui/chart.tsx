"use client"

import * as React from "react"
import { Legend as RechartsLegend, Tooltip as RechartsTooltip } from "recharts"

type ChartConfig = Record<string, { label?: string; color?: string }>

type ChartContainerProps = {
  config?: ChartConfig
  className?: string
  children: React.ReactNode
}

export function ChartContainer({ config = {}, className = "", children }: ChartContainerProps) {
  const cssVars: Record<string, string> = {}
  Object.entries(config).forEach(([key, cfg]) => {
    if (cfg?.color) {
      cssVars[`--color-${key}`] = cfg.color
    }
  })
  const style = cssVars as React.CSSProperties

  return (
    <div style={style} className={className}>
      {children}
    </div>
  )
}

// Simple passthrough wrappers to keep call sites consistent
export const ChartTooltip = RechartsTooltip

export type ChartTooltipContentProps = {
  className?: string
  indicator?: "line" | "dot" | "none"
}

type TooltipPayloadItem = {
  name?: string | number
  value?: number | string
}

export function ChartTooltipContent(
  props: ChartTooltipContentProps & {
    payload?: TooltipPayloadItem[]
    label?: React.ReactNode
  }
) {
  const { payload, label, className } = props
  if (!payload || payload.length === 0) return null

  return (
    <div className={className ?? ""}>
      {label ? <div className="mb-1 text-sm opacity-70">{label}</div> : null}
      <div className="space-y-0.5 text-sm">
        {payload.map((p: TooltipPayloadItem, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="opacity-70">{p.name}</span>
            <span>{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const ChartLegend = RechartsLegend

export function ChartLegendContent() {
  return null
}