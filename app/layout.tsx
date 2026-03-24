import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "mapbox-gl/dist/mapbox-gl.css"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Bremer Locksmith - 24/7 Emergency Service",
  description:
    "Bremer Locksmith — professional locksmith services available 24/7. Fast, reliable, and secure.",
  icons: {
    icon: "/key.png",
    shortcut: "/key.png",
    apple: "/key.png",
  },
  generator: "v0.app",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head></head>
      <body className={`font-sans antialiased overflow-hidden h-screen`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
