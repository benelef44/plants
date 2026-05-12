"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import type { HistoryDataPoint } from "@/lib/growbox-types"

interface HistoryChartProps {
  data: HistoryDataPoint[]
  title: string
}

type MetricKey = "temperature" | "humidity" | "vpd" | "co2"

const metrics: { key: MetricKey; label: string; color: string; unit: string }[] = [
  { key: "temperature", label: "Temperatur", color: "#f97316", unit: "°C" },
  { key: "humidity", label: "Luftfeuchtigkeit", color: "#3b82f6", unit: "%" },
  { key: "vpd", label: "VPD", color: "#22c55e", unit: "kPa" },
  { key: "co2", label: "CO2", color: "#a855f7", unit: "ppm" },
]

export function HistoryChart({ data, title }: HistoryChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("temperature")
  const currentMetric = metrics.find((m) => m.key === activeMetric)!

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title} - 24h Verlauf</h3>
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              onClick={() => setActiveMetric(metric.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeMetric === metric.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(value: number) => [`${value} ${currentMetric.unit}`, currentMetric.label]}
            />
            <Line
              type="monotone"
              dataKey={activeMetric}
              stroke={currentMetric.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: currentMetric.color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
