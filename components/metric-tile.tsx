"use client"

import type { ReactNode } from "react"

interface MetricTileProps {
  icon: ReactNode
  label: string
  value: number
  unit: string
  status?: "good" | "warning" | "danger" | "normal"
  onClick?: () => void
  compact?: boolean
}

export function MetricTile({ icon, label, value, unit, status = "normal", onClick, compact }: MetricTileProps) {
  const statusColors = {
    good: "border-grow-green/50 bg-grow-green/5",
    warning: "border-grow-warning/50 bg-grow-warning/5",
    danger: "border-grow-danger/50 bg-grow-danger/5",
    normal: "border-border bg-card",
  }

  const valueColors = {
    good: "text-grow-green",
    warning: "text-grow-warning",
    danger: "text-grow-danger",
    normal: "text-foreground",
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-xl border transition-all active:scale-95 ${statusColors[status]} ${onClick ? "cursor-pointer hover:border-primary/50" : ""} ${compact ? "p-1.5" : "p-3 gap-1"}`}
    >
      <div className="text-muted-foreground">{icon}</div>
      <span className={`font-bold ${valueColors[status]} ${compact ? "text-sm" : "text-xl"}`}>
        {value}
        <span className={`font-normal text-muted-foreground ${compact ? "text-[9px]" : "text-xs"}`}>{unit}</span>
      </span>
      <span className={`text-muted-foreground ${compact ? "text-[8px]" : "text-[10px]"}`}>{label}</span>
    </button>
  )
}
