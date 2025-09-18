"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

type Point = { month: string; current: number; previous: number }

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const basePrev = [200, 260, 220, 280, 300, 270, 240, 260, 230, 260, 250, 270]
const baseCurr = [40, 160, 290, 310, 460, 260, 240, 10, 120, 140, 170, 150]

const defaultData: Point[] = months.map((m, i) => ({
  month: m,
  current: baseCurr[i],
  previous: basePrev[i],
}))

/* Speech-bubble tooltip showing the delta between current and previous.
   It renders only when hovering the chart. */
function ComparisonTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { dataKey: string; value: number }[]
}) {
  if (!active || !payload || payload.length === 0) return null

  const current = payload.find((p) => p.dataKey === "current")?.value ?? 0
  const previous = payload.find((p) => p.dataKey === "previous")?.value ?? 0
  const diff = Math.round(current - previous)
  const isPositive = diff >= 0
  const text = `(${diff > 0 ? "+" : ""}${diff}) ${isPositive ? "more" : "less"}`

  return (
    <div className="relative rounded-md border border-black/50 bg-white px-3 py-2 text-sm shadow-sm">
      <div className={`font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
        {text}
      </div>
      {/* Bubble tail (border) */}
      <span className="pointer-events-none absolute left-4 -bottom-2 h-0 w-0 border-x-8 border-t-8 border-b-0 border-x-transparent border-t-black/50" />
      {/* Bubble tail (fill) */}
      <span className="pointer-events-none absolute left-4 -bottom-[7px] h-0 w-0 border-x-7 border-t-7 border-b-0 border-x-transparent border-t-white" />
    </div>
  )
}

export default function SalesOverviewChart({
  data = defaultData as Point[],
}: {
  data?: Point[]
}) {
  // Config for shadcn/ui ChartContainer (provides CSS vars like --color-current)
  const chartConfig = {
    current: { label: "Current Year", color: "#065f46" }, // dark green stroke
    previous: { label: "Previous Year", color: "#1f2937" }, // slate/dark stroke
  }

  // Unique IDs for gradients (safe in client-only component)
  const gradIds = React.useMemo(() => {
    const rnd = Math.random().toString(36).slice(2)
    return {
      current: `fill-current-${rnd}`,
      previous: `fill-previous-${rnd}`,
    }
  }, [])

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
          <defs>
            {/* Previous year gradient: #2D3748 at 36% -> 0% */}
            <linearGradient id={gradIds.previous} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2D3748" stopOpacity={0.36} />
              <stop offset="95%" stopColor="#2D3748" stopOpacity={0} />
            </linearGradient>

            {/* Current year gradient: #63DEA7 100% -> #4FD1C5 0% */}
            <linearGradient id={gradIds.current} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#63DEA7" stopOpacity={1} />
              <stop offset="95%" stopColor="#4FD1C5" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-muted-foreground/20" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />

          {/* Custom comparison tooltip (speech bubble) */}
          <ChartTooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
            content={<ComparisonTooltip />}
          />

          {/* Draw previous year area first (behind) */}
          <Area
            type="monotone"
            dataKey="previous"
            stroke="var(--color-previous)"
            strokeWidth={1}
            fill={`url(#${gradIds.previous})`}
            activeDot={false}
            dot={false}
          />

          {/* Current year area on top with dark green stroke.
              The tooltip compares current vs previous. */}
          <Area
            type="monotone"
            dataKey="current"
            stroke="var(--color-current)"
            strokeWidth={1}
            fill={`url(#${gradIds.current})`}
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-current)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
