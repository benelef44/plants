"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sun, Zap, Clock, BarChart3 } from "lucide-react"

interface LightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lightOn: boolean
  wattage: number
  ppfd: number
  dli: number
  lightCycle: string
}

export function LightDialog({
  open,
  onOpenChange,
  lightOn,
  wattage,
  ppfd,
  dli,
  lightCycle,
}: LightDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] rounded-2xl border-border bg-card sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className={`rounded-lg p-2 ${lightOn ? "bg-grow-warning/20" : "bg-secondary"}`}>
              <Sun className={`h-5 w-5 ${lightOn ? "text-grow-warning" : "text-muted-foreground"}`} />
            </div>
            Licht Info
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status */}
          <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={`text-sm font-medium ${lightOn ? "text-grow-warning" : "text-muted-foreground"}`}>
              {lightOn ? "An" : "Aus"}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Wattage */}
            <div className="rounded-lg bg-secondary p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-xs">Leistung</span>
              </div>
              <p className={`mt-1 text-xl font-bold ${lightOn ? "text-foreground" : "text-muted-foreground"}`}>
                {lightOn ? wattage : 0}
                <span className="text-xs font-normal text-muted-foreground">W</span>
              </p>
            </div>

            {/* PPFD */}
            <div className="rounded-lg bg-secondary p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Sun className="h-3.5 w-3.5" />
                <span className="text-xs">PPFD</span>
              </div>
              <p className={`mt-1 text-xl font-bold ${lightOn ? "text-grow-warning" : "text-muted-foreground"}`}>
                {lightOn ? ppfd : 0}
                <span className="text-xs font-normal text-muted-foreground">µmol</span>
              </p>
            </div>

            {/* DLI */}
            <div className="rounded-lg bg-secondary p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="text-xs">DLI</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {dli}
                <span className="text-xs font-normal text-muted-foreground">mol/m²</span>
              </p>
            </div>

            {/* Light Cycle */}
            <div className="rounded-lg bg-secondary p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">Zyklus</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {lightCycle}
              </p>
            </div>
          </div>

          {/* Info Text */}
          <p className="text-center text-[10px] text-muted-foreground">
            PPFD = Photosynthetic Photon Flux Density
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
