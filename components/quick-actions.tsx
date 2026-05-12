"use client"

import { Fan, Lightbulb, Power } from "lucide-react"

interface QuickActionsProps {
  fanOn: boolean
  lightOn: boolean
  onFanToggle: () => void
  onLightToggle: () => void
}

export function QuickActions({ fanOn, lightOn, onFanToggle, onLightToggle }: QuickActionsProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onFanToggle}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all active:scale-95 ${
          fanOn
            ? "border-grow-green bg-grow-green/10 text-grow-green"
            : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
        }`}
      >
        <Fan className={`h-5 w-5 ${fanOn ? "animate-spin" : ""}`} style={{ animationDuration: "2s" }} />
        <span className="text-sm font-medium">Luefter</span>
        <Power className="ml-auto h-4 w-4" />
      </button>

      <button
        onClick={onLightToggle}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all active:scale-95 ${
          lightOn
            ? "border-grow-warning bg-grow-warning/10 text-grow-warning"
            : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
        }`}
      >
        <Lightbulb className={`h-5 w-5 ${lightOn ? "fill-current" : ""}`} />
        <span className="text-sm font-medium">Licht</span>
        <Power className="ml-auto h-4 w-4" />
      </button>
    </div>
  )
}
