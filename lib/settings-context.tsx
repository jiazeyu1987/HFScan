"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface GlobalSettings {
  crawlerMaxDepth: number
  crawlerMaxPages: number
  procurementResultsPerPage: number
  procurementKeywords: string[]
}

interface SettingsContextType {
  settings: GlobalSettings
  updateSettings: (newSettings: Partial<GlobalSettings>) => void
  resetSettings: () => void
}

const defaultSettings: GlobalSettings = {
  crawlerMaxDepth: 10,
  crawlerMaxPages: 150,
  procurementResultsPerPage: 20,
  procurementKeywords: ["公告", "采购", "公开", "招标", "询价"]
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('hbscan_global_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({
          crawlerMaxDepth: parsed.crawlerMaxDepth || defaultSettings.crawlerMaxDepth,
          crawlerMaxPages: parsed.crawlerMaxPages || defaultSettings.crawlerMaxPages,
          procurementResultsPerPage: parsed.procurementResultsPerPage || defaultSettings.procurementResultsPerPage,
          procurementKeywords: parsed.procurementKeywords || defaultSettings.procurementKeywords
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hbscan_global_settings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings: Partial<GlobalSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}