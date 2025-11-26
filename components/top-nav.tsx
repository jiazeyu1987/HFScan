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
import { useSettings } from "@/lib/settings-context"

export function TopNav() {
  const [showSettings, setShowSettings] = useState(false)
  const { settings, updateSettings, resetSettings } = useSettings()

  const handleSaveSettings = () => {
    // 设置会自动保存到本地存储（通过context）
    setShowSettings(false)
  }

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
                    {/* 爬虫配置部分 */}
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
                            value={settings.crawlerMaxDepth}
                            onChange={(e) => updateSettings({
                              crawlerMaxDepth: parseInt(e.target.value) || 10
                            })}
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
                            value={settings.crawlerMaxPages}
                            onChange={(e) => updateSettings({
                              crawlerMaxPages: parseInt(e.target.value) || 150
                            })}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm"
                          />
                          <p className="text-xs text-muted-foreground">控制爬虫的最大页面数 (1-1000)</p>
                        </div>
                      </div>
                    </div>

                    {/* 采购信息显示部分 */}
                    <div className="space-y-4">
                      <Label>采购信息显示</Label>
                      <div className="space-y-2">
                        <Label htmlFor="procurementResultsPerPage" className="text-xs text-muted-foreground">
                          每页显示条数
                        </Label>
                        <select
                          id="procurementResultsPerPage"
                          value={settings.procurementResultsPerPage}
                          onChange={(e) => updateSettings({
                            procurementResultsPerPage: parseInt(e.target.value) || 20
                          })}
                          className="w-full px-3 py-2 border border-border rounded-md text-sm"
                        >
                          <option value={10}>10 条/页</option>
                          <option value={20}>20 条/页</option>
                          <option value={50}>50 条/页</option>
                          <option value={100}>100 条/页</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          控制采购信息搜索结果每页显示的数量
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <DialogFooter>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-4">
                        爬虫配置将影响网站的深度和广度，较大的值可能需要更长的处理时间。采购信息显示设置将立即生效。
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetSettings}
                        >
                          重置为默认
                        </Button>
                        <Button size="sm" onClick={handleSaveSettings}>
                          关闭设置
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
