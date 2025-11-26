"use client"

import { Building2, Settings } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface GlobalSettings {
  crawlerMaxDepth: number
  crawlerMaxPages: number
}

export function TopNav() {
  const [showSettings, setShowSettings] = useState(false)
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    crawlerMaxDepth: 10,
    crawlerMaxPages: 150
  })

  const handleSaveSettings = () => {
    // 保存设置到本地存储
    localStorage.setItem('hbscan_global_settings', JSON.stringify(globalSettings))
    setShowSettings(false)
  }

  const handleLoadSettings = () => {
    // 从本地存储加载设置
    try {
      const savedSettings = localStorage.getItem('hbscan_global_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setGlobalSettings({
          crawlerMaxDepth: parsed.crawlerMaxDepth || 10,
          crawlerMaxPages: parsed.crawlerMaxPages || 150
        })
      }
    } catch (error) {
      console.error('加载全局设置失败:', error)
    }
  }

  // 组件加载时加载设置
  useEffect(() => {
    handleLoadSettings()
  }, [])

  return (
    <>
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
          <div className="flex items-center gap-3">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  设置
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>全局设置</DialogTitle>
                  <DialogDescription>
                    配置爬虫的全局参数
                  </DialogDescription>
                </DialogHeader>

                <Card>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label htmlFor="maxDepth">爬虫配置</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxDepth" className="text-xs text-muted-foreground">最大深度</Label>
                          <input
                            id="maxDepth"
                            type="number"
                            min="1"
                            max="50"
                            value={globalSettings.crawlerMaxDepth}
                            onChange={(e) => setGlobalSettings(prev => ({
                              ...prev,
                              crawlerMaxDepth: parseInt(e.target.value) || 10
                            }))}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm"
                          />
                          <p className="text-xs text-muted-foreground">控制爬虫的最大深度 (1-50)</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxPages" className="text-xs text-muted-foreground">最大页面数</Label>
                          <input
                            id="maxPages"
                            type="number"
                            min="1"
                            max="1000"
                            value={globalSettings.crawlerMaxPages}
                            onChange={(e) => setGlobalSettings(prev => ({
                              ...prev,
                              crawlerMaxPages: parseInt(e.target.value) || 150
                            }))}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm"
                          />
                          <p className="text-xs text-muted-foreground">控制爬虫的最大页面数 (1-1000)</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <DialogFooter>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-4">
                        爬虫配置将影响网站的深度和广度，较大的值可能需要更长的处理时间。
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGlobalSettings({
                              crawlerMaxDepth: 10,
                              crawlerMaxPages: 150
                            })
                          }}
                        >
                          重置为默认
                        </Button>
                        <Button size="sm" onClick={handleSaveSettings}>
                          保存设置
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <span className="text-sm text-muted-foreground">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary">系统 v1.0</span>
            </span>
          </div>
        </div>
      </div>
      </>
    )
}
