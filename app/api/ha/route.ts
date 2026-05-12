/**
 * Vercel API Proxy für Home Assistant
 *
 * Warum dieser Proxy?
 * - Das HA_TOKEN bleibt serverseitig → nie im Browser-Bundle
 * - CORS-Problem gelöst: Vercel → ryzzla.org läuft server-zu-server
 * - Der Client fragt nur noch /api/ha (gleiche Origin)
 *
 * GET /api/ha?entity=sensor.foo
 *   → gibt { state, attributes } zurück
 *
 * GET /api/ha?history=sensor.foo&from=2024-01-01T00:00:00Z
 *   → gibt HA-History-Array zurück
 *
 * GET /api/ha?entities=sensor.a,sensor.b,...
 *   → Bulk: gibt { entity_id: { state, attributes } } zurück
 */

import { NextRequest, NextResponse } from "next/server"

const HA_URL = process.env.HA_URL ?? "https://ryzzla.org"
const HA_TOKEN = process.env.HA_TOKEN ?? ""

function haHeaders() {
  return {
    Authorization: `Bearer ${HA_TOKEN}`,
    "Content-Type": "application/json",
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  // ── Bulk entity fetch ──────────────────────────────────────────────────────
  const entities = searchParams.get("entities")
  if (entities) {
    const ids = entities.split(",").map((s) => s.trim()).filter(Boolean)
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`${HA_URL}/api/states/${id}`, {
            headers: haHeaders(),
            cache: "no-store",
          })
          if (!res.ok) return [id, { state: "unavailable", attributes: {} }]
          const json = await res.json()
          return [id, { state: json.state, attributes: json.attributes ?? {} }]
        } catch {
          return [id, { state: "unavailable", attributes: {} }]
        }
      })
    )
    return NextResponse.json(Object.fromEntries(results))
  }

  // ── Single entity ──────────────────────────────────────────────────────────
  const entity = searchParams.get("entity")
  if (entity) {
    try {
      const res = await fetch(`${HA_URL}/api/states/${entity}`, {
        headers: haHeaders(),
        cache: "no-store",
      })
      if (!res.ok) return NextResponse.json({ state: "unavailable", attributes: {} })
      const json = await res.json()
      return NextResponse.json({ state: json.state, attributes: json.attributes ?? {} })
    } catch {
      return NextResponse.json({ state: "unavailable", attributes: {} })
    }
  }

  // ── History ────────────────────────────────────────────────────────────────
  const historyEntity = searchParams.get("history")
  if (historyEntity) {
    const from =
      searchParams.get("from") ??
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    try {
      const res = await fetch(
        `${HA_URL}/api/history/period/${from}?filter_entity_id=${historyEntity}&minimal_response=true&significant_changes_only=false`,
        { headers: haHeaders(), cache: "no-store" }
      )
      if (!res.ok) return NextResponse.json([])
      const json = await res.json()
      return NextResponse.json(json[0] ?? [])
    } catch {
      return NextResponse.json([])
    }
  }

  return NextResponse.json({ error: "Missing query param: entity, entities, or history" }, { status: 400 })
}
