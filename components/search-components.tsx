"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Clock, Building2, ArrowLeft } from "lucide-react"
import { HospitalStatusBadges } from "@/components/hospital-status-badges"

interface Hospital {
  id: number
  name: string
  level: string
  address: string
  phone: string
  website?: string
  base_procurement_link?: string
  beds_count?: number
  departments?: string[] | string | null
}

interface SearchBarProps {
  onSearch: (query: string) => void
  onShowHistory: () => void
  searchHistory: string[]
}

export function SearchBar({ onSearch, onShowHistory, searchHistory }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
      setShowHistoryDropdown(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const selectHistoryItem = (query: string) => {
    setSearchQuery(query)
    onSearch(query)
    setShowHistoryDropdown(false)
  }

  return (
    <Card className="mb-6">
      <div className="p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜索医院名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowHistoryDropdown(true)}
              className="pl-10"
            />

            {/* Search History Dropdown */}
            {showHistoryDropdown && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-2">
                    <Clock className="w-3 h-3" />
                    最近搜索
                  </div>
                  {searchHistory.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => selectHistoryItem(query)}
                      className="w-full text-left px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded flex items-center gap-2"
                    >
                      <Search className="w-3 h-3 text-muted-foreground" />
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleSearch} className="gap-2">
            <Search className="w-4 h-4" />
            搜索
          </Button>

          {searchHistory.length > 0 && (
            <Button variant="outline" onClick={onShowHistory} className="gap-2">
              <Clock className="w-4 h-4" />
              搜索历史
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

interface SearchResultsProps {
  hospitals: Hospital[]
  searchQuery: string
  onSelectHospital: (hospital: Hospital) => void
  onBack: () => void
  loading?: boolean
}

export function SearchResults({ hospitals, searchQuery, onSelectHospital, onBack, loading }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="w-4 h-4" />
          搜索 "{searchQuery}" 找到 <span className="font-medium text-foreground"> {hospitals.length} </span> 家医院
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hospitals.map((hospital) => (
          <Card
            key={hospital.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectHospital(hospital)}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground line-clamp-2">{hospital.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{hospital.level}</p>
                </div>
                <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="line-clamp-2 text-muted-foreground">{hospital.address}</div>
                <div className="text-muted-foreground">{hospital.phone}</div>
              </div>

              {/* 状态指示器 */}
              <div className="space-y-2">
                <HospitalStatusBadges
                  website={hospital.website}
                  baseProcurementLink={hospital.base_procurement_link}
                />
                {hospital.beds_count && (
                  <Badge variant="secondary" className="text-xs">{hospital.beds_count} 床位</Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {hospitals.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">未找到匹配的医院</p>
            <p className="text-sm mt-2">请尝试其他搜索关键词</p>
          </div>
        </div>
      )}
    </div>
  )
}