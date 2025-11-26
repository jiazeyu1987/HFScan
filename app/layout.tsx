import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SettingsProvider } from "@/lib/settings-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HBScan - Hospital Procurement Management",
  description: "Hospital Bureau Scanning System for Procurement Information Management",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <body className={`font-sans antialiased dark`}>
        <SettingsProvider>
          {children}
        </SettingsProvider>
        <Analytics />
      </body>
    </html>
  )
}
