"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Fan, Lightbulb, Flame, Snowflake, Droplets } from "lucide-react"

interface DeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceType: "fan" | "light" | "heating" | "ac"
  value: number | boolean
  onValueChange: (value: number | boolean) => void
  targetTemp?: number
  onTargetTempChange?: (temp: number) => void
  targetHumidity?: number
  onTargetHumidityChange?: (humidity: number) => void
}

export function DeviceDialog({
  open,
  onOpenChange,
  deviceType,
  value,
  onValueChange,
  targetTemp,
  onTargetTempChange,
  targetHumidity,
  onTargetHumidityChange,
}: DeviceDialogProps) {
  const config = {
    fan: {
      title: "Luefter Steuerung",
      icon: Fan,
      color: "text-grow-green",
      bgColor: "bg-grow-green/20",
    },
    light: {
      title: "Licht Info",
      icon: Lightbulb,
      color: "text-grow-warning",
      bgColor: "bg-grow-warning/20",
    },
    heating: {
      title: "Heizung",
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/20",
    },
    ac: {
      title: "Klimaanlage",
      icon: Snowflake,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/20",
    },
  }

  const { title, icon: Icon, color, bgColor } = config[deviceType]
  const isPercentDevice = deviceType === "fan"
  const isTempDevice = deviceType === "heating" || deviceType === "ac"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] rounded-2xl border-border bg-card sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className={`rounded-lg p-2 ${bgColor}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Percent Slider for Fan + Target Humidity */}
          {isPercentDevice && (
            <div className="space-y-6">
              {/* Speed */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Geschwindigkeit</span>
                  <span className={`text-2xl font-bold ${color}`}>
                    {typeof value === "number" ? value : 0}%
                  </span>
                </div>
                <Slider
                  value={[typeof value === "number" ? value : 0]}
                  onValueChange={([v]) => onValueChange(v)}
                  max={100}
                  step={5}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Aus</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Target Humidity */}
              {targetHumidity !== undefined && onTargetHumidityChange && (
                <div className="space-y-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-grow-info" />
                      <span className="text-sm text-muted-foreground">Ziel RLF</span>
                    </div>
                    <span className="text-xl font-bold text-grow-info">
                      {targetHumidity}%
                    </span>
                  </div>
                  <Slider
                    value={[targetHumidity]}
                    onValueChange={([v]) => onTargetHumidityChange(v)}
                    min={30}
                    max={80}
                    step={5}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>30%</span>
                    <span>55%</span>
                    <span>80%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Temperature control for Heating/AC */}
          {isTempDevice && (
            <div className="space-y-6">
              {/* On/Off Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <button
                  onClick={() => onValueChange(!value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                    value ? bgColor + " " + color : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {value ? "Ein" : "Aus"}
                </button>
              </div>

              {/* Target Temperature */}
              {value && targetTemp !== undefined && onTargetTempChange && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Zieltemperatur</span>
                    <span className={`text-2xl font-bold ${color}`}>{targetTemp}°C</span>
                  </div>
                  <Slider
                    value={[targetTemp]}
                    onValueChange={([v]) => onTargetTempChange(v)}
                    min={deviceType === "heating" ? 15 : 16}
                    max={deviceType === "heating" ? 28 : 30}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{deviceType === "heating" ? "15°C" : "16°C"}</span>
                    <span>{deviceType === "heating" ? "28°C" : "30°C"}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
