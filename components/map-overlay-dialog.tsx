"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type MapOverlayDialogProps = {
  title: string
  titleId: string
  children: ReactNode
  onClose: () => void
  /** e.g. wider panels */
  className?: string
}

/**
 * Centered map-stack dialog: scrim + card header — matches location / future map modals.
 */
export function MapOverlayDialog({ title, titleId, children, onClose, className }: MapOverlayDialogProps) {
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[3px] transition-opacity"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-[86] flex max-h-[min(90dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-600/80 bg-zinc-900 shadow-[0_24px_64px_rgba(0,0,0,0.55)] ring-1 ring-white/5",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-700/60 px-3 py-2.5 sm:px-4">
          <h2 id={titleId} className="min-w-0 font-serif text-base font-semibold tracking-tight text-zinc-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-2 sm:px-4">{children}</div>
      </div>
    </div>
  )
}
