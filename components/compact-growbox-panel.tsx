"use client"

import { useState } from "react"
import {
  Thermometer,
  Droplets,
  Sun,
  Waves,
  Fan,
  Zap,
  Calendar,
  Activity,
} from "lucide-react"
import type { GrowBoxData } from "@/lib/growbox-types"
import { MetricTile } from "./metric-tile"
import { MetricDialog } from "./metric-dialog"
import { DeviceDialog } from "./device-dialog"
import { MiniChart } from "./mini-chart"
import { LightDialog } from "./light-dialog"
import { DateDialog } from "./date-dialog"
import { SubstrateDialog } from "./substrate-dialog"
import { VPDDialog } from "./vpd-dialog"

interface CompactGrowBoxPanelProps {
  data: GrowBoxData
  onFanChange: (speed: number) => void
  onTargetHumidityChange: (humidity: number) => void
  onBloomDateChange?: (date: Date) => void
  onHarvestDateChange?: (date: Date) => void
  onWateringAmountChange?: (amount: number) => void
  onFillTank?: () => void
}

type MetricType = "temperature" | "humidity" | "dli" | "soilMoisture" | null

export function CompactGrowBoxPanel({ 
  data, 
  onFanChange, 
  onTargetHumidityChange,
  onBloomDateChange,
  onHarvestDateChange,
  onWateringAmountChange,
  onFillTank,
}: CompactGrowBoxPanelProps) {
  const [openMetric, setOpenMetric] = useState<MetricType>(null)
  const [openFan, setOpenFan] = useState(false)
  const [openLight, setOpenLight] = useState(false)
  const [openDateDialog, setOpenDateDialog] = useState(false)
  const [openSubstrate, setOpenSubstrate] = useState(false)
  const [openVPD, setOpenVPD] = useState(false)

  const phaseColor = data.phase === "vegie" ? "bg-grow-green" : "bg-grow-bloom"
  const phaseBorder = data.phase === "vegie" ? "border-grow-green/30" : "border-grow-bloom/30"

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

  const getSoilStatus = (moisture: number): "normal" | "warning" | "danger" | "good" => {
    if (moisture < 30) return "danger"
    if (moisture < 45) return "warning"
    return "good"
  }

  // Prepare chart data
  const tempChartData = data.history.slice(-12).map(h => ({ time: h.time, value: h.temperature }))
  const humidityChartData = data.history.slice(-12).map(h => ({ time: h.time, value: h.humidity }))

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
  }

  // Days until harvest/bloom
  const getDaysUntil = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Ordinal suffix
  const getOrdinal = (n: number) => {
    return n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"
  }

  // Hours since last watering
  const getHoursSinceWatering = () => {
    const now = new Date()
    const diff = now.getTime() - data.lastWatering.getTime()
    return Math.floor(diff / (1000 * 60 * 60))
  }

  // Current week
  const getCurrentWeek = () => Math.ceil(data.daysSinceStart / 7)

  return (
    <>
      <div className={`rounded-2xl border-2 ${phaseBorder} overflow-hidden bg-card`}>
        {/* Combined Header - Name, Week, Target Date, VPD */}
        <div className="flex w-full items-center justify-between border-b border-border px-3 py-2.5">
          <button
            onClick={() => setOpenDateDialog(true)}
            className="flex items-center gap-2 transition-colors hover:opacity-80 active:opacity-60"
          >
            <div className={`h-2.5 w-2.5 rounded-full ${phaseColor}`} />
            <h2 className="text-base font-bold text-foreground">{data.name}</h2>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs font-medium text-foreground">Woche {getCurrentWeek()}</span>
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {data.phase === "vegie" ? (
                <span className="font-medium text-grow-green">
                  {data.bloomStartDate!.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                </span>
              ) : (
                <span className="font-medium text-grow-bloom">
                  {data.harvestDate.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                </span>
              )}
            </div>
          </button>
          
          {/* VPD Button */}
          <button
            onClick={() => setOpenVPD(true)}
            className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs transition-all hover:bg-secondary/80 active:scale-95"
          >
            <Activity className="h-3 w-3 text-emerald-400" />
            <span className="font-medium text-foreground">{data.vpd.toFixed(2)}</span>
          </button>
        </div>

        {/* Metrics Grid - 4 columns */}
        <div className="grid grid-cols-4 gap-1 p-1.5">
          <MetricTile
            icon={<Thermometer className="h-3 w-3" />}
            label="Temp"
            value={data.temperature}
            unit="°"
            status={getTempStatus(data.temperature)}
            onClick={() => setOpenMetric("temperature")}
            compact
          />
          <MetricTile
            icon={<Droplets className="h-3 w-3" />}
            label="RLF"
            value={data.humidity}
            unit="%"
            status={getHumidityStatus(data.humidity, data.phase)}
            onClick={() => setOpenMetric("humidity")}
            compact
          />
          <MetricTile
            icon={<Sun className="h-3 w-3" />}
            label="DLI"
            value={data.dli}
            unit=""
            status="normal"
            onClick={() => setOpenMetric("dli")}
            compact
          />
          <MetricTile
            icon={<Waves className="h-3 w-3" />}
            label={`${getHoursSinceWatering()}h`}
            value={data.soilMoisture}
            unit="%"
            status={getSoilStatus(data.soilMoisture)}
            onClick={() => setOpenSubstrate(true)}
            compact
          />
        </div>

        {/* Mini Charts Row - Temp in red, RLF in blue */}
        <div className="grid grid-cols-2 gap-3 border-t border-border px-2 py-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Temp 12h</span>
              <span className="font-medium text-foreground">{data.temperature}°C</span>
            </div>
            <MiniChart data={tempChartData} color="#f87171" height={56} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">RLF 12h</span>
              <span className="font-medium text-foreground">{data.humidity}%</span>
            </div>
            <MiniChart data={humidityChartData} color="#38bdf8" height={56} />
          </div>
        </div>

        {/* Light Info (clickable) + Fan Control */}
        <div className="flex gap-1.5 border-t border-border p-1.5">
          {/* Light Info (Watt + PPFD) - clickable */}
          <button
            onClick={() => setOpenLight(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary py-1.5 transition-all hover:bg-secondary/80 active:scale-98"
          >
            <div className="flex items-center gap-1">
              <Zap className={`h-3 w-3 ${data.lightOn ? "text-grow-warning" : "text-muted-foreground"}`} />
              <span className={`text-xs font-medium ${data.lightOn ? "text-foreground" : "text-muted-foreground"}`}>
                {data.lightOn ? `${data.wattage}W` : "Aus"}
              </span>
            </div>
            {data.lightOn && (
              <>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1">
                  <Sun className="h-3 w-3 text-grow-warning" />
                  <span className="text-xs font-medium text-foreground">{data.ppfd}</span>
                  <span className="text-[8px] text-muted-foreground">PPFD</span>
                </div>
              </>
            )}
          </button>

          {/* Fan Button */}
          <button
            onClick={() => setOpenFan(true)}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              data.fanSpeed > 0
                ? "bg-grow-green/20 text-grow-green"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            <Fan className={`h-3.5 w-3.5 ${data.fanSpeed > 0 ? "animate-spin" : ""}`} style={{ animationDuration: `${2 - data.fanSpeed / 100}s` }} />
            <span>{data.fanSpeed}%</span>
          </button>
        </div>
      </div>

      {/* Metric Dialogs */}
      <MetricDialog
        open={openMetric === "temperature"}
        onOpenChange={(open) => !open && setOpenMetric(null)}
        title="Temperatur"
        currentValue={data.temperature}
        unit="°C"
        dataKey="temperature"
        history={data.history}
        color="#f87171"
        optimalRange="Optimal: 22-26°C"
      />
      <MetricDialog
        open={openMetric === "humidity"}
        onOpenChange={(open) => !open && setOpenMetric(null)}
        title="Luftfeuchtigkeit"
        currentValue={data.humidity}
        unit="%"
        dataKey="humidity"
        history={data.history}
        color="#38bdf8"
        optimalRange={data.phase === "vegie" ? "Optimal: 60-70%" : "Optimal: 45-55%"}
      />
      <MetricDialog
        open={openMetric === "dli"}
        onOpenChange={(open) => !open && setOpenMetric(null)}
        title="DLI (Daily Light Integral)"
        currentValue={data.dli}
        unit="mol/m²/d"
        dataKey="dli"
        history={data.history}
        color="#fbbf24"
        optimalRange={data.phase === "vegie" ? "Optimal: 25-35" : "Optimal: 30-45"}
      />
      

      {/* Fan Dialog with Target Humidity */}
      <DeviceDialog
        open={openFan}
        onOpenChange={setOpenFan}
        deviceType="fan"
        value={data.fanSpeed}
        onValueChange={(v) => onFanChange(v as number)}
        targetHumidity={data.targetHumidity}
        onTargetHumidityChange={onTargetHumidityChange}
      />

      {/* Light Dialog */}
      <LightDialog
        open={openLight}
        onOpenChange={setOpenLight}
        lightOn={data.lightOn}
        wattage={data.wattage}
        ppfd={data.ppfd}
        dli={data.dli}
        lightCycle={data.lightCycle}
      />

      {/* Date Dialog */}
      <DateDialog
        open={openDateDialog}
        onOpenChange={setOpenDateDialog}
        phase={data.phase}
        daysSinceStart={data.daysSinceStart}
        bloomStartDate={data.bloomStartDate}
        harvestDate={data.harvestDate}
        onBloomDateChange={onBloomDateChange}
        onHarvestDateChange={onHarvestDateChange}
      />

      {/* Substrate Dialog */}
      <SubstrateDialog
        open={openSubstrate}
        onOpenChange={setOpenSubstrate}
        currentMoisture={data.soilMoisture}
        waterTankLevel={data.waterTankLevel}
        lastWatering={data.lastWatering}
        wateringAmount={500}
        history={data.history}
        onWateringAmountChange={onWateringAmountChange}
        onFillTank={onFillTank}
      />

      {/* VPD Dialog */}
      <VPDDialog
        open={openVPD}
        onOpenChange={setOpenVPD}
        currentVPD={data.vpd}
        phase={data.phase}
        week={getCurrentWeek()}
        history={data.history.map(h => ({ time: h.time, vpd: h.vpd }))}
      />
    </>
  )
}
