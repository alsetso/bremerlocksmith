"use client"

import { createClient } from "@supabase/supabase-js"

const projectRef = process.env.NEXT_PUBLIC_DATABASE_PROJECT_ID
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? (projectRef ? `https://${projectRef}.supabase.co` : "")
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export const hasSupabaseBrowserConfig = Boolean(supabaseUrl && supabaseAnonKey)

let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (!hasSupabaseBrowserConfig) return null
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return browserClient
}
