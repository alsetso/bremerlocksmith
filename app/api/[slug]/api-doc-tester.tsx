"use client"

import { useState } from "react"

type MetroVehicle = {
  id: string
  trip_id: string
  route_id: string
  latitude: number
  longitude: number
  direction?: string
  bearing?: number
  speed?: number
}

export function ApiDocTester() {
  const [routes, setRoutes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MetroVehicle[] | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const qp = new URLSearchParams()
      if (routes.trim()) qp.set("routes", routes.trim())
      const path = qp.toString()
        ? `/api/metro-transit/vehicles?${qp.toString()}`
        : "/api/metro-transit/vehicles"
      const res = await fetch(path, { cache: "no-store" })
      const json = (await res.json()) as MetroVehicle[]
      if (!res.ok) throw new Error(`Request failed with ${res.status}`)
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">Test API</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Optional route filter (comma-separated route IDs): <code className="font-mono text-zinc-300">901,902</code>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={routes}
          onChange={(e) => setRoutes(e.target.value)}
          placeholder="routes (optional)"
          className="min-w-[16rem] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded-lg border border-emerald-700 bg-emerald-900/40 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-60"
        >
          {loading ? "Testing..." : "Run test"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-4">
          <p className="mb-2 text-xs text-zinc-500">
            Returned <span className="font-semibold text-zinc-300">{result.length}</span> vehicle records.
          </p>
          <pre className="max-h-[22rem] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
            {JSON.stringify(result.slice(0, 15), null, 2)}
          </pre>
        </div>
      ) : null}
    </section>
  )
}
