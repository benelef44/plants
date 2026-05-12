"use client"

import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Gauge,
  Waves,
  Calendar,
  Clock,
} from "lucide-react"
import type { GrowBoxData } from "@/lib/growbox-types"
import { MetricCard } from "./metric-card"
import { VPDChart } from "./vpd-chart"
import { HistoryChart } from "./history-chart"
import { QuickActions } from "./quick-actions"
import { AlertList } from "./alert-list"

interface GrowBoxPanelProps {
  data: GrowBoxData
  onFanToggle: () => void
  onLightToggle: () => void
}

export function GrowBoxPanel({ data, onFanToggle, onLightToggle }: GrowBoxPanelProps) {
  const phaseColor = data.phase === "vegie" ? "text-grow-green" : "text-grow-bloom"
  const phaseBg = data.phase === "vegie" ? "bg-grow-green/10" : "bg-grow-bloom/10"
  const phaseBorder = data.phase === "vegie" ? "border-grow-green/30" : "border-grow-bloom/30"

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
  }

  const getTempStatus = (temp: number): "normal" | "warning" | "danger" | "good" => {
    if (temp < 18 || temp > 30) return "danger"
    if (temp < 20 || temp > 28) return "warning"
    return "good"
  }

  const getHumidityStatus = (humidity: number, phase: string): "normal" | "warning" | "danger" | "good" => {
    if (phase === "vegie") {
      if (humidity < 50 || humidity > 80) return "warning"
      return "good"
    }
    if (humidity < 40 || humidity > 60) return "warning"
    return "good"
  }

  const getWaterStatus = (level: number): "normal" | "warning" | "danger" | "good" => {
    if (level < 20) return "danger"
    if (level < 40) return "warning"
    return "good"
  }

  return (
    <div className={`flex flex-col gap-4 rounded-2xl border-2 p-4 sm:p-6 ${phaseBorder} ${phaseBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-full ${phaseBg} p-2`}>
            {data.phase === "vegie" ? (
              <Sun className={`h-6 w-6 ${phaseColor}`} />
            ) : (
              <Sun className={`h-6 w-6 ${phaseColor}`} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{data.name}</h2>
            <p className={`text-sm font-medium ${phaseColor}`}>
              {data.phase === "vegie" ? "Vegetationsphase" : "Bluetephase"} - Tag {data.daysSinceStart}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{data.lightCycle}</span>
        </div>
      </div>

      {/* Alerts */}
      <AlertList alerts={data.alerts} />

      {/* Quick Actions */}
      <QuickActions
        fanOn={data.fanOn}
        lightOn={data.lightOn}
        onFanToggle={onFanToggle}
        onLightToggle={onLightToggle}
      />

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          icon={<Thermometer className="h-4 w-4" />}
          label="Temperatur"
          value={data.temperature}
          unit="°C"
          status={getTempStatus(data.temperature)}
          subValue="Optimal: 22-26°C"
        />
        <MetricCard
          icon={<Droplets className="h-4 w-4" />}
          label="Luftfeuchtigkeit"
          value={data.humidity}
          unit="%"
          status={getHumidityStatus(data.humidity, data.phase)}
          subValue={data.phase === "vegie" ? "Optimal: 60-70%" : "Optimal: 45-55%"}
        />
        <MetricCard
          icon={<Wind className="h-4 w-4" />}
          label="CO2"
          value={data.co2}
          unit="ppm"
          status={data.co2 > 800 ? "good" : "warning"}
          subValue="Optimal: 800-1200 ppm"
        />
        <MetricCard
          icon={<Waves className="h-4 w-4" />}
          label="Substratfeuchte"
          value={data.soilMoisture}
          unit="%"
          status={data.soilMoisture > 40 ? "good" : "warning"}
        />
      </div>

      {/* VPD Chart */}
      <VPDChart vpd={data.vpd} phase={data.phase} />

      {/* Light & Water Info */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Gauge className="h-4 w-4" />}
          label="PPFD"
          value={data.ppfd}
          unit="umol/m2/s"
          subValue={`DLI: ${data.dli} mol/m2/d`}
        />
        <MetricCard
          icon={<Droplets className="h-4 w-4" />}
          label="Wassertank"
          value={data.waterTankLevel}
          unit="%"
          status={getWaterStatus(data.waterTankLevel)}
        />
      </div>

      {/* Watering Info */}
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Letzte Bewaesserung:</span>
          <span className="text-sm font-medium text-foreground">{formatTime(data.lastWatering)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-grow-green" />
          <span className="text-sm text-muted-foreground">Naechste:</span>
          <span className="text-sm font-medium text-grow-green">{formatTime(data.nextWatering)}</span>
        </div>
      </div>

      {/* History Chart */}
      <HistoryChart data={data.history} title={data.name} />
    </div>
  )
}
