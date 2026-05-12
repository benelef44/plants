"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { HistoryDataPoint } from "@/lib/growbox-types"

interface MetricDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  currentValue: number
  unit: string
  dataKey: keyof HistoryDataPoint
  history: HistoryDataPoint[]
  color: string
  optimalRange?: string
}

export function MetricDialog({
  open,
  onOpenChange,
  title,
  currentValue,
  unit,
  dataKey,
  history,
  color,
  optimalRange,
}: MetricDialogProps) {
  const values = history.map((h) => h[dataKey] as number)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold" style={{ color }}>
            {currentValue}
          </span>
          <span className="text-lg text-muted-foreground">{unit}</span>
        </div>

        {optimalRange && (
          <p className="text-sm text-muted-foreground">{optimalRange}</p>
        )}

        <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary p-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="font-semibold text-foreground">{min.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg</p>
            <p className="font-semibold text-foreground">{avg.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="font-semibold text-foreground">{max.toFixed(1)}</p>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
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
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${dataKey})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-center text-xs text-muted-foreground">24h Verlauf</p>
      </DialogContent>
    </Dialog>
  )
}
