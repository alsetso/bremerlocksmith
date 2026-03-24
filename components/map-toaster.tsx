"use client"

import { Toaster } from "sonner"
import "sonner/dist/styles.css"

/** Sonner instance pinned to the top-right of `.map-stack` (see globals.css). */
export function MapToaster() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      richColors
      expand={false}
      closeButton={false}
      gap={6}
      duration={3200}
      offset={{ top: "0.5rem", right: "0.5rem" }}
      className="map-toaster"
      toastOptions={{
        classNames: {
          toast:
            "!min-h-0 !gap-2 !py-2 !px-2.5 !text-[12px] !leading-snug !rounded-lg shadow-md [&_[data-icon]]:!size-3.5 [&_[data-content]]:!gap-0",
        },
      }}
    />
  )
}
