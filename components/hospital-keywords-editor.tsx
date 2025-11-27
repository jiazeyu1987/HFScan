"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Settings, RefreshCw, X, Plus, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/lib/api-config'

interface HospitalKeywords {
  keywords: string[]
  isCustom: boolean
  hospitalName: string
  hospitalId: number
  defaultKeywords: string[]
}

interface HospitalKeywordsEditorProps {
  hospitalId: number
  hospitalName: string
  onKeywordsUpdated?: (keywords: string[]) => void
  className?: string
}

const DEFAULT_KEYWORDS = ["公告", "采购", "公开", "招标", "询价"]

export function HospitalKeywordsEditor({
  hospitalId,
  hospitalName,
  onKeywordsUpdated,
  className = ""
}: HospitalKeywordsEditorProps) {
  const [keywords, setKeywords] = useState<string[]>([])
  const [originalKeywords, setOriginalKeywords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newKeyword, setNewKeyword] = useState("")
  const [isCustom, setIsCustom] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取医院关键词
  const fetchKeywords = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/hospital/${hospitalId}/keywords`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      setKeywords(data.keywords || [])
      setOriginalKeywords(data.keywords || [])
      setIsCustom(data.is_custom)

    } catch (err) {
      console.error('获取医院关键词失败:', err)
      setError('获取关键词失败，请稍后重试')
      toast.error('获取关键词失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 保存医院关键词
  const saveKeywords = async (keywordsToSave: string[]) => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/hospital/${hospitalId}/keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospital_id: hospitalId,
          keywords: keywordsToSave
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setKeywords(data.keywords)
        setOriginalKeywords(data.keywords)
        setIsCustom(data.is_custom)
        onKeywordsUpdated?.(data.keywords)
        toast.success('关键词保存成功')
      } else {
        throw new Error(data.message || '保存失败')
      }

    } catch (err) {
      console.error('保存医院关键词失败:', err)
      setError('保存关键词失败，请稍后重试')
      toast.error('保存关键词失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 重置为默认关键词
  const resetToDefault = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/hospital/${hospitalId}/keywords`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const defaultKeywords = data.keywords
        setKeywords(defaultKeywords)
        setOriginalKeywords(defaultKeywords)
        setIsCustom(false)
        onKeywordsUpdated?.(defaultKeywords)
        toast.success('已重置为默认关键词')
      } else {
        throw new Error(data.message || '重置失败')
      }

    } catch (err) {
      console.error('重置医院关键词失败:', err)
      setError('重置关键词失败，请稍后重试')
      toast.error('重置关键词失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 添加关键词
  const addKeyword = () => {
    const trimmed = newKeyword.trim()
    if (!trimmed) return

    if (keywords.includes(trimmed)) {
      toast.error('关键词已存在')
      return
    }

    const newKeywords = [...keywords, trimmed]
    setKeywords(newKeywords)
    setNewKeyword("")

    // 实时保存
    saveKeywords(newKeywords)
  }

  // 删除关键词
  const removeKeyword = (keywordToRemove: string) => {
    const newKeywords = keywords.filter(k => k !== keywordToRemove)
    setKeywords(newKeywords)

    // 实时保存
    saveKeywords(newKeywords)
  }

  // 处理回车键添加关键词
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addKeyword()
    }
  }

  // 检查是否有未保存的更改
  const hasUnsavedChanges = keywords.length !== originalKeywords.length ||
    keywords.some((k, i) => k !== originalKeywords[i])

  // 组件挂载时获取关键词
  useEffect(() => {
    fetchKeywords()
  }, [hospitalId])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">加载关键词中...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          医院采购关键词设置
        </CardTitle>
        {isCustom && (
          <Badge variant="secondary" className="text-xs">
            自定义
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 关键词状态显示 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            当前使用: {isCustom ? '医院自定义关键词' : '系统默认关键词'}
          </span>
          {!isCustom && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefault}
              disabled={isSaving}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              恢复默认
            </Button>
          )}
        </div>

        {/* 关键词展示区域 */}
        <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg bg-muted/50">
          {keywords.length === 0 ? (
            <span className="text-muted-foreground text-sm">
              {isCustom ? '暂无自定义关键词，使用系统默认关键词' : '使用系统默认关键词'}
            </span>
          ) : (
            keywords.map((keyword, index) => (
              <Badge
                key={index}
                variant={isCustom ? "default" : "secondary"}
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

        {/* 默认关键词参考 */}
        <div className="text-xs text-muted-foreground">
          <div className="font-medium mb-1">系统默认关键词参考：</div>
          <div className="flex flex-wrap gap-1">
            {DEFAULT_KEYWORDS.map((keyword, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        {/* 保存状态指示器 */}
        {hasUnsavedChanges && (
          <div className="flex items-center text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            有未保存的更改
          </div>
        )}
      </CardContent>
    </Card>
  )
}