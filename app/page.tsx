"use client"

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react"
import { HierarchyNav } from "@/components/hierarchy-nav"
import { TaskMonitoring } from "@/components/task-monitoring"
import { HospitalDetail } from "@/components/hospital-detail"
import { TopNav } from "@/components/top-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchBar, SearchResults } from "@/components/search-components"
import { SearchHistory } from "@/components/search-history"
import { type SearchFilters } from "@/types/search"

export default function Home() {
  const [selectedLevel, setSelectedLevel] = useState<"national" | "province" | "city" | "district" | "hospital">(
    "national",
  )
  const [hierarchyPath, setHierarchyPath] = useState<string[]>([])
  const [showHospitalDetail, setShowHospitalDetail] = useState(false)
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null)
  const [selectedHospital, setSelectedHospital] = useState<any>(null)

  // Search related states
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isFromSearch, setIsFromSearch] = useState(false)

  // Filters related states
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    levels: [],
    procurementStatus: ''
  })

  const hierarchyNavRef = useRef<any>(null)

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('hbscan_search_history')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
    }
  }, [])

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('hbscan_search_history', JSON.stringify(searchHistory))
  }, [searchHistory])

  const addToSearchHistory = (query: string) => {
    if (!query.trim()) return

    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item !== query.trim())
      newHistory.unshift(query.trim())
      return newHistory.slice(0, 5) // Keep only last 5 searches
    })
  }

  const handleSearch = async (query: string, filters?: SearchFilters) => {
    // 允许空查询，只通过过滤器搜索
    setSearchQuery(query)
    setIsSearching(true)
    setIsSearchMode(true)
    setShowSearchHistory(false)

    // 打印传入的参数
    console.log('🔍 Search called with:', { query, filters })
    console.log('🔍 Filters details:', {
      levels: filters?.levels,
      procurementStatus: filters?.procurementStatus,
      levelsLength: filters?.levels?.length
    })

    // 如果有过滤器，更新过滤器状态
    if (filters) {
      setSearchFilters(filters)
    }

    try {
      // 构建API URL参数
      const params = new URLSearchParams()

      // 如果有查询关键词，添加q参数
      if (query.trim()) {
        params.append('q', query.trim())
        // 添加到搜索历史
        addToSearchHistory(query.trim())
      }

      // 添加过滤器参数
      if (filters?.levels?.length > 0) {
        params.append('levels', filters.levels.join(','))
      }

      if (filters?.procurementStatus) {
        params.append('procurement_status', filters.procurementStatus)
      }

      // 构建完整URL
      const paramString = params.toString()
      const url = paramString
        ? `http://localhost:8000/hospitals/search?${paramString}`
        : `http://localhost:8000/hospitals/search`

      console.log('🔍 Making search request to:', url)
      console.log('🔍 URL parameters:', paramString)

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      } else {
        console.error('Search failed:', response.statusText)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSearchResult = (hospital: any) => {
    console.log('🏥 handleSelectSearchResult called with hospital:', hospital);

    setSelectedHospitalId(hospital.id)
    setSelectedHospital(hospital)
    setShowHospitalDetail(true)
    setIsFromSearch(true)
  }

  const handleSelectHospital = (hospitalId: number) => {
    console.log('🏥 handleSelectHospital called with ID:', hospitalId);

    // Get hospital data from hierarchy nav
    const hospitalData = hierarchyNavRef.current?.getSelectedHospital(hospitalId);
    console.log('🏥 Hospital data retrieved:', hospitalData);

    setSelectedHospitalId(hospitalId)
    setSelectedHospital(hospitalData)
    setShowHospitalDetail(true)
    setIsFromSearch(false)
  }

  const handleBackFromHospital = () => {
    console.log('🔙 handleBackFromHospital called');
    setShowHospitalDetail(false)
    setSelectedHospitalId(null)
    setSelectedHospital(null)

    if (isFromSearch) {
      // Return to search results
      setIsFromSearch(false)
    } else {
      // Return to hierarchy navigation
      // 调用层级导航组件的返回医院列表方法
      if (hierarchyNavRef.current) {
        console.log('✅ hierarchyNavRef.current is available, calling returnToHospitalList');
        hierarchyNavRef.current.returnToHospitalList()
      } else {
        console.log('❌ hierarchyNavRef.current is not available');
      }
    }
  }

  const handleBackFromSearch = () => {
    setIsSearchMode(false)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleSelectHistory = (query: string) => {
    handleSearch(query)
  }

  const handleClearHistory = () => {
    setSearchHistory([])
  }

  const handleCloseHistory = () => {
    setShowSearchHistory(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="flex">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          {/* Header - Always visible */}
          <div className="border-b border-border bg-card/50">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">医院采购信息管理系统</h1>
                  <p className="text-muted-foreground text-sm mt-1">Hospital Procurement Information Management</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Mode or Navigation Tabs - Always rendered but hidden when showing hospital detail */}
          <div className={`flex-1 flex flex-col ${showHospitalDetail ? 'hidden' : ''}`}>
            {!isSearchMode && !showSearchHistory ? (
              <Tabs defaultValue="navigation" className="flex-1 flex flex-col">
                <div className="border-b border-border">
                  <div className="max-w-7xl mx-auto px-6">
                    <TabsList className="bg-transparent border-b-0 h-auto p-0">
                      <TabsTrigger
                        value="navigation"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        层级导航
                      </TabsTrigger>
                      <TabsTrigger
                        value="tasks"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        任务管理
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="navigation" className="flex-1 p-6">
                  <div className="max-w-7xl mx-auto">
                    <SearchBar
                      onSearch={handleSearch}
                      onShowHistory={() => setShowSearchHistory(true)}
                      searchHistory={searchHistory}
                      filters={searchFilters}
                      onFiltersChange={setSearchFilters}
                    />
                    <HierarchyNav
                      ref={hierarchyNavRef}
                      onSelectHospital={handleSelectHospital}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="flex-1 p-6">
                  <div className="max-w-7xl mx-auto">
                    <TaskMonitoring />
                  </div>
                </TabsContent>
              </Tabs>
            ) : showSearchHistory ? (
              <div className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                  <SearchHistory
                    searchHistory={searchHistory}
                    onSelectHistory={handleSelectHistory}
                    onClearHistory={handleClearHistory}
                    onClose={handleCloseHistory}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                  <SearchResults
                    hospitals={searchResults}
                    searchQuery={searchQuery}
                    filters={searchFilters}
                    onSelectHospital={handleSelectSearchResult}
                    onBack={handleBackFromSearch}
                    loading={isSearching}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hospital Detail - Always rendered but hidden when showing navigation */}
          <div className={`flex-1 ${!showHospitalDetail ? 'hidden' : ''}`}>
            {selectedHospitalId && (
              <HospitalDetail
                hospitalId={selectedHospitalId}
                onBack={handleBackFromHospital}
                hierarchyPath={hierarchyPath}
                initialHospital={selectedHospital}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
