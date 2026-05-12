"use client"

import { getVPDStatus } from "@/lib/growbox-types"

interface VPDChartProps {
  vpd: number
  phase: "vegie" | "bloom"
}

export function VPDChart({ vpd, phase }: VPDChartProps) {
  const { status, color } = getVPDStatus(vpd)
  
  const optimalRange = phase === "vegie" 
    ? { min: 0.8, max: 1.2, label: "Optimal Vegie: 0.8-1.2" }
    : { min: 1.2, max: 1.6, label: "Optimal Bloom: 1.2-1.6" }

  const percentage = Math.min(100, (vpd / 2) * 100)
  const optimalStart = (optimalRange.min / 2) * 100
  const optimalEnd = (optimalRange.max / 2) * 100

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">VPD (Vapor Pressure Deficit)</span>
        <span className={`text-sm font-semibold ${color}`}>{status}</span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight text-foreground">{vpd}</span>
        <span className="text-lg text-muted-foreground">kPa</span>
      </div>

      <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="absolute h-full bg-gradient-to-r from-grow-info via-grow-green to-grow-danger opacity-30"
          style={{ width: "100%" }}
        />
        <div
          className="absolute h-full bg-grow-green/50"
          style={{ left: `${optimalStart}%`, width: `${optimalEnd - optimalStart}%` }}
        />
        <div
          className="absolute top-0 h-full w-1 rounded-full bg-foreground shadow-lg transition-all"
          style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0.0</span>
        <span className="text-grow-green">{optimalRange.label}</span>
        <span>2.0+</span>
      </div>
    </div>
  )
}
