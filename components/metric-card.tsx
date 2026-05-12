"use client"

import type { ReactNode } from "react"

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string | number
  unit?: string
  status?: "normal" | "warning" | "danger" | "good"
  subValue?: string
}

export function MetricCard({ icon, label, value, unit, status = "normal", subValue }: MetricCardProps) {
  const statusColors = {
    normal: "border-border",
    warning: "border-grow-warning",
    danger: "border-grow-danger",
    good: "border-grow-green",
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border-2 bg-card p-4 transition-all hover:bg-secondary/50 ${statusColors[status]}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
        {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
      </div>
      {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
    </div>
  )
}
