"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface ProcurementPaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  loading?: boolean
}

export function ProcurementPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  loading = false
}: ProcurementPaginationProps) {
  const [inputPage, setInputPage] = useState<string>(currentPage.toString())

  // 计算可见页码的核心逻辑
  const visiblePages = useMemo(() => {
    if (totalPages <= 10) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = []

    // 总是显示前5页
    for (let i = 1; i <= Math.min(5, totalPages); i++) {
      pages.push(i)
    }

    // 如果总页数大于10，需要处理省略号
    if (totalPages > 10) {
      // 判断是否需要省略号
      const needsEllipsis = totalPages > 10 && currentPage < totalPages - 5

      if (needsEllipsis) {
        pages.push('ellipsis')
      }

      // 显示后5页
      const startPage = Math.max(totalPages - 4, 6)
      for (let i = startPage; i <= totalPages; i++) {
        // 避免重复添加前5页中已经包含的页码
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }
    }

    return pages
  }, [currentPage, totalPages])

  // 处理页码点击
  const handlePageClick = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && !loading) {
      onPageChange(page)
      setInputPage(page.toString())
    }
  }, [onPageChange, totalPages, loading])

  // 处理页码输入
  const handleInputSubmit = useCallback(() => {
    const page = parseInt(inputPage, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      handlePageClick(page)
    } else {
      // 重置为当前页
      setInputPage(currentPage.toString())
    }
  }, [inputPage, currentPage, totalPages, handlePageClick])

  // 处理输入框变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // 只允许数字输入
    if (value === '' || /^\d+$/.test(value)) {
      setInputPage(value)
    }
  }, [])

  // 处理键盘事件
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit()
    }
  }, [handleInputSubmit])

  // 处理失焦事件
  const handleInputBlur = useCallback(() => {
    handleInputSubmit()
  }, [handleInputSubmit])

  // 如果只有一页或者没有数据，不显示分页
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* 分页控件 */}
      <div className="flex items-center gap-2">
        {/* 首页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1 || loading}
          className="gap-1"
          aria-label="第一页"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* 上一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="gap-1"
          aria-label="上一页"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* 页码按钮 */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => (
            page === 'ellipsis' ? (
              <div
                key={`ellipsis-${index}`}
                className="px-3 py-1 text-sm text-muted-foreground"
                aria-hidden="true"
              >
                ...
              </div>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageClick(page)}
                disabled={loading}
                aria-label={`第 ${page} 页`}
                aria-current={currentPage === page ? "page" : undefined}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            )
          ))}
        </div>

        {/* 下一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="gap-1"
          aria-label="下一页"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* 末页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="gap-1"
          aria-label="最后一页"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>

        {/* 手动输入页码 */}
        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
          <span className="text-sm text-muted-foreground">跳转到</span>
          <Input
            type="text"
            value={inputPage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={handleInputBlur}
            disabled={loading}
            className="w-16 h-8 text-center"
            placeholder="页码"
            aria-label="手动输入页码"
            min={1}
            max={totalPages}
          />
          <span className="text-sm text-muted-foreground">页</span>
        </div>
      </div>

      {/* 页面信息显示 */}
      <div className="text-sm text-muted-foreground">
        第 {currentPage} 页，共 {totalPages} 页 | 总计 {totalCount} 条记录
      </div>
    </div>
  )
}