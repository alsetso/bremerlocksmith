import { NextResponse } from "next/server"
import {
  SAM_GOV_OPPORTUNITIES_SEARCH_URL,
  buildSamSearchParams,
  searchParamsToObject,
} from "@/lib/samgov-opportunities"

export const dynamic = "force-dynamic"

const SAM_CACHE_TTL_MS = 10 * 60 * 1000

type CacheEntry = {
  at: number
  status: number
  body: unknown
  queryKey: string
}

const responseCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<NextResponse>>()
let lastSuccessEntry: CacheEntry | null = null

function objectBody(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>
  }
  return { data: v }
}

function parseRetryAfterSeconds(h: string | null): number | null {
  if (!h?.trim()) return null
  const s = h.trim()
  const asNum = Number(s)
  if (Number.isFinite(asNum) && asNum >= 0) return Math.round(asNum)
  const asDate = Date.parse(s)
  if (!Number.isFinite(asDate)) return null
  const deltaMs = asDate - Date.now()
  if (!Number.isFinite(deltaMs)) return null
  return Math.max(0, Math.round(deltaMs / 1000))
}

function getSamApiKey(): string | null {
  const key = process.env.SAM_GOV_API_KEY?.trim()
  return key || null
}

async function proxySamSearch(merged: URLSearchParams) {
  const apiKey = getSamApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: "SAM_GOV_API_KEY is not set. Add it to .env.local." },
      { status: 503 },
    )
  }

  const queryKey = merged.toString()
  const now = Date.now()
  const cached = responseCache.get(queryKey)
  if (cached && now - cached.at <= SAM_CACHE_TTL_MS) {
    return NextResponse.json(
      { ...objectBody(cached.body), _cache: { hit: true, stale: false, ageMs: now - cached.at } },
      { status: cached.status },
    )
  }

  const existing = inflight.get(queryKey)
  if (existing) {
    return existing
  }

  const run = async () => {
    const url = new URL(SAM_GOV_OPPORTUNITIES_SEARCH_URL)
  merged.forEach((value, key) => {
    url.searchParams.set(key, value)
  })
  url.searchParams.set("api_key", apiKey)

    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })

    const text = await res.text()
    let body: unknown
    try {
      body = JSON.parse(text) as unknown
    } catch {
      body = { raw: text }
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after")
      const retryAfterSeconds = parseRetryAfterSeconds(retryAfter)
      if (cached) {
        return NextResponse.json(
          {
            ...objectBody(cached.body),
            _cache: { hit: true, stale: true, ageMs: now - cached.at },
            _warning: "SAM.gov rate limited request (429). Returned cached response for this query.",
          },
          { status: 200 },
        )
      }
      if (lastSuccessEntry) {
        return NextResponse.json(
          {
            ...objectBody(lastSuccessEntry.body),
            _cache: {
              hit: true,
              stale: true,
              ageMs: now - lastSuccessEntry.at,
              source: "last-success-any-query",
            },
            _warning:
              "SAM.gov rate limited request (429). Returned the most recent successful response from another recent query.",
          },
          { status: 200 },
        )
      }
      return NextResponse.json(
        {
          error: "SAM.gov rate limit reached (429). Wait and retry, or broaden filters.",
          retryAfterSeconds: retryAfterSeconds ?? 60,
          retryAfter,
          samStatus: 429,
        },
        { status: 429 },
      )
    }

    if (res.ok) {
      const entry: CacheEntry = { at: Date.now(), status: res.status, body, queryKey }
      responseCache.set(queryKey, entry)
      lastSuccessEntry = entry
    }
    return NextResponse.json(body, { status: res.status })
  }

  const promise = run().finally(() => {
    inflight.delete(queryKey)
  })
  inflight.set(queryKey, promise)
  return promise
}

/**
 * GET /api/samgov — query string overrides defaults (e.g. ?postedTo=03/31/2026&limit=10).
 * Does not expose the SAM API key; it is applied server-side.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const overrides = searchParamsToObject(searchParams)
  const merged = buildSamSearchParams(overrides)
  return proxySamSearch(merged)
}

/**
 * POST /api/samgov — JSON body overrides defaults, same behavior as GET.
 * Example: { "postedFrom": "03/01/2026", "ptype": "k", "naics": "541810" }
 */
export async function POST(request: Request) {
  let overrides: Record<string, unknown> = {}
  try {
    const parsed = (await request.json()) as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      overrides = parsed as Record<string, unknown>
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const merged = buildSamSearchParams(overrides as Record<string, string | number | boolean | undefined | null>)
  return proxySamSearch(merged)
}
