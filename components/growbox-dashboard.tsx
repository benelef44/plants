"use client"

import { useState, useEffect, useCallback } from "react"
import { Cannabis, Loader2 } from "lucide-react"
import { type GrowBoxData, type RoomData } from "@/lib/growbox-types"
import { fetchHAData, fetchHARoomData } from "@/lib/ha-data"
import { CompactGrowBoxPanel } from "./compact-growbox-panel"
import { RoomControls } from "./room-controls"

export function GrowBoxDashboard() {
  const [data, setData] = useState<{ vegie: GrowBoxData; bloom: GrowBoxData } | null>(null)
  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshData = useCallback(async () => {
    try {
      const [boxData, room] = await Promise.all([fetchHAData(), fetchHARoomData()])
      setData(boxData)
      setRoomData(room)
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError("Verbindung zu Home Assistant fehlgeschlagen")
      console.error(e)
    }
  }, [])

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [refreshData])

  const setFanSpeed = (box: "vegie" | "bloom", speed: number) => {
    if (!data) return
    setData({
      ...data,
      [box]: { ...data[box], fanSpeed: speed },
    })
  }

  const setTargetHumidity = (box: "vegie" | "bloom", humidity: number) => {
    if (!data) return
    setData({
      ...data,
      [box]: { ...data[box], targetHumidity: humidity },
    })
  }

  const setBloomDate = (box: "vegie" | "bloom", date: Date) => {
    if (!data) return
    setData({
      ...data,
      [box]: { ...data[box], bloomStartDate: date },
    })
  }

  const setHarvestDate = (box: "vegie" | "bloom", date: Date) => {
    if (!data) return
    setData({
      ...data,
      [box]: { ...data[box], harvestDate: date },
    })
  }

  const setHeating = (on: boolean) => {
    if (!roomData) return
    setRoomData({ ...roomData, heatingOn: on })
  }

  const setHeatingTemp = (temp: number) => {
    if (!roomData) return
    setRoomData({ ...roomData, heatingTemp: temp })
  }

  const setAc = (on: boolean) => {
    if (!roomData) return
    setRoomData({ ...roomData, acOn: on })
  }

  const setAcTemp = (temp: number) => {
    if (!roomData) return
    setRoomData({ ...roomData, acTemp: temp })
  }

  if (!data || !roomData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Verbinde mit Home Assistant…</span>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2">
            <Cannabis className="h-5 w-5 text-grow-green" />
            <h1 className="text-sm font-bold text-foreground">GrowBox</h1>
          </div>
          
          <RoomControls
            data={roomData}
            onHeatingChange={setHeating}
            onHeatingTempChange={setHeatingTemp}
            onAcChange={setAc}
            onAcTempChange={setAcTemp}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-col gap-3 p-3">
        <CompactGrowBoxPanel
          data={data.vegie}
          onFanChange={(speed) => setFanSpeed("vegie", speed)}
          onTargetHumidityChange={(humidity) => setTargetHumidity("vegie", humidity)}
          onBloomDateChange={(date) => setBloomDate("vegie", date)}
          onHarvestDateChange={(date) => setHarvestDate("vegie", date)}
        />
        <CompactGrowBoxPanel
          data={data.bloom}
          onFanChange={(speed) => setFanSpeed("bloom", speed)}
          onTargetHumidityChange={(humidity) => setTargetHumidity("bloom", humidity)}
          onBloomDateChange={(date) => setBloomDate("bloom", date)}
          onHarvestDateChange={(date) => setHarvestDate("bloom", date)}
        />
      </main>

      {/* Footer */}
      <footer className="py-2 text-center text-[9px] text-muted-foreground">
        {lastUpdated
          ? `Live · Aktualisiert ${lastUpdated.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
          : "Verbinde…"}
      </footer>
    </div>
  )
}
