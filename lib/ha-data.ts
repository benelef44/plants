/**
 * Home Assistant Live Data
 *
 * Alle Requests gehen über /api/ha (Vercel-Proxy).
 * Kein direkter Browser→HA-Zugriff, kein CORS, kein Token im Frontend.
 */

import {
  calculateVPD,
  type GrowBoxData,
  type RoomData,
  type HistoryDataPoint,
  type RoomHistoryPoint,
} from "./growbox-types"

// ── Proxy-Helpers ─────────────────────────────────────────────────────────────

async function getStates(
  ids: string[]
): Promise<Record<string, { state: string; attributes: Record<string, unknown> }>> {
  try {
    const res = await fetch(`/api/ha?entities=${ids.join(",")}`, {
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  } catch {
    return Object.fromEntries(ids.map((id) => [id, { state: "unavailable", attributes: {} }]))
  }
}

async function getAttributes(id: string): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`/api/ha?entity=${id}`, { cache: "no-store" })
    if (!res.ok) return {}
    const json = await res.json()
    return json.attributes ?? {}
  } catch {
    return {}
  }
}

async function fetchHistory(
  entityId: string,
  valueKey: keyof HistoryDataPoint
): Promise<Partial<HistoryDataPoint>[]> {
  try {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const res = await fetch(`/api/ha?history=${entityId}&from=${encodeURIComponent(from)}`, {
      cache: "no-store",
    })
    if (!res.ok) return []
    const series: { state: string; last_changed: string }[] = await res.json()

    const buckets: Record<string, number[]> = {}
    for (const point of series) {
      const v = parseFloat(point.state)
      if (isNaN(v)) continue
      const hour = new Date(point.last_changed).getHours()
      const key = `${hour.toString().padStart(2, "0")}:00`
      buckets[key] = buckets[key] ?? []
      buckets[key].push(v)
    }

    return Object.entries(buckets).map(([time, vals]) => ({
      time,
      [valueKey]: parseFloat(
        (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
      ),
    }))
  } catch {
    return []
  }
}

// ── Merge helpers ─────────────────────────────────────────────────────────────

function mergeHistory(
  ...arrays: Partial<HistoryDataPoint>[][]
): HistoryDataPoint[] {
  const map: Record<string, Partial<HistoryDataPoint>> = {}
  for (const arr of arrays) {
    for (const point of arr) {
      if (!point.time) continue
      map[point.time] = { ...map[point.time], ...point }
    }
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, p]) => ({
      time,
      temperature: p.temperature ?? 0,
      humidity: p.humidity ?? 0,
      vpd: p.vpd ?? calculateVPD(p.temperature ?? 0, p.humidity ?? 0),
      co2: p.co2 ?? 0,
      dli: p.dli ?? 0,
      soilMoisture: p.soilMoisture ?? 0,
    }))
}

function mergeRoomHistory(
  ...arrays: Partial<RoomHistoryPoint>[][]
): RoomHistoryPoint[] {
  const map: Record<string, Partial<RoomHistoryPoint>> = {}
  for (const arr of arrays) {
    for (const point of arr) {
      if (!point.time) continue
      map[point.time] = { ...map[point.time], ...point }
    }
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, p]) => ({
      time,
      temperature: p.temperature ?? 0,
      humidity: p.humidity ?? 0,
      co2: p.co2 ?? 0,
    }))
}

// ── Parsers ───────────────────────────────────────────────────────────────────

function num(val: string | undefined, fallback = 0): number {
  if (!val || val === "unavailable" || val === "unknown") return fallback
  const n = parseFloat(val)
  return isNaN(n) ? fallback : n
}

function numOrNull(val: string | undefined): number | null {
  if (!val || val === "unavailable" || val === "unknown") return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function parseDate(raw: string | undefined, fallback: Date): Date {
  if (!raw || raw === "unavailable" || raw === "unknown") return fallback
  const d = new Date(raw)
  return isNaN(d.getTime()) ? fallback : d
}

function parseHarvestDate(raw: string | undefined, fallback: Date): Date {
  if (!raw || raw === "unavailable") return fallback
  const iso = new Date(raw)
  if (!isNaN(iso.getTime())) return iso
  const match = raw.match(/(\d+)\.\s*(\w+)/)
  if (match) {
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      Januar: 0, Februar: 1, März: 2, April: 3, Mai: 4, Juni: 5,
      Juli: 6, August: 7, September: 8, Oktober: 9, November: 10, Dezember: 11,
    }
    const month = months[match[2]]
    if (month !== undefined) {
      return new Date(new Date().getFullYear(), month, parseInt(match[1]))
    }
  }
  return fallback
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchHAData(): Promise<{
  vegie: GrowBoxData
  bloom: GrowBoxData
}> {
  const now = new Date()

  const entityIds = [
    "sensor.hygrometer2_temperature",
    "sensor.hygrometer2_humidity",
    "sensor.hygrometer1_temperature",
    "sensor.hygrometer1_humidity",
    "sensor.pwm2_growbox_co2",
    "sensor.esp32_growbox_ppfd",
    "sensor.esp32_growbox_dli",
    "sensor.growlight_derzeitiger_verbrauch",
    "sensor.espclone_clones_ppfd",
    "sensor.espclone_growbox_dli",
    "sensor.clones_power",
    "sensor.pwm_abluftleistung_pid",
    "sensor.pwm2_abluftleistung_pid",
    "sensor.esp321_bodenfeuchtigkeit1",
    "sensor.soilsensor1_soil_moisture",
    "sensor.espclone_bodenfeuchtigkeit1",
    "sensor.bodensensoroutdoor_soil_moisture",
    "sensor.bloom_last_watering",
    "sensor.vegie_last_watering",
    "input_number.tankinhalt_bloom",
    "input_number.tankinhalt_vegie",
    "input_datetime.bluete_startdatum",
    "input_datetime.vegie_startdatum",
    "sensor.blute_erntezeitpunkt",
    "sensor.vegie_erntezeitpunkt",
    "sensor.blutewoche",
    "sensor.vegiewoche",
  ]

  const [states, bloomHistTemp, bloomHistHum, bloomHistDli, bloomHistSoil,
    vegieHistTemp, vegieHistHum, vegieHistDli, vegieHistSoil] = await Promise.all([
    getStates(entityIds),
    fetchHistory("sensor.hygrometer2_temperature", "temperature"),
    fetchHistory("sensor.hygrometer2_humidity", "humidity"),
    fetchHistory("sensor.esp32_growbox_dli", "dli"),
    fetchHistory("sensor.esp321_bodenfeuchtigkeit1", "soilMoisture"),
    fetchHistory("sensor.hygrometer1_temperature", "temperature"),
    fetchHistory("sensor.hygrometer1_humidity", "humidity"),
    fetchHistory("sensor.espclone_growbox_dli", "dli"),
    fetchHistory("sensor.espclone_bodenfeuchtigkeit1", "soilMoisture"),
  ])

  const s = (id: string) => states[id]?.state

  // ── Bloom ──────────────────────────────────────────────────────────────────
  const bloomTempN = numOrNull(s("sensor.hygrometer2_temperature"))
  const bloomHumN  = numOrNull(s("sensor.hygrometer2_humidity"))
  const bloomTempSafe = bloomTempN ?? 0
  const bloomHumSafe  = bloomHumN  ?? 0
  const bloomWatt   = num(s("sensor.growlight_derzeitiger_verbrauch"), 0)
  const bloomTankPct = Math.min(100, Math.round((num(s("input_number.tankinhalt_bloom"), 0) / 50) * 100))
  const bloomSoil = Math.round((num(s("sensor.esp321_bodenfeuchtigkeit1"), 50) + num(s("sensor.soilsensor1_soil_moisture"), 50)) / 2)
  const bloomLastWH = num(s("sensor.bloom_last_watering"), 24)
  const bloomLastWDate = new Date(now.getTime() - bloomLastWH * 3600000)
  const bloomStart  = parseDate(s("input_datetime.bluete_startdatum"), new Date(now.getTime() - 77 * 86400000))
  const bloomHarvest = parseHarvestDate(s("sensor.blute_erntezeitpunkt"), new Date(now.getTime() + 30 * 86400000))
  const bloomWeekN  = num(s("sensor.blutewoche"), 1)
  const bloomHistory = mergeHistory(
    bloomHistTemp as Partial<HistoryDataPoint>[],
    bloomHistHum  as Partial<HistoryDataPoint>[],
    bloomHistDli  as Partial<HistoryDataPoint>[],
    bloomHistSoil as Partial<HistoryDataPoint>[],
  )

  // ── Vegie ──────────────────────────────────────────────────────────────────
  const vegieTempN = numOrNull(s("sensor.hygrometer1_temperature"))
  const vegieHumN  = numOrNull(s("sensor.hygrometer1_humidity"))
  const vegieTempSafe = vegieTempN ?? 0
  const vegieHumSafe  = vegieHumN  ?? 0
  const vegieWatt   = num(s("sensor.clones_power"), 0)
  const vegieTankPct = Math.min(100, Math.round((num(s("input_number.tankinhalt_vegie"), 0) / 30) * 100))
  const vegieSoil = Math.round((num(s("sensor.espclone_bodenfeuchtigkeit1"), 50) + num(s("sensor.bodensensoroutdoor_soil_moisture"), 50)) / 2)
  const vegieLastWH = num(s("sensor.vegie_last_watering"), 24)
  const vegieLastWDate = new Date(now.getTime() - vegieLastWH * 3600000)
  const vegieStart  = parseDate(s("input_datetime.vegie_startdatum"), new Date(now.getTime() - 84 * 86400000))
  const vegieHarvest = parseHarvestDate(s("sensor.vegie_erntezeitpunkt"), new Date(now.getTime() + 30 * 86400000))
  const vegieWeekN  = num(s("sensor.vegiewoche"), 1)
  const vegieHistory = mergeHistory(
    vegieHistTemp as Partial<HistoryDataPoint>[],
    vegieHistHum  as Partial<HistoryDataPoint>[],
    vegieHistDli  as Partial<HistoryDataPoint>[],
    vegieHistSoil as Partial<HistoryDataPoint>[],
  )

  const co2N = num(s("sensor.pwm2_growbox_co2"), 0)

  const bloom: GrowBoxData = {
    id: "bloom-box",
    name: "Bloom",
    phase: "bloom",
    growNumber: Math.ceil(bloomWeekN / 8) || 1,
    temperature: bloomTempSafe,
    humidity: bloomHumSafe,
    vpd: bloomTempN !== null && bloomHumN !== null ? calculateVPD(bloomTempSafe, bloomHumSafe) : 0,
    co2: co2N,
    soilMoisture: bloomSoil,
    lightCycle: "12/12",
    ppfd: num(s("sensor.esp32_growbox_ppfd"), 0),
    dli: num(s("sensor.esp32_growbox_dli"), 0),
    wattage: bloomWatt,
    waterTankLevel: bloomTankPct,
    lastWatering: bloomLastWDate,
    nextWatering: new Date(bloomLastWDate.getTime() + 86400000),
    daysSinceStart: Math.floor((now.getTime() - bloomStart.getTime()) / 86400000),
    harvestDate: bloomHarvest,
    bloomStartDate: bloomStart,
    fanSpeed: Math.round(num(s("sensor.pwm_abluftleistung_pid"), 0)),
    targetHumidity: 50,
    lightOn: bloomWatt > 5,
    alerts: bloomTempN === null ? [{
      id: "bloom-sensor-offline",
      type: "warning" as const,
      message: "Hygrometer Bloom offline",
      timestamp: now,
    }] : [],
    history: bloomHistory,
  }

  const vegie: GrowBoxData = {
    id: "vegie-box",
    name: "Vegie / Clones",
    phase: "vegie",
    growNumber: Math.ceil(vegieWeekN / 8) || 1,
    temperature: vegieTempSafe,
    humidity: vegieHumSafe,
    vpd: vegieTempN !== null && vegieHumN !== null ? calculateVPD(vegieTempSafe, vegieHumSafe) : 0,
    co2: co2N,
    soilMoisture: vegieSoil,
    lightCycle: "18/6",
    ppfd: num(s("sensor.espclone_clones_ppfd"), 0),
    dli: num(s("sensor.espclone_growbox_dli"), 0),
    wattage: vegieWatt,
    waterTankLevel: vegieTankPct,
    lastWatering: vegieLastWDate,
    nextWatering: new Date(vegieLastWDate.getTime() + 86400000),
    daysSinceStart: Math.floor((now.getTime() - vegieStart.getTime()) / 86400000),
    harvestDate: vegieHarvest,
    bloomStartDate: vegieHarvest,
    fanSpeed: Math.round(num(s("sensor.pwm2_abluftleistung_pid"), 0)),
    targetHumidity: 65,
    lightOn: vegieWatt > 5,
    alerts: [],
    history: vegieHistory,
  }

  return { vegie, bloom }
}

export async function fetchHARoomData(): Promise<RoomData> {
  const entityIds = [
    "sensor.hygrometera_temperature",
    "sensor.pwm2_growbox_luftfeuchtigkeit",
    "sensor.pwm2_growbox_co2",
    "switch.heizung",
  ]

  const [states, heizungAttrs, acAttrs, rTempHist, rHumHist, rCo2Hist] =
    await Promise.all([
      getStates(entityIds),
      getAttributes("climate.heizung"),
      getAttributes("climate.152832117146580_climate"),
      fetchHistory("sensor.hygrometera_temperature", "temperature"),
      fetchHistory("sensor.pwm2_growbox_luftfeuchtigkeit", "humidity"),
      fetchHistory("sensor.pwm2_growbox_co2", "co2"),
    ])

  const s = (id: string) => states[id]?.state

  const history = mergeRoomHistory(
    rTempHist as Partial<RoomHistoryPoint>[],
    rHumHist  as Partial<RoomHistoryPoint>[],
    rCo2Hist  as Partial<RoomHistoryPoint>[],
  )

  return {
    heatingOn: s("switch.heizung") === "on",
    heatingTemp: (heizungAttrs.temperature as number) ?? 22,
    acOn: (() => {
      const st = s("climate.152832117146580_climate") ?? "off"
      return st !== "off" && st !== "unavailable"
    })(),
    acTemp: (acAttrs.temperature as number) ?? 24,
    roomTemp: num(s("sensor.hygrometera_temperature"), 0),
    roomHumidity: num(s("sensor.pwm2_growbox_luftfeuchtigkeit"), 0),
    co2: num(s("sensor.pwm2_growbox_co2"), 0),
    history,
  }
}
