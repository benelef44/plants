"use client"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Activity } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"

interface VPDDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentVPD: number
  phase: "vegie" | "bloom"
  week: number
  history: { time: string; vpd: number }[]
}

// Target VPD ranges per week
const VPD_TARGETS = {
  vegie: [
    { week: 1, min: 0.4, max: 0.8, target: 0.6 },
    { week: 2, min: 0.6, max: 1.0, target: 0.8 },
    { week: 3, min: 0.8, max: 1.1, target: 0.95 },
    { week: 4, min: 0.9, max: 1.2, target: 1.05 },
  ],
  bloom: [
    { week: 1, min: 1.0, max: 1.3, target: 1.15 },
    { week: 2, min: 1.0, max: 1.4, target: 1.2 },
    { week: 3, min: 1.1, max: 1.4, target: 1.25 },
    { week: 4, min: 1.1, max: 1.5, target: 1.3 },
    { week: 5, min: 1.2, max: 1.5, target: 1.35 },
    { week: 6, min: 1.2, max: 1.5, target: 1.35 },
    { week: 7, min: 1.2, max: 1.6, target: 1.4 },
    { week: 8, min: 1.2, max: 1.6, target: 1.4 },
  ],
}

export function VPDDialog({
  open,
  onOpenChange,
  currentVPD,
  phase,
  week,
  history,
}: VPDDialogProps) {
  const targets = VPD_TARGETS[phase]
  const weekIndex = Math.min(week - 1, targets.length - 1)
  const currentTarget = targets[Math.max(0, weekIndex)]

  const getVPDStatus = () => {
    if (currentVPD < currentTarget.min) return { text: "Zu niedrig", color: "text-blue-400" }
    if (currentVPD > currentTarget.max) return { text: "Zu hoch", color: "text-red-400" }
    return { text: "Optimal", color: "text-grow-green" }
  }

  const status = getVPDStatus()

  // Calculate min/max/avg from history
  const vpdValues = history.map(h => h.vpd)
  const minVPD = Math.min(...vpdValues)
  const maxVPD = Math.max(...vpdValues)
  const avgVPD = vpdValues.reduce((a, b) => a + b, 0) / vpdValues.length

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5 text-emerald-400" />
            VPD - {phase === "vegie" ? "Vegie" : "Bloom"} Woche {week}
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-6">
          {/* Current Value + Target */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-foreground">
                {currentVPD.toFixed(2)} <span className="text-lg text-muted-foreground">kPa</span>
              </div>
              <div className={`text-sm ${status.color}`}>{status.text}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Ziel Woche {week}</div>
              <div className="text-lg font-medium text-foreground">
                {currentTarget.min.toFixed(1)} - {currentTarget.max.toFixed(1)} kPa
              </div>
              <div className="text-xs text-muted-foreground">
                Optimal: {currentTarget.target.toFixed(2)} kPa
              </div>
            </div>
          </div>

          {/* VPD Chart */}
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="vpdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 2]}
                  ticks={[0, 0.5, 1, 1.5, 2]}
                />
                {/* Target range band */}
                <ReferenceLine 
                  y={currentTarget.min} 
                  stroke="#22c55e" 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.5}
                />
                <ReferenceLine 
                  y={currentTarget.max} 
                  stroke="#22c55e" 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.5}
                />
                <ReferenceLine 
                  y={currentTarget.target} 
                  stroke="#22c55e" 
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="vpd"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#vpdGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-secondary p-2.5 text-center">
              <div className="text-[10px] uppercase text-muted-foreground">Min</div>
              <div className="text-sm font-bold text-foreground">{minVPD.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-secondary p-2.5 text-center">
              <div className="text-[10px] uppercase text-muted-foreground">Avg</div>
              <div className="text-sm font-bold text-foreground">{avgVPD.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-secondary p-2.5 text-center">
              <div className="text-[10px] uppercase text-muted-foreground">Max</div>
              <div className="text-sm font-bold text-foreground">{maxVPD.toFixed(2)}</div>
            </div>
          </div>

          {/* Weekly VPD Targets Table */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">VPD Ziele pro Woche</div>
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {targets.slice(0, 8).map((t, i) => (
                <div 
                  key={i} 
                  className={`rounded p-1.5 text-center ${
                    i === weekIndex 
                      ? "bg-grow-green/20 text-grow-green ring-1 ring-grow-green" 
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <div className="font-medium">W{t.week}</div>
                  <div>{t.target.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
