"use client"

import { AlertTriangle, Info, XCircle } from "lucide-react"
import type { Alert } from "@/lib/growbox-types"

interface AlertListProps {
  alerts: Alert[]
}

export function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) return null

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-grow-warning" />
      case "danger":
        return <XCircle className="h-4 w-4 text-grow-danger" />
      case "info":
        return <Info className="h-4 w-4 text-grow-info" />
    }
  }

  const getAlertStyle = (type: Alert["type"]) => {
    switch (type) {
      case "warning":
        return "border-grow-warning/30 bg-grow-warning/5"
      case "danger":
        return "border-grow-danger/30 bg-grow-danger/5"
      case "info":
        return "border-grow-info/30 bg-grow-info/5"
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center gap-3 rounded-lg border p-3 ${getAlertStyle(alert.type)}`}
        >
          {getAlertIcon(alert.type)}
          <span className="text-sm text-foreground">{alert.message}</span>
        </div>
      ))}
    </div>
  )
}
