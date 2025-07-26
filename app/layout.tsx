import type { Metadata } from "next"
import { IBM_Plex_Sans_Arabic } from "next/font/google"
import { GeistSans } from "geist/font"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { Toaster } from "@/components/ui/toaster"
import type React from "react"

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
})

export const metadata: Metadata = {
  title: "WORKET PLACE - متجر الملابس الراقية",
  description: "WORKET PLACE - أحدث صيحات الموضة والملابس الراقية للرجال والنساء | متجر أونلاين",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="https://i.imgur.com/ufgqHwx.jpeg" sizes="32x32" />
      </head>
      <body className={`${arabic.variable} ${GeistSans.variable} font-arabic antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-muted/10">
              {children}
            </div>
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
