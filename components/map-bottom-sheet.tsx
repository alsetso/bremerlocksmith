"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

type MapBottomSheetProps = {
  /** When true, sheet stays fully expanded (e.g. location wizard needs the room). */
  lockExpanded?: boolean
  expanded: boolean
  onExpandedChange: (next: boolean) => void
  title: string
  children: React.ReactNode
}

export function MapBottomSheet({
  lockExpanded,
  expanded,
  onExpandedChange,
  title,
  children,
}: MapBottomSheetProps) {
  const isOpen = Boolean(lockExpanded || expanded)

  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-0 left-0 right-0 z-20 flex flex-col rounded-t-2xl border border-zinc-700/60 border-b-0 bg-[#0c0a08] shadow-[0_-12px_40px_rgba(0,0,0,0.45)] transition-[height] duration-300 ease-out",
        isOpen ? "h-[min(85dvh,520px)]" : "h-[3.25rem]",
      )}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Collapse panel" : "Expand panel"}
        onClick={() => {
          if (lockExpanded) return
          onExpandedChange(!expanded)
        }}
        className={cn(
          "flex w-full shrink-0 items-center justify-center gap-2 border-b border-zinc-800/80 py-2.5 text-zinc-300 transition-colors",
          !lockExpanded && "hover:bg-zinc-900/50",
        )}
      >
        <span className="h-1 w-10 rounded-full bg-zinc-600" aria-hidden />
        <span className="font-serif text-xs font-semibold tracking-tight text-zinc-100">{title}</span>
        {!lockExpanded &&
          (isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
          ) : (
            <ChevronUp className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
          ))}
      </button>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2 pt-1 sm:px-3 sm:pb-2 sm:pt-1.5",
          !isOpen && "hidden",
        )}
      >
        {children}
      </div>
    </div>
  )
}
