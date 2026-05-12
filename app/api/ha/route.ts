import { NextRequest, NextResponse } from "next/server"

const HA_URL = process.env.HA_URL ?? "https://ryzzla.org"
const HA_TOKEN = process.env.HA_TOKEN ?? ""

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? ""
  
  const res = await fetch(`${HA_URL}/api/${path}`, {
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const data = await res.json()
  return NextResponse.json(data)
}