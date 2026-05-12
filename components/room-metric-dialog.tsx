"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface RoomMetricDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "temperature" | "humidity" | "co2"
  currentValue: number
  history: Array<{ time: string; value: number }>
}

const config = {
  temperature: {
    title: "Raumtemperatur",
    unit: "°C",
    color: "#f87171",
    optimalRange: "Optimal: 20-26°C",
  },
  humidity: {
    title: "Raumluftfeuchtigkeit",
    unit: "%",
    color: "#38bdf8",
    optimalRange: "Optimal: 50-70%",
  },
  co2: {
    title: "CO2",
    unit: "ppm",
    color: "#94a3b8",
    optimalRange: "Optimal: 800-1200 ppm",
  },
}

export function RoomMetricDialog({
  open,
  onOpenChange,
  type,
  currentValue,
  history,
}: RoomMetricDialogProps) {
  const { title, unit, color, optimalRange } = config[type]

  const values = history.map((h) => h.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length

  const formatValue = (val: number) => {
    if (type === "co2") return val.toFixed(0)
    return val.toFixed(1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold" style={{ color }}>
            {formatValue(currentValue)}
          </span>
          <span className="text-lg text-muted-foreground">{unit}</span>
        </div>

        <p className="text-sm text-muted-foreground">{optimalRange}</p>

        <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary p-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="font-semibold text-foreground">{formatValue(min)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg</p>
            <p className="font-semibold text-foreground">{formatValue(avg)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="font-semibold text-foreground">{formatValue(max)}</p>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id={`gradient-room-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fill: "#888", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={5}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#888", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [formatValue(value), title]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-room-${type})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-center text-xs text-muted-foreground">24h Verlauf</p>
      </DialogContent>
    </Dialog>
  )
}
