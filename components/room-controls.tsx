"use client"

import { useState } from "react"
import { Flame, Snowflake, Thermometer, Droplets, Wind } from "lucide-react"
import type { RoomData } from "@/lib/growbox-types"
import { DeviceDialog } from "./device-dialog"
import { RoomMetricDialog } from "./room-metric-dialog"

interface RoomControlsProps {
  data: RoomData
  onHeatingChange: (on: boolean) => void
  onHeatingTempChange: (temp: number) => void
  onAcChange: (on: boolean) => void
  onAcTempChange: (temp: number) => void
}

type DeviceType = "heating" | "ac" | null
type RoomMetricType = "temperature" | "humidity" | "co2" | null

export function RoomControls({
  data,
  onHeatingChange,
  onHeatingTempChange,
  onAcChange,
  onAcTempChange,
}: RoomControlsProps) {
  const [openDevice, setOpenDevice] = useState<DeviceType>(null)
  const [openMetric, setOpenMetric] = useState<RoomMetricType>(null)

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Room Values - clickable */}
        <button 
          onClick={() => setOpenMetric("temperature")}
          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80 active:opacity-60"
        >
          <Thermometer className="h-3 w-3 text-red-400" />
          <span className="text-foreground">{data.roomTemp.toFixed(1)}°</span>
        </button>
        <button 
          onClick={() => setOpenMetric("humidity")}
          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80 active:opacity-60"
        >
          <Droplets className="h-3 w-3 text-blue-400" />
          <span className="text-foreground">{data.roomHumidity.toFixed(0)}%</span>
        </button>
        <button 
          onClick={() => setOpenMetric("co2")}
          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80 active:opacity-60"
        >
          <Wind className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground">{data.co2}</span>
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Heating Button */}
        <button
          onClick={() => setOpenDevice("heating")}
          className={`rounded-md px-2.5 py-1.5 transition-all active:scale-95 ${
            data.heatingOn ? "bg-orange-500/20 text-orange-500" : "bg-secondary text-muted-foreground"
          }`}
        >
          <Flame className="h-4 w-4" />
        </button>

        {/* AC Button */}
        <button
          onClick={() => setOpenDevice("ac")}
          className={`rounded-md px-2.5 py-1.5 transition-all active:scale-95 ${
            data.acOn ? "bg-cyan-400/20 text-cyan-400" : "bg-secondary text-muted-foreground"
          }`}
        >
          <Snowflake className="h-4 w-4" />
        </button>
      </div>

      {/* Device Dialogs */}
      <DeviceDialog
        open={openDevice === "heating"}
        onOpenChange={(open) => !open && setOpenDevice(null)}
        deviceType="heating"
        value={data.heatingOn}
        onValueChange={(v) => onHeatingChange(v as boolean)}
        targetTemp={data.heatingTemp}
        onTargetTempChange={onHeatingTempChange}
      />
      <DeviceDialog
        open={openDevice === "ac"}
        onOpenChange={(open) => !open && setOpenDevice(null)}
        deviceType="ac"
        value={data.acOn}
        onValueChange={(v) => onAcChange(v as boolean)}
        targetTemp={data.acTemp}
        onTargetTempChange={onAcTempChange}
      />

      {/* Room Metric Dialogs */}
      <RoomMetricDialog
        open={openMetric === "temperature"}
        onOpenChange={(open) => !open && setOpenMetric(null)}
        type="temperature"
        currentValue={data.roomTemp}
        history={data.history.map(h => ({ time: h.time, value: h.temperature }))}
      />
      <RoomMetricDialog
        open={openMetric === "humidity"}
        onOpenChange={(open) => !open && setOpenMetric(null)}
        type="humidity"
        currentValue={data.roomHumidity}
        history={data.history.map(h => ({ time: h.time, value: h.humidity }))}
      />
      <RoomMetricDialog
        open={openMetric === "co2"}
        onOpenChange={(open) => !open && setOpenMetric(null)}
        type="co2"
        currentValue={data.co2}
        history={data.history.map(h => ({ time: h.time, value: h.co2 }))}
      />
    </>
  )
}
