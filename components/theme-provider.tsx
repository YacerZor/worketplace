import { ClientThemeProvider } from "@/components/client-theme-provider"
import type React from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClientThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </ClientThemeProvider>
  )
}
