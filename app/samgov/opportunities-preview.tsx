"use client"

import { useState } from "react"
import { DEFAULT_REQUIRED_SEARCH } from "@/lib/samgov-opportunities"

type SamOpportunity = {
  noticeId?: string
  title?: string
  solicitationNumber?: string
  postedDate?: string
  responseDeadLine?: string
  type?: string
  uiLink?: string
}

type SamResponse = {
  totalRecords?: number
  limit?: number
  offset?: number
  opportunitiesData?: SamOpportunity[]
  _warning?: string
  _cache?: {
    hit: boolean
    stale: boolean
    ageMs: number
    source?: string
  }
}

type SearchForm = {
  ncode: string
  active: string
  ptype: string
  limit: string
  offset: string
  postedFrom: string
  postedTo: string
}

const DEFAULT_FORM: SearchForm = {
  ncode: "",
  active: "",
  ptype: "",
  limit: "",
  offset: "",
  postedFrom: DEFAULT_REQUIRED_SEARCH.postedFrom ?? "03/01/2026",
  postedTo: DEFAULT_REQUIRED_SEARCH.postedTo ?? "03/25/2026",
}

const PRESETS: Array<{ label: string; values: Partial<SearchForm> }> = [
  {
    label: "Required only (postedFrom + postedTo)",
    values: DEFAULT_FORM,
  },
  {
    label: "Biddable: Solicitation (o) + NAICS 541810",
    values: { ptype: "o", ncode: "541810", limit: "25", offset: "0", postedFrom: "01/01/2026", postedTo: "03/25/2026" },
  },
  {
    label: "Biddable: Combined Synopsis/Solicitation (k) + NAICS 541810",
    values: { ptype: "k", ncode: "541810", limit: "25", offset: "0", postedFrom: "01/01/2026", postedTo: "03/25/2026" },
  },
  {
    label: "Solicitations only (o), all NAICS",
    values: { ptype: "o", ncode: "", limit: "25", offset: "0", postedFrom: "01/01/2026", postedTo: "03/25/2026" },
  },
]

export function OpportunitiesPreview() {
  const [form, setForm] = useState<SearchForm>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SamResponse | null>(null)
  const [requestPath, setRequestPath] = useState<string>("")

  const runSearch = async (values: SearchForm) => {
    setLoading(true)
    setError(null)
    const qp = new URLSearchParams()
    Object.entries(values).forEach(([k, v]) => {
      const trimmed = v.trim()
      if (!trimmed) return
      qp.set(k, trimmed)
    })
    const path = `/api/samgov?${qp.toString()}`
    setRequestPath(path)
    const res = await fetch(path, { method: "GET", cache: "no-store" })
    const json = (await res.json()) as SamResponse | { error?: string }
    if (!res.ok) {
      const msg = "error" in json && typeof json.error === "string" ? json.error : "SAM.gov request failed"
      throw new Error(msg)
    }
    setData(json as SamResponse)
    setLoading(false)
  }

  const rows = data?.opportunitiesData ?? []

  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-200">Live opportunities (GET /api/samgov)</h2>
        {loading ? <span className="text-xs text-zinc-500">Loading...</span> : null}
      </div>
      <p className="mb-3 text-xs text-zinc-500">
        No request is sent until you click <strong>Search</strong>. This helps avoid SAM.gov rate-limit (429) errors.
      </p>
      <form
        className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await runSearch(form)
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
            setLoading(false)
          }
        }}
      >
        <label className="text-xs text-zinc-400">
          NAICS (`ncode`)
          <input
            value={form.ncode}
            onChange={(e) => setForm((s) => ({ ...s, ncode: e.target.value }))}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          />
        </label>
        <label className="text-xs text-zinc-400">
          Type (`ptype`)
          <select
            value={form.ptype}
            onChange={(e) => setForm((s) => ({ ...s, ptype: e.target.value }))}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          >
            <option value="o">o - Solicitation</option>
            <option value="k">k - Combined Synopsis/Solicitation</option>
            <option value="r">r - Sources Sought</option>
            <option value="p">p - Pre-solicitation</option>
            <option value="a">a - Award Notice</option>
          </select>
        </label>
        <label className="text-xs text-zinc-400">
          Active
          <input
            value={form.active}
            onChange={(e) => setForm((s) => ({ ...s, active: e.target.value }))}
            placeholder="Optional (leave blank unless needed)"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          />
        </label>
        <label className="text-xs text-zinc-400">
          Limit
          <input
            value={form.limit}
            onChange={(e) => setForm((s) => ({ ...s, limit: e.target.value }))}
            placeholder="Optional"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          />
        </label>
        <label className="text-xs text-zinc-400">
          Offset
          <input
            value={form.offset}
            onChange={(e) => setForm((s) => ({ ...s, offset: e.target.value }))}
            placeholder="Optional"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          />
        </label>
        <label className="text-xs text-zinc-400">
          Posted From (MM/dd/yyyy)
          <input
            value={form.postedFrom}
            onChange={(e) => setForm((s) => ({ ...s, postedFrom: e.target.value }))}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            required
          />
        </label>
        <label className="text-xs text-zinc-400">
          Posted To (MM/dd/yyyy)
          <input
            value={form.postedTo}
            onChange={(e) => setForm((s) => ({ ...s, postedTo: e.target.value }))}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            required
          />
        </label>
        <div className="flex items-end gap-2 sm:col-span-2">
          <button type="submit" disabled={loading} className="rounded border border-emerald-700 bg-emerald-900/40 px-3 py-1.5 text-sm text-emerald-200 disabled:opacity-60">
            Search
          </button>
          <button
            type="button"
            onClick={() => setForm(DEFAULT_FORM)}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
          >
            Reset defaults
          </button>
        </div>
      </form>
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={async () => {
              const next = { ...DEFAULT_FORM, ...preset.values }
              setForm(next)
              try {
                await runSearch(next)
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error")
                setLoading(false)
              }
            }}
            className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            {preset.label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>
      ) : null}
      {!loading && !error && data ? (
        <>
          {data._warning ? (
            <p className="mb-2 rounded-md border border-amber-900/60 bg-amber-950/40 p-2 text-xs text-amber-300">
              {data._warning}
            </p>
          ) : null}
          {requestPath ? (
            <p className="mb-2 text-[11px] text-zinc-500">
              Request: <code className="font-mono">{requestPath}</code>
            </p>
          ) : null}
          {data._cache?.hit ? (
            <p className="mb-2 text-[11px] text-zinc-500">
              Cache: {data._cache.stale ? "stale fallback" : "fresh"} ({Math.round(data._cache.ageMs / 1000)}s old)
              {data._cache.source ? ` · ${data._cache.source}` : ""}
            </p>
          ) : null}
          <p className="mb-3 text-xs text-zinc-500">
            Returned {rows.length} rows
            {typeof data?.totalRecords === "number" ? ` of ${data.totalRecords} total` : ""}.
          </p>
          <div className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm text-zinc-500">No opportunities found for current filters.</p>
            ) : (
              rows.slice(0, 10).map((item, index) => (
                <article key={item.noticeId ?? item.solicitationNumber ?? `row-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
                  <p className="text-sm font-medium text-zinc-100">{item.title || "Untitled opportunity"}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {item.type || "Unknown type"} · {item.postedDate || "No posted date"}
                    {item.responseDeadLine ? ` · Deadline ${item.responseDeadLine}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Solicitation: <span className="font-mono">{item.solicitationNumber || "N/A"}</span>
                  </p>
                  {item.uiLink ? (
                    <a
                      href={item.uiLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-sky-400/90 hover:underline"
                    >
                      Open in SAM.gov
                    </a>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </>
      ) : null}
    </section>
  )
}
