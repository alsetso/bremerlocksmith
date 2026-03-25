"use client"

import { useCallback, useEffect, useId, useState } from "react"
import type { DemoGeometry, DemoVehicle } from "@/lib/home-demo-geometry"
import {
  DEFAULT_HOME_DEMO_GEOMETRY,
  emptyVehicle,
  ensureVehiclePath,
  isLocalhostDevHostname,
  normalizeGeometry,
  saveHomeDemoGeometry,
} from "@/lib/home-demo-geometry"
import { totalPathLengthM } from "@/lib/demo-vehicle-path"

type Props = {
  geometry: DemoGeometry
  onGeometryChange: (g: DemoGeometry) => void
  mapEditVehicleId: string | null
  onMapEditVehicleChange: (id: string | null) => void
  panelOpen: boolean
  onPanelOpenChange: (open: boolean) => void
}

function parseRouteTextarea(text: string): [number, number][] | null {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const out: [number, number][] = []
  for (const line of lines) {
    const parts = line.split(/[,\s]+/).filter(Boolean)
    if (parts.length < 2) return null
    const lng = Number(parts[0])
    const lat = Number(parts[1])
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
    out.push([lng, lat])
  }
  return out.length >= 2 ? out : null
}

export function HomeDemoAdminToggle({
  geometry,
  onGeometryChange,
  mapEditVehicleId,
  onMapEditVehicleChange,
  panelOpen: open,
  onPanelOpenChange,
}: Props) {
  const [visibleHost, setVisibleHost] = useState(false)

  useEffect(() => {
    setVisibleHost(isLocalhostDevHostname())
  }, [])

  const update = useCallback(
    (next: DemoGeometry) => {
      const n = normalizeGeometry(next)
      onGeometryChange(n)
      saveHomeDemoGeometry(n)
    },
    [onGeometryChange],
  )

  const updateVehicle = useCallback(
    (id: string, patch: Partial<DemoVehicle>) => {
      const vehicles = geometry.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v))
      update({ ...geometry, vehicles })
    },
    [geometry, update],
  )

  const addVehicle = useCallback(() => {
    update({ ...geometry, vehicles: [...geometry.vehicles, emptyVehicle()] })
  }, [geometry, update])

  const removeVehicle = useCallback(
    (id: string) => {
      if (geometry.vehicles.length <= 1) return
      const vehicles = geometry.vehicles.filter((v) => v.id !== id)
      if (mapEditVehicleId === id) onMapEditVehicleChange(null)
      update({ ...geometry, vehicles })
    },
    [geometry, update, mapEditVehicleId, onMapEditVehicleChange],
  )

  if (!visibleHost) return null

  return (
    <div className="absolute bottom-3 left-3 z-20 max-w-[min(100%-1.5rem,24rem)]">
      <button
        type="button"
        onClick={() => {
          const next = !open
          if (open && !next) onMapEditVehicleChange(null)
          onPanelOpenChange(next)
        }}
        className="rounded-md border border-amber-600/80 bg-amber-950/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100 shadow backdrop-blur-sm hover:bg-amber-900/90"
      >
        {open ? "Close demo admin" : "Localhost · demo vehicles"}
      </button>
      {open ? (
        <HomeDemoAdminPanel
          geometry={geometry}
          update={update}
          updateVehicle={updateVehicle}
          addVehicle={addVehicle}
          removeVehicle={removeVehicle}
          mapEditVehicleId={mapEditVehicleId}
          onMapEditVehicleChange={onMapEditVehicleChange}
        />
      ) : null}
    </div>
  )
}

function HomeDemoAdminPanel({
  geometry,
  update,
  updateVehicle,
  addVehicle,
  removeVehicle,
  mapEditVehicleId,
  onMapEditVehicleChange,
}: {
  geometry: DemoGeometry
  update: (g: DemoGeometry) => void
  updateVehicle: (id: string, patch: Partial<DemoVehicle>) => void
  addVehicle: () => void
  removeVehicle: (id: string) => void
  mapEditVehicleId: string | null
  onMapEditVehicleChange: (id: string | null) => void
}) {
  return (
    <div className="mt-2 max-h-[min(65vh,32rem)] space-y-3 overflow-y-auto rounded-lg border border-amber-700/60 bg-zinc-950/98 p-3 text-xs text-zinc-200 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-medium uppercase tracking-wide text-amber-200/90">
        Dev — demo data (localStorage). Select a vehicle → <span className="text-amber-100">Pick on map</span> to place
        waypoints; meeting point follows vehicle 1 start.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-zinc-700"
          onClick={addVehicle}
        >
          Add vehicle
        </button>
        <button
          type="button"
          className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-zinc-700"
          onClick={() => {
            onMapEditVehicleChange(null)
            update({ ...DEFAULT_HOME_DEMO_GEOMETRY })
          }}
        >
          Reset defaults
        </button>
      </div>

      {mapEditVehicleId ? (
        <p className="rounded border border-amber-500/40 bg-amber-950/50 px-2 py-1.5 text-[11px] leading-snug text-amber-100/95">
          <strong className="text-amber-50">Map mode:</strong> click the map to add points along the path. Click a
          numbered badge on the map to remove that point. Demo playback pauses while editing.
        </p>
      ) : null}

      <ul className="space-y-3">
        {geometry.vehicles.map((v) => (
          <VehicleEditorCard
            key={v.id}
            vehicle={v}
            canRemove={geometry.vehicles.length > 1}
            isMapPickActive={mapEditVehicleId === v.id}
            onPatch={(patch) => updateVehicle(v.id, patch)}
            onRemove={() => removeVehicle(v.id)}
            onToggleMapPick={() => onMapEditVehicleChange(mapEditVehicleId === v.id ? null : v.id)}
          />
        ))}
      </ul>
    </div>
  )
}

function VehicleEditorCard({
  vehicle,
  canRemove,
  isMapPickActive,
  onPatch,
  onRemove,
  onToggleMapPick,
}: {
  vehicle: DemoVehicle
  canRemove: boolean
  isMapPickActive: boolean
  onPatch: (patch: Partial<DemoVehicle>) => void
  onRemove: () => void
  onToggleMapPick: () => void
}) {
  const tid = useId()
  const lenM = Math.round(totalPathLengthM(vehicle.positions))
  const posCount = vehicle.positions.length

  return (
    <li className="list-none rounded-lg border border-zinc-700/80 bg-zinc-900/90 p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-mono text-[10px] text-zinc-500">id: {vehicle.id}</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={onToggleMapPick}
            className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
              isMapPickActive
                ? "border border-amber-400 bg-amber-900/80 text-amber-50"
                : "border border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            }`}
          >
            {isMapPickActive ? "Map picking on" : "Pick on map"}
          </button>
          {canRemove ? (
            <button type="button" className="text-[11px] text-red-400 hover:text-red-300" onClick={onRemove}>
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <label className="mt-1 block">
        <span className="text-zinc-500">Name (popup + map)</span>
        <input
          type="text"
          className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[12px]"
          value={vehicle.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-zinc-500">Sim. speed (mph)</span>
          <input
            type="number"
            min={1}
            max={120}
            step={1}
            className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-[11px]"
            value={vehicle.simulatedSpeedMph}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (!Number.isFinite(n)) return
              onPatch({ simulatedSpeedMph: n })
            }}
          />
        </label>
        <label className="block">
          <span className="text-zinc-500">Refresh (ms)</span>
          <input
            type="number"
            min={100}
            max={30000}
            step={50}
            className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-[11px]"
            value={vehicle.positionRefreshMs}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (!Number.isFinite(n)) return
              onPatch({ positionRefreshMs: n })
            }}
          />
        </label>
      </div>
      <p className="mt-1.5 text-[10px] text-zinc-500">
        Stops: {posCount} points · ~{lenM} m along line · active stop cycles every {vehicle.positionRefreshMs} ms
      </p>
      <label className="mt-2 block" htmlFor={tid}>
        <span className="text-zinc-500">Positions (lng, lat per line) — or use Pick on map</span>
        <textarea
          id={tid}
          rows={4}
          className="mt-1 w-full resize-y rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-[10px] leading-relaxed"
          value={vehicle.positions.map((c) => `${c[0]}, ${c[1]}`).join("\n")}
          onChange={(e) => {
            const parsed = parseRouteTextarea(e.target.value)
            if (parsed) onPatch({ positions: ensureVehiclePath(parsed) })
          }}
        />
      </label>
      <label className="mt-2 block">
        <span className="text-zinc-500">Track color (hex)</span>
        <input
          type="text"
          className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-[11px]"
          placeholder="#34d399"
          value={vehicle.trackColor ?? ""}
          onChange={(e) => {
            const t = e.target.value.trim()
            onPatch({ trackColor: t || undefined })
          }}
        />
      </label>
    </li>
  )
}
