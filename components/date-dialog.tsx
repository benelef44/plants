"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Leaf, Flower2 } from "lucide-react"

interface DateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phase: "vegie" | "bloom"
  daysSinceStart: number
  bloomStartDate?: Date
  harvestDate: Date
  onBloomDateChange?: (date: Date) => void
  onHarvestDateChange?: (date: Date) => void
}

export function DateDialog({
  open,
  onOpenChange,
  phase,
  daysSinceStart,
  bloomStartDate,
  harvestDate,
  onBloomDateChange,
  onHarvestDateChange,
}: DateDialogProps) {
  const [editingBloom, setEditingBloom] = useState(false)
  const [editingHarvest, setEditingHarvest] = useState(false)
  const [bloomInput, setBloomInput] = useState("")
  const [harvestInput, setHarvestInput] = useState("")

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const getDaysUntil = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const handleBloomSave = () => {
    if (bloomInput && onBloomDateChange) {
      onBloomDateChange(new Date(bloomInput))
    }
    setEditingBloom(false)
  }

  const handleHarvestSave = () => {
    if (harvestInput && onHarvestDateChange) {
      onHarvestDateChange(new Date(harvestInput))
    }
    setEditingHarvest(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] rounded-2xl border-border bg-card sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="rounded-lg bg-secondary p-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            Zeitplan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Day */}
          <div className="rounded-lg bg-secondary p-4 text-center">
            <span className="text-xs text-muted-foreground">Aktueller Tag</span>
            <p className="text-3xl font-bold text-foreground">Tag {daysSinceStart}</p>
          </div>

          {/* Bloom Start Date */}
          {phase === "vegie" && bloomStartDate && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flower2 className="h-4 w-4 text-grow-bloom" />
                <span>Bloom Start</span>
              </div>
              {editingBloom ? (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={bloomInput || formatDateForInput(bloomStartDate)}
                    onChange={(e) => setBloomInput(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <button
                    onClick={handleBloomSave}
                    className="rounded-lg bg-grow-bloom px-3 py-2 text-sm font-medium text-white"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingBloom(true)}
                  className="flex w-full items-center justify-between rounded-lg bg-secondary p-3 transition-colors hover:bg-secondary/80"
                >
                  <span className="text-foreground">{formatDate(bloomStartDate)}</span>
                  <span className="text-sm text-grow-bloom">
                    in {getDaysUntil(bloomStartDate)} Tagen
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Bloom Start Date (for bloom phase - past) */}
          {phase === "bloom" && bloomStartDate && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flower2 className="h-4 w-4 text-grow-bloom" />
                <span>Bloom seit</span>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <span className="text-foreground">{formatDate(bloomStartDate)}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  (vor {Math.abs(getDaysUntil(bloomStartDate))} Tagen)
                </span>
              </div>
            </div>
          )}

          {/* Harvest Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4 text-grow-green" />
              <span>Erntezeitpunkt</span>
            </div>
            {editingHarvest ? (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={harvestInput || formatDateForInput(harvestDate)}
                  onChange={(e) => setHarvestInput(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <button
                  onClick={handleHarvestSave}
                  className="rounded-lg bg-grow-green px-3 py-2 text-sm font-medium text-white"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingHarvest(true)}
                className="flex w-full items-center justify-between rounded-lg bg-secondary p-3 transition-colors hover:bg-secondary/80"
              >
                <span className="text-foreground">{formatDate(harvestDate)}</span>
                <span className="text-sm text-grow-green">
                  in {getDaysUntil(harvestDate)} Tagen
                </span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
