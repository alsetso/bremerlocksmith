/** SAM.gov Get Opportunities Public API v2 (production). */
export const SAM_GOV_OPPORTUNITIES_SEARCH_URL =
  "https://api.sam.gov/prod/opportunities/v2/search"

/** GSA-required parameters for v2 search. Dates must be MM/dd/yyyy. */
export const DEFAULT_REQUIRED_SEARCH: Record<string, string> = {
  postedFrom: "03/01/2026",
  postedTo: "03/25/2026",
}

export type SamSearchInput = Record<string, string | number | boolean | undefined | null>

/**
 * Merge defaults with caller overrides. Strips client-supplied `api_key`.
 * `naics` is copied to `ncode` when `ncode` is not set.
 */
export function buildSamSearchParams(overrides: SamSearchInput): URLSearchParams {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(DEFAULT_REQUIRED_SEARCH)) {
    p.set(k, v)
  }

  const flat: Record<string, string> = {}
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === null) continue
    if (k === "api_key") continue
    flat[k] = typeof v === "boolean" ? String(v) : String(v)
  }

  if (flat.naics && !flat.ncode) {
    flat.ncode = flat.naics
  }
  delete flat.naics

  for (const [k, v] of Object.entries(flat)) {
    p.set(k, v)
  }

  return p
}

export function searchParamsToObject(sp: URLSearchParams): SamSearchInput {
  const o: SamSearchInput = {}
  sp.forEach((value, key) => {
    o[key] = value
  })
  return o
}
