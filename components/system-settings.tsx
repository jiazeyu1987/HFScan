"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Loader2, Settings, Save, X, Plus, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/lib/api-config'
import { useSettings } from '@/lib/settings-context'

export function SystemSettings() {
  const { settings, updateSettings, refreshDefaultKeywords, isLoadingKeywords } = useSettings()
  const [defaultKeywords, setDefaultKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)

  // Load current default keywords on component mount
  React.useEffect(() => {
    loadDefaultKeywords()
  }, [])

  const loadDefaultKeywords = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/settings/default-keywords`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setDefaultKeywords(data.keywords || [])

    } catch (err) {
      console.error('获取系统默认关键词失败:', err)
      setError('获取默认关键词失败，请稍后重试')
      toast.error('获取默认关键词失败')
      // Set fallback values
      setDefaultKeywords(settings.procurementKeywords)
    } finally {
      setIsLoading(false)
    }
  }

  const saveDefaultKeywords = async () => {
    if (defaultKeywords.length === 0) {
      toast.error('请至少添加一个关键词')
      return
    }
    setShowSaveConfirm(true)
  }

  const confirmSaveDefaultKeywords = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/settings/default-keywords`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: defaultKeywords
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast.success('系统默认关键词保存成功')
        // Refresh settings context to update global state
        await refreshDefaultKeywords()
      } else {
        throw new Error(data.message || '保存失败')
      }

    } catch (err) {
      console.error('保存系统默认关键词失败:', err)
      setError('保存默认关键词失败，请稍后重试')
      toast.error('保存默认关键词失败')
    } finally {
      setIsSaving(false)
      setShowSaveConfirm(false)
    }
  }

  const cancelSave = () => {
    setShowSaveConfirm(false)
  }

  const addKeyword = () => {
    const trimmed = newKeyword.trim()
    if (!trimmed) return

    if (defaultKeywords.includes(trimmed)) {
      toast.error('关键词已存在')
      return
    }

    const newKeywords = [...defaultKeywords, trimmed]
    setDefaultKeywords(newKeywords)
    setNewKeyword("")
  }

  const removeKeyword = (keywordToRemove: string) => {
    const newKeywords = defaultKeywords.filter(k => k !== keywordToRemove)
    setDefaultKeywords(newKeywords)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addKeyword()
    }
  }

  const resetToDefaults = () => {
    const fallbackKeywords = ["公告", "采购", "公开", "招标", "询价"]
    setDefaultKeywords(fallbackKeywords)
    toast.info('已重置为默认关键词')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">加载系统设置中...</span>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">系统设置</h1>
        <p className="text-muted-foreground text-sm mt-1">System Settings</p>
      </div>

      {/* 默认关键词设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            采购信息默认关键词设置
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            设置系统默认的采购信息关键词，所有医院将使用这些关键词进行采购信息扫描
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 关键词展示区域 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">当前默认关键词：</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  disabled={isSaving}
                >
                  重置默认
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDefaultKeywords}
                  disabled={isLoadingKeywords}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingKeywords ? 'animate-spin' : ''}`} />
                  刷新
                </Button>
                <Button
                  onClick={saveDefaultKeywords}
                  disabled={isSaving || defaultKeywords.length === 0}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  保存设置
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg bg-muted/50">
              {defaultKeywords.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  暂无默认关键词，请添加关键词
                </span>
              ) : (
                defaultKeywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="default"
                    className="cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => removeKeyword(keyword)}
                  >
                    {keyword}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))
              )}
            </div>

            {/* 添加关键词输入区域 */}
            <div className="flex gap-2">
              <Input
                placeholder="输入关键词，按回车添加"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSaving}
                className="flex-1"
              />
              <Button
                onClick={addKeyword}
                disabled={!newKeyword.trim() || isSaving}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* 说明信息 */}
            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">说明：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>这些关键词将作为所有医院的默认采购信息扫描关键词</li>
                <li>医院可以自定义自己的关键词，但也可以使用"恢复默认"功能使用这些系统关键词</li>
                <li>点击关键词可以删除，输入框支持回车键快速添加</li>
                <li>修改后请点击"保存设置"以应用更改</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 其他系统设置可以在这里添加 */}
      <Card>
        <CardHeader>
          <CardTitle>其他设置</CardTitle>
          <p className="text-sm text-muted-foreground">
            更多系统设置功能正在开发中
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            此区域可用于添加其他系统级设置，如爬虫配置、系统参数等。
          </div>
        </CardContent>
      </Card>
    </div>

    {/* 保存确认对话框 */}
    <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认保存系统默认关键词</AlertDialogTitle>
          <AlertDialogDescription>
            确定要保存以下关键词作为系统默认关键词吗？
            <br />
            <span className="font-medium">
              {defaultKeywords.join('、')}
            </span>
            <br />
            此更改将影响所有使用默认关键词的医院。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelSave} disabled={isSaving}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmSaveDefaultKeywords} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '确认保存'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}