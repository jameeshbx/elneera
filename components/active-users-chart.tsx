"use client"
import { Bar, BarChart, ResponsiveContainer, YAxis } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

type MonthPoint = { month: string; active: number }

const defaultData: MonthPoint[] = [
  { month: "Jan", active: 120 },
  { month: "Feb", active: 420 },
  { month: "Mar", active: 260 },
  { month: "Apr", active: 380 },
  { month: "May", active: 190 },
  { month: "Jun", active: 410 },
  { month: "Jul", active: 300 },
  { month: "Aug", active: 460 },
  { month: "Sep", active: 230 },
  { month: "Oct", active: 410 },
  { month: "Nov", active: 280 },
  { month: "Dec", active: 440 },
]

// Minimal tooltip that only shows the active count
function OnlyValueTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number }[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0]?.value ?? 0
  return <div className="rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-slate-900 shadow">{value}</div>
}

/**
 * Vertical bar chart for last year's monthly active users.
 * - Left Y-axis ticks at 0,100,200,300,400,500
 * - No white hover shade (cursor is transparent)
 * - Tooltip shows only the numeric count for the hovered month
 */
export default function ActiveUsersChart({
  data = defaultData as MonthPoint[],
}: {
  data?: MonthPoint[]
}) {
  const chartConfig = {
    active: { label: "Active Users", color: "white" },
  }
  const ticks = [0, 100, 200, 300, 400, 500]

  return (
    <ChartContainer config={chartConfig} className="h-full w-full text-white">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={12} margin={{left:2, right: 8, top: 8, bottom: 10 }}>
          {/* Left-side Y axis labels */}
          <YAxis
            ticks={ticks}
            domain={[0, 500]}
            tick={{ fill: "rgb(255, 255, 255)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={28}
            allowDecimals={false}
            tickMargin={4}
          />

          {/* Tooltip with transparent cursor to avoid the white hover shade */}
          <ChartTooltip cursor={{ fill: "transparent" }} content={<OnlyValueTooltip />} />

          {/* Bars */}
          <Bar dataKey="active" radius={[6, 6, 6, 6]} fill="rgba(255,255,255,0.9)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
