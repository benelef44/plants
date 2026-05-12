/**
 * Home Assistant Live Data Fetcher
 * Replaces generateMockData() / generateRoomData() with real HA REST API calls.
 *
 * Entity mapping:
 *  BLOOM  → sensor.hygrometer2_temperature / sensor.hygrometer2_humidity
 *  VEGIE  → sensor.hygrometer1_temperature / sensor.hygrometer1_humidity
 *  SHARED → sensor.pwm2_growbox_co2, sensor.hygrometera_temperature, etc.
 */

import {
  calculateVPD,
  type GrowBoxData,
  type RoomData,
  type HistoryDataPoint,
  type RoomHistoryPoint,
} from "./growbox-types"

const HA_URL = process.env.HA_URL ?? "https://ryzzla.org"
const HA_TOKEN = process.env.HA_TOKEN ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyNjFlMGFjYzM0ZDI0OGI3OTZkNTZmYjIzNzQ1MjI4MiIsImlhdCI6MTc3ODYyNTA2OSwiZXhwIjoyMDkzOTg1MDY5fQ.AasjvaITuNUksPPlCnpSuAPpaD4KqOyWoC36w5a_gC0"

// ── helpers ───────────────────────────────────────────────────────────────────

async function getState(entityId: string): Promise<string> {
  try {
    const res = await fetch(`${HA_URL}/api/states/${entityId}`, {
      headers: { Authorization: `Bearer ${HA_TOKEN}`, "Content-Type": "application/json" },
      cache: "no-store",
    })
    if (!res.ok) return "unavailable"
    const json = await res.json()
    return json.state ?? "unavailable"
  } catch {
    return "unavailable"
  }
}

function num(val: string, fallback = 0): number {
  const n = parseFloat(val)
  return isNaN(n) ? fallback : n
}

// Fetch 24 h history for an entity and map to HistoryDataPoint shape
async function fetchHistory(
  entityId: string,
  valueKey: keyof HistoryDataPoint
): Promise<Partial<HistoryDataPoint>[]> {
  try {
    const start = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const res = await fetch(
      `${HA_URL}/api/history/period/${start}?filter_entity_id=${entityId}&minimal_response=true&significant_changes_only=false`,
      {
        headers: { Authorization: `Bearer ${HA_TOKEN}` },
        cache: "no-store",
      }
    )
    if (!res.ok) return []
    const json: { state: string; last_changed: string }[][] = await res.json()
    const series = json[0] ?? []

    // Bucket into 24 hourly slots
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
      [valueKey]: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
    }))
  } catch {
    return []
  }
}

// Merge partial history arrays (temp + humidity + etc.) into full HistoryDataPoint[]
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

// ── public API ────────────────────────────────────────────────────────────────

export async function fetchHAData(): Promise<{
  vegie: GrowBoxData
  bloom: GrowBoxData
}> {
  // Fetch all states in parallel
  const [
    // Bloom climate
    bloomTemp,
    bloomHum,
    // Vegie / Clones climate
    vegieTemp,
    vegieHum,
    // Shared room CO2
    co2Raw,
    // Light – Bloom
    bloomPpfd,
    bloomDli,
    bloomWatt,
    // Light – Vegie/Clones
    vegiePpfd,
    vegieDli,
    vegieWatt,
    // Fan
    bloomFan,
    vegieFan,
    // Soil moisture – Bloom (BFS1 + BFS4)
    bloomSoil1,
    bloomSoil2,
    // Soil moisture – Vegie (BFS1 + BFS3)
    vegieSoil1,
    vegieSoil2,
    // Watering timers (hours since last)
    bloomLastWatering,
    vegieLastWatering,
    // Tank levels
    tankBloom,
    tankVegie,
    // Dates
    bloomStartRaw,
    vegieStartRaw,
    bloomHarvestRaw,
    vegieHarvestRaw,
    // Week numbers
    bloomWeek,
    vegieWeek,
  ] = await Promise.all([
    getState("sensor.hygrometer2_temperature"),
    getState("sensor.hygrometer2_humidity"),
    getState("sensor.hygrometer1_temperature"),
    getState("sensor.hygrometer1_humidity"),
    getState("sensor.pwm2_growbox_co2"),
    getState("sensor.esp32_growbox_ppfd"),
    getState("sensor.esp32_growbox_dli"),
    getState("sensor.growlight_derzeitiger_verbrauch"),
    getState("sensor.espclone_clones_ppfd"),
    getState("sensor.espclone_growbox_dli"),
    getState("sensor.clones_power"),
    getState("sensor.pwm_abluftleistung_pid"),
    getState("sensor.pwm2_abluftleistung_pid"),
    getState("sensor.esp321_bodenfeuchtigkeit1"),   // bloom BFS1
    getState("sensor.soilsensor1_soil_moisture"),   // bloom BFS4
    getState("sensor.espclone_bodenfeuchtigkeit1"), // vegie BFS1
    getState("sensor.bodensensoroutdoor_soil_moisture"), // vegie BFS3
    getState("sensor.bloom_last_watering"),
    getState("sensor.vegie_last_watering"),
    getState("input_number.tankinhalt_bloom"),
    getState("input_number.tankinhalt_vegie"),
    getState("input_datetime.bluete_startdatum"),
    getState("input_datetime.vegie_startdatum"),
    getState("sensor.blute_erntezeitpunkt"),
    getState("sensor.vegie_erntezeitpunkt"),
    getState("sensor.blutewoche"),
    getState("sensor.vegiewoche"),
  ])

  // Derived values
  const bloomTempN = num(bloomTemp, 25)
  const bloomHumN = num(bloomHum, 50)
  const vegieTempN = num(vegieTemp, 22)
  const vegieHumN = num(vegieHum, 65)
  const co2N = num(co2Raw, 800)

  // Tank: HA stores in Liters, max 50L → convert to percentage
  const bloomTankPct = Math.round((num(tankBloom, 0) / 50) * 100)
  const vegieTankPct = Math.round((num(tankVegie, 0) / 30) * 100)

  // Soil: average of two sensors if both available
  const bloomSoilN = Math.round(
    (num(bloomSoil1, 50) + num(bloomSoil2, 50)) / 2
  )
  const vegieSoilN = Math.round(
    (num(vegieSoil1, 50) + num(vegieSoil2, 50)) / 2
  )

  // Dates
  const now = new Date()

  const parseDate = (raw: string, fallback: Date): Date => {
    if (!raw || raw === "unavailable" || raw === "unknown") return fallback
    const d = new Date(raw)
    return isNaN(d.getTime()) ? fallback : d
  }

  const bloomStart = parseDate(
    bloomStartRaw,
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 77)
  )
  const vegieStart = parseDate(
    vegieStartRaw,
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 84)
  )

  // Harvest date: HA returns formatted string like "03. May" or "2026-04-07"
  // We parse sensor.blute_erntezeitpunkt / sensor.vegie_erntezeitpunkt
  const parseHarvestDate = (raw: string): Date => {
    if (!raw || raw === "unavailable") return new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)
    // Try ISO format first
    const iso = new Date(raw)
    if (!isNaN(iso.getTime())) return iso
    // Try "03. May" format
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
        return new Date(now.getFullYear(), month, parseInt(match[1]))
      }
    }
    return new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)
  }

  const bloomHarvest = parseHarvestDate(bloomHarvestRaw)
  const vegieHarvest = parseHarvestDate(vegieHarvestRaw)

  // Days since start
  const bloomDays = Math.floor((now.getTime() - bloomStart.getTime()) / (1000 * 60 * 60 * 24))
  const vegieDays = Math.floor((now.getTime() - vegieStart.getTime()) / (1000 * 60 * 60 * 24))

  // Grow number from week sensor
  const bloomWeekN = num(bloomWeek, 1)
  const vegieWeekN = num(vegieWeek, 1)

  // Last watering: HA gives hours since last watering
  const bloomLastWateringH = num(bloomLastWatering, 24)
  const vegieLastWateringH = num(vegieLastWatering, 24)
  const bloomLastWateringDate = new Date(now.getTime() - bloomLastWateringH * 60 * 60 * 1000)
  const vegieLastWateringDate = new Date(now.getTime() - vegieLastWateringH * 60 * 60 * 1000)

  // Light on = wattage > 0
  const bloomLightOn = num(bloomWatt, 0) > 5
  const vegieLightOn = num(vegieWatt, 0) > 5

  // Light cycle strings (derived from phase)
  const bloomLightCycle = "12/12"
  const vegieLightCycle = "18/6"

  // Fetch history in parallel
  const [
    bTempHist, bHumHist, bDliHist, bSoilHist,
    vTempHist, vHumHist, vDliHist, vSoilHist,
  ] = await Promise.all([
    fetchHistory("sensor.hygrometer2_temperature", "temperature"),
    fetchHistory("sensor.hygrometer2_humidity", "humidity"),
    fetchHistory("sensor.esp32_growbox_dli", "dli"),
    fetchHistory("sensor.esp321_bodenfeuchtigkeit1", "soilMoisture"),
    fetchHistory("sensor.hygrometer1_temperature", "temperature"),
    fetchHistory("sensor.hygrometer1_humidity", "humidity"),
    fetchHistory("sensor.espclone_growbox_dli", "dli"),
    fetchHistory("sensor.espclone_bodenfeuchtigkeit1", "soilMoisture"),
  ])

  const bloomHistory = mergeHistory(
    bTempHist as Partial<HistoryDataPoint>[],
    bHumHist as Partial<HistoryDataPoint>[],
    bDliHist as Partial<HistoryDataPoint>[],
    bSoilHist as Partial<HistoryDataPoint>[]
  )

  const vegieHistory = mergeHistory(
    vTempHist as Partial<HistoryDataPoint>[],
    vHumHist as Partial<HistoryDataPoint>[],
    vDliHist as Partial<HistoryDataPoint>[],
    vSoilHist as Partial<HistoryDataPoint>[]
  )

  const bloom: GrowBoxData = {
    id: "bloom-box",
    name: "Bloom",
    phase: "bloom",
    growNumber: Math.ceil(bloomWeekN / 8) || 1,
    temperature: bloomTempN,
    humidity: bloomHumN,
    vpd: calculateVPD(bloomTempN, bloomHumN),
    co2: co2N,
    soilMoisture: bloomSoilN,
    lightCycle: bloomLightCycle,
    ppfd: num(bloomPpfd, 0),
    dli: num(bloomDli, 0),
    wattage: num(bloomWatt, 0),
    waterTankLevel: bloomTankPct,
    lastWatering: bloomLastWateringDate,
    nextWatering: new Date(bloomLastWateringDate.getTime() + 1000 * 60 * 60 * 24),
    daysSinceStart: bloomDays,
    harvestDate: bloomHarvest,
    bloomStartDate: bloomStart,
    fanSpeed: Math.round(num(bloomFan, 0)),
    targetHumidity: 50,
    lightOn: bloomLightOn,
    alerts: [],
    history: bloomHistory,
  }

  const vegie: GrowBoxData = {
    id: "vegie-box",
    name: "Vegie",
    phase: "vegie",
    growNumber: Math.ceil(vegieWeekN / 8) || 1,
    temperature: vegieTempN,
    humidity: vegieHumN,
    vpd: calculateVPD(vegieTempN, vegieHumN),
    co2: co2N,
    soilMoisture: vegieSoilN,
    lightCycle: vegieLightCycle,
    ppfd: num(vegiePpfd, 0),
    dli: num(vegieDli, 0),
    wattage: num(vegieWatt, 0),
    waterTankLevel: vegieTankPct,
    lastWatering: vegieLastWateringDate,
    nextWatering: new Date(vegieLastWateringDate.getTime() + 1000 * 60 * 60 * 24),
    daysSinceStart: vegieDays,
    harvestDate: vegieHarvest,
    bloomStartDate: vegieHarvest, // for vegie: bloomStartDate = when bloom phase starts = harvest estimate
    fanSpeed: Math.round(num(vegieFan, 0)),
    targetHumidity: 65,
    lightOn: vegieLightOn,
    alerts: [],
    history: vegieHistory,
  }

  return { vegie, bloom }
}

export async function fetchHARoomData(): Promise<RoomData> {
  const [roomTemp, roomHum, co2Raw, heatingState, acState, acTemp] =
    await Promise.all([
      getState("sensor.hygrometera_temperature"),
      getState("sensor.pwm2_growbox_luftfeuchtigkeit"),
      getState("sensor.pwm2_growbox_co2"),
      getState("switch.heizung"),
      getState("climate.152832117146580_climate"),
      getState("climate.152832117146580_climate"), // we parse attributes separately
    ])

  // For AC target temp we need attributes – do a separate fetch
  let acTargetTemp = 24
  try {
    const res = await fetch(`${HA_URL}/api/states/climate.152832117146580_climate`, {
      headers: { Authorization: `Bearer ${HA_TOKEN}` },
      cache: "no-store",
    })
    if (res.ok) {
      const json = await res.json()
      acTargetTemp = json.attributes?.temperature ?? 24
    }
  } catch {}

  let heatingTargetTemp = 22
  try {
    const res = await fetch(`${HA_URL}/api/states/climate.heizung`, {
      headers: { Authorization: `Bearer ${HA_TOKEN}` },
      cache: "no-store",
    })
    if (res.ok) {
      const json = await res.json()
      heatingTargetTemp = json.attributes?.temperature ?? 22
    }
  } catch {}

  const [rTempHist, rHumHist, rCo2Hist] = await Promise.all([
    fetchHistory("sensor.hygrometera_temperature", "temperature"),
    fetchHistory("sensor.pwm2_growbox_luftfeuchtigkeit", "humidity"),
    fetchHistory("sensor.pwm2_growbox_co2", "co2"),
  ])

  const history = mergeRoomHistory(
    rTempHist as Partial<RoomHistoryPoint>[],
    rHumHist as Partial<RoomHistoryPoint>[],
    rCo2Hist as Partial<RoomHistoryPoint>[]
  )

  return {
    heatingOn: heatingState === "on",
    heatingTemp: heatingTargetTemp,
    acOn: acState !== "off" && acState !== "unavailable",
    acTemp: acTargetTemp,
    roomTemp: num(roomTemp, 22),
    roomHumidity: num(roomHum, 55),
    co2: num(co2Raw, 800),
    history,
  }
}
