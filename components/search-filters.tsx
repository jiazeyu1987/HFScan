"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { X, Filter, RotateCcw } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Separator,
} from '@/components/ui/separator'
import {
  HOSPITAL_LEVELS,
  PROCUREMENT_STATUS_OPTIONS,
  type SearchFilters,
  type FilterConfig
} from '@/types/search'

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  disabled?: boolean
}

export function SearchFilters({
  filters,
  onFiltersChange,
  disabled = false
}: SearchFiltersProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<SearchFilters>(filters)

  // 同步外部filters状态到内部tempFilters
  useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  // 处理医院等级变化
  const handleLevelChange = (level: string, checked: boolean) => {
    const newFilters = {
      ...tempFilters,
      levels: checked
        ? [...tempFilters.levels, level]
        : tempFilters.levels.filter(l => l !== level)
    }
    setTempFilters(newFilters)
    // 立即更新父组件的过滤器状态
    onFiltersChange(newFilters)
  }

  // 处理采购链接状态变化
  const handleProcurementStatusChange = (value: string) => {
    const newFilters = {
      ...tempFilters,
      procurementStatus: value as SearchFilters['procurementStatus']
    }
    setTempFilters(newFilters)
    // 立即更新父组件的过滤器状态
    onFiltersChange(newFilters)
  }

  // 应用过滤器
  const applyFilters = () => {
    onFiltersChange(tempFilters)
    setOpen(false)
  }

  // 重置过滤器
  const resetFilters = () => {
    const emptyFilters: SearchFilters = {
      levels: [],
      procurementStatus: ''
    }
    setTempFilters(emptyFilters)
    onFiltersChange(emptyFilters)
    setOpen(false)
  }

  // 计算激活的过滤器数量
  const getActiveFiltersCount = () => {
    let count = 0
    if (tempFilters.levels.length > 0) count++
    if (tempFilters.procurementStatus) count++
    return count
  }

  // 清除单个医院等级
  const removeLevel = (level: string) => {
    handleLevelChange(level, false)
  }

  // 清除采购链接状态
  const removeProcurementStatus = () => {
    handleProcurementStatusChange('')
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={disabled}
          >
            <Filter className="w-4 h-4" />
            筛选
            {activeFiltersCount > 0 && (
              <Badge
                variant="destructive"
                className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Card className="border-0 shadow-none">
            <div className="p-4">
              {/* 标题和操作按钮 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">搜索过滤器</h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-8 w-8 p-0"
                    title="重置过滤器"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* 医院等级选择 */}
              <div className="space-y-3 mb-4">
                <Label className="text-sm font-medium">医院等级</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {HOSPITAL_LEVELS.map((level) => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={level.value}
                        checked={tempFilters.levels.includes(level.value)}
                        onCheckedChange={(checked) =>
                          handleLevelChange(level.value, checked as boolean)
                        }
                        disabled={disabled}
                      />
                      <Label
                        htmlFor={level.value}
                        className="text-sm cursor-pointer"
                      >
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              {/* 采购链接状态选择 */}
              <div className="space-y-3 mb-6">
                <Label className="text-sm font-medium">采购链接状态</Label>
                <RadioGroup
                  value={tempFilters.procurementStatus}
                  onValueChange={handleProcurementStatusChange}
                  disabled={disabled}
                >
                  {PROCUREMENT_STATUS_OPTIONS.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={status.value} id={status.value} />
                      <Label htmlFor={status.value} className="text-sm cursor-pointer">
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={applyFilters}
                  className="flex-1"
                >
                  应用
                </Button>
              </div>
            </div>
          </Card>
        </PopoverContent>
      </Popover>

      {/* 显示激活的过滤器 */}
      <div className="flex flex-wrap gap-1">
        {filters.levels.map((level) => {
          const levelOption = HOSPITAL_LEVELS.find(l => l.value === level)
          return (
            <Badge
              key={level}
              variant="secondary"
              className="text-xs gap-1 pr-1"
            >
              {levelOption?.label || level}
              <button
                onClick={() => removeLevel(level)}
                className="hover:bg-secondary-foreground/20 rounded-sm p-0.5"
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )
        })}

        {filters.procurementStatus && (
          <Badge
            variant="secondary"
            className="text-xs gap-1 pr-1"
          >
            {PROCUREMENT_STATUS_OPTIONS.find(s => s.value === filters.procurementStatus)?.label}
            <button
              onClick={removeProcurementStatus}
              className="hover:bg-secondary-foreground/20 rounded-sm p-0.5"
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}
      </div>
    </div>
  )
}