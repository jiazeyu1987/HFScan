"use client"

import { Building2 } from "lucide-react"

export function TopNav() {
  return (
    <div className="border-b border-border bg-card/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">HBScan</h2>
            <p className="text-xs text-muted-foreground">Hospital Bureau Scanning</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary">系统 v1.0</span>
        </div>
      </div>
    </div>
  )
}
