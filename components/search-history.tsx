"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Search, X, Trash2 } from "lucide-react"

interface SearchHistoryProps {
  searchHistory: string[]
  onSelectHistory: (query: string) => void
  onClearHistory: () => void
  onClose: () => void
}

export function SearchHistory({ searchHistory, onSelectHistory, onClearHistory, onClose }: SearchHistoryProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">搜索历史</h3>
        </div>
        <div className="flex items-center gap-2">
          {searchHistory.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearHistory} className="gap-1">
              <Trash2 className="w-3 h-3" />
              清空
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* History Items */}
      {searchHistory.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">暂无搜索历史</p>
            <p className="text-sm text-muted-foreground mt-2">搜索医院后会在这里显示历史记录</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {searchHistory.map((query, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <div
                className="p-4 flex items-center justify-between"
                onClick={() => onSelectHistory(query)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{query}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  #{searchHistory.length - index}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>最多保留最近5次搜索记录</p>
      </div>
    </div>
  )
}