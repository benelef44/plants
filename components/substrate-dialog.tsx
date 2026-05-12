"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Droplets, Plus, Minus } from "lucide-react"
import type { HistoryDataPoint } from "@/lib/growbox-types"

interface SubstrateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentMoisture: number
  waterTankLevel: number
  lastWatering: Date
  wateringAmount: number
  history: HistoryDataPoint[]
  onWateringAmountChange?: (amount: number) => void
  onFillTank?: () => void
}

export function SubstrateDialog({
  open,
  onOpenChange,
  currentMoisture,
  waterTankLevel,
  lastWatering,
  wateringAmount,
  history,
  onWateringAmountChange,
  onFillTank,
}: SubstrateDialogProps) {
  const [localAmount, setLocalAmount] = useState(wateringAmount)

  const values = history.map((h) => h.soilMoisture)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length

  const getHoursSince = () => {
    const now = new Date()
    const diff = now.getTime() - lastWatering.getTime()
    return Math.floor(diff / (1000 * 60 * 60))
  }

  const handleAmountChange = (delta: number) => {
    const newAmount = Math.max(100, Math.min(2000, localAmount + delta))
    setLocalAmount(newAmount)
    onWateringAmountChange?.(newAmount)
  }

  const getTankStatus = () => {
    if (waterTankLevel < 25) return { color: "text-red-500", bg: "bg-red-500" }
    if (waterTankLevel < 50) return { color: "text-yellow-500", bg: "bg-yellow-500" }
    return { color: "text-grow-green", bg: "bg-grow-green" }
  }

  const tankStatus = getTankStatus()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Substratfeuchte</DialogTitle>
        </DialogHeader>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-violet-400">
            {currentMoisture}
          </span>
          <span className="text-lg text-muted-foreground">%</span>
          <span className="ml-2 text-sm text-muted-foreground">
            vor {getHoursSince()}h gegossen
          </span>
        </div>

        <p className="text-sm text-muted-foreground">Optimal: 50-70%</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary p-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="font-semibold text-foreground">{min.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg</p>
            <p className="font-semibold text-foreground">{avg.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="font-semibold text-foreground">{max.toFixed(0)}%</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="gradient-substrate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
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
                domain={[0, 100]}
                tick={{ fill: "#888", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={30}
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
                dataKey="soilMoisture"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#gradient-substrate)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Water Tank Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className={`h-4 w-4 ${tankStatus.color}`} />
              <span className="text-sm font-medium text-foreground">Wassertank</span>
            </div>
            <span className={`text-lg font-bold ${tankStatus.color}`}>{waterTankLevel}%</span>
          </div>
          
          {/* Tank Level Bar */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div 
              className={`h-full ${tankStatus.bg} transition-all`}
              style={{ width: `${waterTankLevel}%` }}
            />
          </div>

          {/* Fill Tank Button */}
          <button
            onClick={onFillTank}
            className="w-full rounded-lg bg-blue-500/20 py-2.5 text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/30 active:scale-98"
          >
            Tank auffüllen
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Watering Amount */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-foreground">Giessmenge</span>
          
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleAmountChange(-100)}
              className="rounded-full bg-secondary p-2 transition-all hover:bg-secondary/80 active:scale-95"
            >
              <Minus className="h-5 w-5 text-foreground" />
            </button>
            
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{localAmount}</span>
              <span className="text-sm text-muted-foreground">ml</span>
            </div>
            
            <button
              onClick={() => handleAmountChange(100)}
              className="rounded-full bg-secondary p-2 transition-all hover:bg-secondary/80 active:scale-95"
            >
              <Plus className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
