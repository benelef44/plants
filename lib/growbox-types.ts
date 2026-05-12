export interface RoomHistoryPoint {
  time: string
  temperature: number
  humidity: number
  co2: number
}

export interface RoomData {
  heatingOn: boolean
  heatingTemp: number // Zieltemperatur
  acOn: boolean
  acTemp: number // Zieltemperatur
  roomTemp: number
  roomHumidity: number
  co2: number
  history: RoomHistoryPoint[]
}

export interface GrowBoxData {
  id: string
  name: string
  phase: "vegie" | "bloom"
  growNumber: number // z.B. 5 fuer "5th Grow"
  temperature: number
  humidity: number
  vpd: number
  co2: number
  soilMoisture: number
  lightCycle: string
  ppfd: number
  dli: number
  wattage: number // Aktuelle Watt
  waterTankLevel: number
  lastWatering: Date
  nextWatering: Date
  daysSinceStart: number
  harvestDate: Date // Erntezeitpunkt
  bloomStartDate?: Date // Bloom Start
  fanSpeed: number // 0-100%
  targetHumidity: number // Ziel RLF
  lightOn: boolean
  alerts: Alert[]
  history: HistoryDataPoint[]
}

export interface Alert {
  id: string
  type: "warning" | "danger" | "info"
  message: string
  timestamp: Date
}

export interface HistoryDataPoint {
  time: string
  temperature: number
  humidity: number
  vpd: number
  co2: number
  dli: number
  soilMoisture: number
}

export function calculateVPD(tempC: number, humidityPercent: number): number {
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3))
  const avp = svp * (humidityPercent / 100)
  return Number((svp - avp).toFixed(2))
}

export function getVPDStatus(vpd: number): { status: string; color: string } {
  if (vpd < 0.4) return { status: "Zu niedrig", color: "text-grow-info" }
  if (vpd < 0.8) return { status: "Propagation/Klon", color: "text-grow-green" }
  if (vpd < 1.2) return { status: "Vegie optimal", color: "text-grow-green" }
  if (vpd < 1.6) return { status: "Bloom optimal", color: "text-grow-bloom" }
  return { status: "Zu hoch", color: "text-grow-danger" }
}

export function generateRoomData(): RoomData {
  const baseTemp = 22 + Math.random() * 4
  const baseHumidity = 55 + Math.random() * 15
  const baseCo2 = 800 + Math.floor(Math.random() * 400)

  const history: RoomHistoryPoint[] = []
  for (let i = 23; i >= 0; i--) {
    history.push({
      time: `${(24 - i).toString().padStart(2, "0")}:00`,
      temperature: Number((baseTemp + (Math.random() - 0.5) * 3).toFixed(1)),
      humidity: Number((baseHumidity + (Math.random() - 0.5) * 10).toFixed(1)),
      co2: baseCo2 + Math.floor((Math.random() - 0.5) * 200),
    })
  }

  return {
    heatingOn: Math.random() > 0.5,
    heatingTemp: 22,
    acOn: Math.random() > 0.7,
    acTemp: 24,
    roomTemp: baseTemp,
    roomHumidity: baseHumidity,
    co2: baseCo2,
    history,
  }
}

export function generateMockData(): { vegie: GrowBoxData; bloom: GrowBoxData } {
  const now = new Date()
  
  const vegieTemp = 24 + Math.random() * 2
  const vegieHumidity = 65 + Math.random() * 10
  
  const bloomTemp = 25 + Math.random() * 2
  const bloomHumidity = 50 + Math.random() * 10

  const generateHistory = (baseTemp: number, baseHumidity: number, baseDli: number, baseSoilMoisture: number): HistoryDataPoint[] => {
    const history: HistoryDataPoint[] = []
    for (let i = 23; i >= 0; i--) {
      const temp = baseTemp + (Math.random() - 0.5) * 4
      const humidity = baseHumidity + (Math.random() - 0.5) * 15
      const dli = baseDli + (Math.random() - 0.5) * 8
      const soilMoisture = baseSoilMoisture + (Math.random() - 0.5) * 20
      history.push({
        time: `${(24 - i).toString().padStart(2, "0")}:00`,
        temperature: Number(temp.toFixed(1)),
        humidity: Number(humidity.toFixed(1)),
        vpd: calculateVPD(temp, humidity),
        co2: 800 + Math.floor(Math.random() * 400),
        dli: Number(dli.toFixed(1)),
        soilMoisture: Number(Math.max(20, Math.min(100, soilMoisture)).toFixed(0)),
      })
    }
    return history
  }

  return {
    vegie: {
      id: "vegie-box",
      name: "Vegie",
      phase: "vegie",
      growNumber: 5,
      temperature: Number(vegieTemp.toFixed(1)),
      humidity: Number(vegieHumidity.toFixed(1)),
      vpd: calculateVPD(vegieTemp, vegieHumidity),
      co2: 950 + Math.floor(Math.random() * 100),
      soilMoisture: 60 + Math.floor(Math.random() * 20),
      lightCycle: "18/6",
      ppfd: 450 + Math.floor(Math.random() * 100),
      dli: 29 + Math.floor(Math.random() * 5),
      wattage: 320 + Math.floor(Math.random() * 40),
      waterTankLevel: 75 + Math.floor(Math.random() * 20),
      lastWatering: new Date(now.getTime() - 1000 * 60 * 60 * 8),
      nextWatering: new Date(now.getTime() + 1000 * 60 * 60 * 4),
      daysSinceStart: 21,
      harvestDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 70), // ~70 Tage
      bloomStartDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14), // In 14 Tagen
      fanSpeed: 65,
      targetHumidity: 65,
      lightOn: true,
      alerts: [
        {
          id: "1",
          type: "info",
          message: "Luftfeuchtigkeit im optimalen Bereich",
          timestamp: new Date(),
        },
      ],
      history: generateHistory(vegieTemp, vegieHumidity, 29, 65),
    },
    bloom: {
      id: "bloom-box",
      name: "Bloom",
      phase: "bloom",
      growNumber: 4,
      temperature: Number(bloomTemp.toFixed(1)),
      humidity: Number(bloomHumidity.toFixed(1)),
      vpd: calculateVPD(bloomTemp, bloomHumidity),
      co2: 1100 + Math.floor(Math.random() * 100),
      soilMoisture: 45 + Math.floor(Math.random() * 15),
      lightCycle: "12/12",
      ppfd: 650 + Math.floor(Math.random() * 150),
      dli: 28 + Math.floor(Math.random() * 5),
      wattage: 480 + Math.floor(Math.random() * 60),
      waterTankLevel: 60 + Math.floor(Math.random() * 25),
      lastWatering: new Date(now.getTime() - 1000 * 60 * 60 * 12),
      nextWatering: new Date(now.getTime() + 1000 * 60 * 60 * 6),
      daysSinceStart: 42,
      harvestDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 28), // ~28 Tage
      bloomStartDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14), // Vor 14 Tagen
      fanSpeed: 80,
      targetHumidity: 50,
      lightOn: false,
      alerts: [
        {
          id: "2",
          type: "warning",
          message: "Wassertank unter 70%",
          timestamp: new Date(),
        },
      ],
      history: generateHistory(bloomTemp, bloomHumidity, 28, 50),
    },
  }
}
