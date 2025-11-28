"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Phone, MapPin, Globe, FileText, Loader2, AlertCircle, Download, RefreshCw, XCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { ProcurementPagination } from "@/components/procurement-pagination"
import { useSettings } from "@/lib/settings-context"
import { HospitalKeywordsEditor } from "./hospital-keywords-editor"

interface HospitalInfo {
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

interface ProcurementInfo {
  id: number
  title: string
  url: string
  scanned_at: string
}

interface ProcurementLinkItem {
  id: number
  base_url: string
  url: string
  link_text: string
  first_seen_at: string
  last_seen_at: string
  is_latest: boolean
}

interface ProcurementSearchRequest {
  base_url: string
  time_start: string
  time_end: string
}

interface ProcurementSearchResponse {
  success: boolean
  message: string
  total_count: number
  procurement_links: ProcurementLinkItem[]
  search_params: ProcurementSearchRequest
  request_id: string
}

const formatDate = (date: Date) => date.toISOString().split("T")[0]

const today = new Date()
const defaultEndDate = formatDate(today)
const defaultStartDate = formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))

export function HospitalDetail({
  hospitalId,
  onBack,
  hierarchyPath,
  initialHospital,
}: {
  hospitalId: number
  onBack: () => void
  hierarchyPath: string[]
  initialHospital?: HospitalInfo | null
}) {
  const [hospital, setHospital] = useState<HospitalInfo | null>(null)
  const [procurementInfo, setProcurementInfo] = useState<ProcurementInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingWebsite, setEditingWebsite] = useState(false)
  const [websiteValue, setWebsiteValue] = useState("")
  const [editingProcurementLink, setEditingProcurementLink] = useState(false)
  const [procurementLinkValue, setProcurementLinkValue] = useState("")
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)
  const [updatingProcurementLink, setUpdatingProcurementLink] = useState(false)
  const [procurementLinkMessage, setProcurementLinkMessage] = useState<string | null>(null)
  const [clearingWebsite, setClearingWebsite] = useState(false)
  const [clearingProcurementLink, setClearingProcurementLink] = useState(false)
  const [showMockProcurement, setShowMockProcurement] = useState(false)
  const [currentMockPage, setCurrentMockPage] = useState(1)

  // 新的状态变量用于真实API搜索
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<ProcurementLinkItem[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // 新增状态变量用于采购信息爬取刷新
  const [crawlLoading, setCrawlLoading] = useState(false)
  const [crawlMessage, setCrawlMessage] = useState<string | null>(null)

  // 医院关键词相关状态
  const [hospitalKeywords, setHospitalKeywords] = useState<string[]>([])
  const [isUsingHospitalKeywords, setIsUsingHospitalKeywords] = useState(false)

  // 医院名称编辑相关状态
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState("")
  const [updatingName, setUpdatingName] = useState(false)
  const [nameMessage, setNameMessage] = useState<string | null>(null)

  // 分页相关状态变量
  const [allSearchResults, setAllSearchResults] = useState<ProcurementLinkItem[]>([]) // 存储完整搜索结果
  const [searchCurrentPage, setSearchCurrentPage] = useState(1) // 当前页码

  // 使用设置上下文获取每页大小
  const { settings } = useSettings()

  // 获取医院关键词
  const fetchHospitalKeywords = async (hospitalId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/hospital/${hospitalId}/keywords`)
      if (response.ok) {
        const data = await response.json()
        setHospitalKeywords(data.keywords || [])
        setIsUsingHospitalKeywords(data.is_custom && data.keywords.length > 0)
      }
    } catch (error) {
      console.error('获取医院关键词失败:', error)
    }
  }

  // 监听设置变化，当每页数量改变时重置到第一页
  useEffect(() => {
    if (hasSearched) {
      setSearchCurrentPage(1) // 重置到第一页
    }
  }, [settings.procurementResultsPerPage, hasSearched])

  // 安全地处理departments字段
  const getDepartmentsArray = (hospital: HospitalInfo | null): string[] => {
    if (!hospital || !hospital.departments) {
      return []
    }

    // 如果已经是数组，直接返回
    if (Array.isArray(hospital.departments)) {
      return hospital.departments.filter(dept => dept && typeof dept === 'string')
    }

    // 如果是字符串，尝试分割（假设是逗号或分号分隔）
    if (typeof hospital.departments === 'string') {
      return hospital.departments
        .split(/[,，;；]/)
        .map(dept => dept.trim())
        .filter(dept => dept.length > 0)
    }

    return []
  }

  useEffect(() => {
    console.log('🏥 HospitalDetail useEffect called with:', { hospitalId, initialHospital });

    if (initialHospital) {
      console.log('🏥 Using initial hospital data:', initialHospital.name);
      setHospital({
        id: initialHospital.id,
        name: initialHospital.name,
        level: initialHospital.level,
        address: initialHospital.address,
        phone: initialHospital.phone,
        website: initialHospital.website,
        base_procurement_link: initialHospital.base_procurement_link,
        beds_count: initialHospital.beds_count || undefined,
        departments: initialHospital.departments || undefined,
      })

      // 获取医院关键词
      fetchHospitalKeywords(initialHospital.id)
    } else {
      console.log('🏥 No initial hospital provided, using fallback data for ID:', hospitalId);
      // Fallback to basic hospital info
      setHospital({
        id: hospitalId,
        name: `医院 ${hospitalId}`,
        level: "未知",
        address: "地址信息未获取",
        phone: "电话信息未获取",
        website: undefined,
        base_procurement_link: undefined,
        beds_count: undefined,
        departments: undefined,
      })

      // Initialize nameValue for editing
      if (initialHospital?.name) {
        setNameValue(initialHospital.name)
      } else {
        setNameValue(`医院 ${hospitalId}`)
      }
    }

    // TODO: Fetch real procurement info from API
    setProcurementInfo([
      { id: 1, title: "采购信息待获取", url: "https://example.com/1", scanned_at: "2025-11-24" },
    ])

    setLoading(false)
  }, [hospitalId, initialHospital])

  // Update nameValue when hospital name changes
  useEffect(() => {
    if (hospital?.name && !editingName) {
      setNameValue(hospital.name)
    }
  }, [hospital?.name, editingName])

  // 计算采购链接状态
  const hasProcurementLink = hospital?.base_procurement_link &&
                             hospital.base_procurement_link !== "无" &&
                             hospital.base_procurement_link.trim() !== ""

  // 计算官网状态
  const hasWebsite = hospital?.website &&
                     hospital.website !== "无" &&
                     hospital.website.trim() !== ""

  const handleSaveWebsite = () => {
    setEditingWebsite(false)
    // In real app, would call API to update
    if (hospital) {
      setHospital({ ...hospital, website: websiteValue })
    }
  }

  const handleClearWebsite = async () => {
    if (!hospital) return

    setClearingWebsite(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/hospital/website/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospital_id: hospital.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Update local state
        setHospital({ ...hospital, website: "无" })
        setWebsiteValue("无")

        // Operation completed without alert
      } else {
        throw new Error(data.message || '设置失败')
      }

    } catch (err) {
      console.error('清除官网失败:', err)
      // Operation failed without alert
    } finally {
      setClearingWebsite(false)
    }
  }

  const handleSaveProcurementLink = async () => {
    if (!hospital) return

    setUpdatingProcurementLink(true)
    setProcurementLinkMessage(null)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/hospital/base-procurement-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospital_name: hospital.name,
          base_procurement_link: procurementLinkValue
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setHospital(prev => prev ? {
          ...prev,
          base_procurement_link: procurementLinkValue
        } : null)

        setProcurementLinkMessage(`基础采购链接更新成功`)

        // Clear success message after 3 seconds
        setTimeout(() => {
          setProcurementLinkMessage(null)
        }, 3000)
      } else {
        throw new Error(data.message || '更新失败')
      }

    } catch (error) {
      console.error('更新基础采购链接失败:', error)
      setError(error instanceof Error ? error.message : '更新基础采购链接失败')
      setProcurementLinkMessage('更新失败，请重试')

      // Clear error message after 5 seconds
      setTimeout(() => {
        setProcurementLinkMessage(null)
      }, 5000)
    } finally {
      setUpdatingProcurementLink(false)
      setEditingProcurementLink(false)
    }
  }

  const handleClearProcurementLink = async () => {
    if (!hospital) return

    setClearingProcurementLink(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/hospital/base-procurement-link/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospital_id: hospital.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Update local state
        setHospital({ ...hospital, base_procurement_link: "无" })
        setProcurementLinkValue("无")

        // Operation completed without alert
      } else {
        throw new Error(data.message || '设置失败')
      }

    } catch (err) {
      console.error('清除基础采购链接失败:', err)
      // Operation failed without alert
    } finally {
      setClearingProcurementLink(false)
    }
  }

  const handleRefreshHospitalInfo = async () => {
    if (!hospital) return

    setRefreshing(true)
    setRefreshMessage(null)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/hospital/website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospital_name: hospital.name,
          force_update: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Update hospital information with the refreshed website data
      if (data.data) {
        const hospitalData = data.data;
        setHospital(prev => prev ? {
          ...prev,
          website: hospitalData.new_website || prev.website,
          // Update other fields if available in the response
          hospital_name: hospitalData.hospital_name || prev.name,
        } : null)
      }

      setRefreshMessage(`医院信息已更新，网站: ${data.data?.new_website || data.data?.previous_website || '未找到'}`)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setRefreshMessage(null)
      }, 3000)

    } catch (error) {
      console.error('刷新医院信息失败:', error)
      setError(error instanceof Error ? error.message : '刷新医院信息失败')

      // Clear error message after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
    } finally {
      setRefreshing(false)
    }
  }

  const handleUpdateHospitalName = async () => {
    if (!hospital || !nameValue.trim()) return

    setUpdatingName(true)
    setNameMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/hospital/${hospital.id}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospital_id: hospital.id,
          name: nameValue.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = `HTTP error! status: ${response.status}`

        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((item: any) =>
              typeof item === 'string' ? item : item.msg || JSON.stringify(item)
            ).join('; ')
          } else if (typeof errorData.detail === 'object') {
            errorMessage = JSON.stringify(errorData.detail)
          }
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Update hospital name in local state
      setHospital(prev => prev ? {
        ...prev,
        name: data.new_name
      } : null)

      setNameMessage(`医院名称已成功更新为: ${data.new_name}`)
      setEditingName(false)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setNameMessage(null)
      }, 3000)

    } catch (error) {
      console.error('Error updating hospital name:', error)
      setError(`更新医院名称失败: ${error instanceof Error ? error.message : '未知错误'}`)

      // Clear error message after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
    } finally {
      setUpdatingName(false)
    }
  }

  const filteredProcurement = procurementInfo.filter((p) => {
    const recordDate = new Date(p.scanned_at)

    if (startDate) {
      const start = new Date(startDate)
      if (recordDate < start) return false
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      if (recordDate > end) return false
    }

    return true
  })

  const mockProcurementLinks = [
    {
      id: 1,
      link_text: "关于医疗设备采购项目的公开招标公告",
      url: "https://example.com/procurement/1",
    },
    {
      id: 2,
      link_text: "一次性耗材集中采购询价公告",
      url: "https://example.com/procurement/2",
    },
    {
      id: 3,
      link_text: "信息化系统升级项目公开招标公告",
      url: "https://example.com/procurement/3",
    },
    {
      id: 4,
      link_text: "检验试剂年度采购项目公告",
      url: "https://example.com/procurement/4",
    },
    {
      id: 5,
      link_text: "病房家具采购询价公告",
      url: "https://example.com/procurement/5",
    },
    {
      id: 6,
      link_text: "影像科设备维护服务采购公开公告",
      url: "https://example.com/procurement/6",
    },
    {
      id: 7,
      link_text: "后勤保障车辆采购招标公告",
      url: "https://example.com/procurement/7",
    },
    {
      id: 8,
      link_text: "智能药房系统建设项目采购公告",
      url: "https://example.com/procurement/8",
    },
    {
      id: 9,
      link_text: "住院大楼装修工程公开招标公告",
      url: "https://example.com/procurement/9",
    },
    {
      id: 10,
      link_text: "医用氧气集中供应系统改造采购公告",
      url: "https://example.com/procurement/10",
    },
  ]

  const MOCK_PAGE_SIZE = 20
  const mockTotalPages = Math.max(1, Math.ceil(mockProcurementLinks.length / MOCK_PAGE_SIZE))
  const currentMockPageSafe = Math.min(currentMockPage, mockTotalPages)
  const pagedMockProcurementLinks = mockProcurementLinks.slice(
    (currentMockPageSafe - 1) * MOCK_PAGE_SIZE,
    currentMockPageSafe * MOCK_PAGE_SIZE
  )

  // 真实搜索结果分页计算
  const searchTotalCount = allSearchResults.length
  const searchPageSize = settings.procurementResultsPerPage // 使用设置中的页面大小
  const searchTotalPages = Math.max(1, Math.ceil(searchTotalCount / searchPageSize))
  const currentSearchPageSafe = Math.min(searchCurrentPage, searchTotalPages)

  // 计算当前页显示的搜索结果
  const currentSearchResults = allSearchResults.slice(
    (currentSearchPageSafe - 1) * searchPageSize,
    currentSearchPageSafe * searchPageSize
  )

  // 处理分页切换的函数
  const handleSearchPageChange = (page: number) => {
    setSearchCurrentPage(page)
    // 滚动到搜索结果顶部
    const searchResultsElement = document.getElementById('search-results-container')
    if (searchResultsElement) {
      searchResultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 采购信息搜索API函数
  const searchProcurement = async () => {
    if (!hospital?.base_procurement_link) {
      setSearchError("该医院未设置基础采购链接，无法搜索采购信息")
      return
    }

    if (startDate > endDate) {
      setSearchError("开始时间不能晚于结束时间")
      return
    }

    setSearchLoading(true)
    setSearchError(null)
    setShowMockProcurement(false) // 隐藏mock数据

    try {
      const requestBody: ProcurementSearchRequest = {
        base_url: hospital.base_procurement_link,
        time_start: startDate,
        time_end: endDate
      }

      const response = await fetch(`${API_BASE_URL}/procurement/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ProcurementSearchResponse = await response.json()

      if (data.success) {
        setAllSearchResults(data.procurement_links) // 存储完整搜索结果
        setSearchResults(data.procurement_links) // 保持向后兼容
        setSearchCurrentPage(1) // 重置到第一页
        setHasSearched(true)
      } else {
        setSearchError(data.message || '搜索失败')
        setSearchResults([])
        setAllSearchResults([])
      }
    } catch (error) {
      console.error('搜索采购信息失败:', error)
      setSearchError(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setSearchResults([])
      setAllSearchResults([])
      setSearchCurrentPage(1)
    } finally {
      setSearchLoading(false)
    }
  }

  // 采购信息爬取刷新函数
  const crawlProcurement = async () => {
    if (!hospital?.base_procurement_link) {
      setCrawlMessage("该医院未设置基础采购链接，无法爬取采购信息")
      return
    }

    setCrawlLoading(true)
    setCrawlMessage(null)

    try {
      // 确定使用的关键词：优先使用医院特定关键词，否则使用系统默认关键词
      let finalKeywords: string[]
      let keywordSource: string

      if (isUsingHospitalKeywords && hospitalKeywords.length > 0) {
        finalKeywords = hospitalKeywords.filter(keyword => keyword.trim() !== '')
        keywordSource = "医院自定义关键词"
      } else {
        finalKeywords = settings.procurementKeywords.filter(keyword => keyword.trim() !== '')
        keywordSource = "系统默认关键词"
      }

      // 确保至少有默认关键词
      if (finalKeywords.length === 0) {
        finalKeywords = ["公告", "采购", "公开", "招标", "询价"]
        keywordSource = isUsingHospitalKeywords ? "医院默认关键词" : "系统默认关键词"
      }

      const requestBody = {
        hospital_id: hospital.id, // 添加医院ID以支持后端关键词优先级
        base_url: hospital.base_procurement_link,
        max_depth: settings.crawlerMaxDepth,
        max_pages: settings.crawlerMaxPages,
        keywords: finalKeywords
      }

      const response = await fetch(`${API_BASE_URL}/procurement/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.base_url) {
        // 构建关键词信息显示
        const keywordsInfo = `${keywordSource} (${finalKeywords.join(', ')})`
        setCrawlMessage(
          `采购信息爬取成功！发现 ${data.total_urls} 个链接，新增或更新 ${data.new_or_updated} 条记录\n使用关键词: ${keywordsInfo}`
        )

        // 爬取成功后自动刷新搜索结果
        setTimeout(() => {
          searchProcurement()
        }, 1000)
      } else {
        throw new Error('爬取响应格式错误')
      }
    } catch (error) {
      console.error('爬取采购信息失败:', error)
      setCrawlMessage(`爬取失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setCrawlLoading(false)

      // 清除成功消息 5 秒后
      setTimeout(() => {
        setCrawlMessage(null)
      }, 5000)
    }
  }

  const exportData = () => {
    const data = {
      hospital: hospital,
      procurement: filteredProcurement,
      exportedAt: new Date().toISOString(),
    }
    const csv = [
      ["医院信息导出"],
      ["医院名称", hospital?.name],
      ["医院等级", hospital?.level],
      ["地址", hospital?.address],
      ["电话", hospital?.phone],
      ["官网", hospital?.website],
      [""],
      ["采购信息列表"],
      ["序号", "标题", "链接", "扫描时间"],
      ...filteredProcurement.map((p, i) => [i + 1, p.title, p.url, p.scanned_at]),
    ]
    const csvContent = csv.map((row) => row.join(",")).join("\n")
    const link = document.createElement("a")
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
    link.download = `${hospital?.name}_采购信息_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !hospital) {
    return (
      <div className="p-6">
        <Button onClick={onBack} variant="outline" className="mb-4 bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" /> 返回
        </Button>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          {error || "医院信息加载失败"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Button onClick={onBack} variant="outline" size="sm" className="mb-4 bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回
          </Button>

          {/* Hospital Name with Editing */}
          <div className="flex items-center gap-3 mb-2">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1 max-w-2xl">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="医院名称"
                  className="text-3xl font-bold h-12"
                  disabled={updatingName}
                />
                <Button
                  onClick={handleUpdateHospitalName}
                  disabled={updatingName || !nameValue.trim()}
                  size="sm"
                  className="gap-2"
                >
                  {updatingName ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      保存中
                    </>
                  ) : (
                    "保存"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setEditingName(false)
                    setNameValue(hospital?.name || "")
                  }}
                  variant="outline"
                  size="sm"
                  disabled={updatingName}
                >
                  取消
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{hospital.name}</h1>
                <Button
                  onClick={() => {
                    setEditingName(true)
                    setNameValue(hospital?.name || "")
                  }}
                  variant="ghost"
                  size="sm"
                  className="gap-1 opacity-60 hover:opacity-100"
                  title="编辑医院名称"
                >
                  <RefreshCw className="w-4 h-4" />
                  编辑
                </Button>
              </div>
            )}
          </div>

          {/* Name Update Message */}
          {nameMessage && (
            <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{nameMessage}</p>
            </div>
          )}

          <p className="text-muted-foreground">医院详细信息 & 采购数据管理</p>
        </div>
        <span className="text-lg font-semibold bg-accent/20 text-accent px-4 py-2 rounded-lg">{hospital.level}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hospital Info Card */}
        <Card className="lg:col-span-1 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">基础信息</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshHospitalInfo}
              disabled={refreshing}
              className="gap-2"
              title="刷新医院信息"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '刷新中' : '刷新信息'}
            </Button>
          </div>

          {/* Refresh Status Messages */}
          {refreshMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{refreshMessage}</p>
            </div>
          )}

          {error && !refreshMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">刷新失败: {error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">地址</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-foreground text-sm">{hospital.address}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">电话</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <p className="text-foreground text-sm">{hospital.phone}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">官网</p>
              {editingWebsite ? (
                <div className="flex gap-2">
                  <Input
                    value={websiteValue}
                    onChange={(e) => setWebsiteValue(e.target.value)}
                    placeholder="输入官网地址"
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleSaveWebsite}>
                    保存
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  {hospital.website && hospital.website !== "无" && hospital.website.trim() !== "" ? (
                    <a
                      href={`https://${hospital.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 hover:underline text-sm font-medium"
                    >
                      {hospital.website}
                    </a>
                  ) : hospital.website === "无" ? (
                    <span className="text-red-600 text-sm font-medium">无</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">未设置</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingWebsite(true)
                      setWebsiteValue(hospital.website || "")
                    }}
                    className="text-xs"
                  >
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearWebsite}
                    disabled={clearingWebsite}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 p-2"
                    title="设置无官网"
                  >
                    {clearingWebsite ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">基础采购链接</p>
              {editingProcurementLink ? (
                <div className="flex gap-2">
                  <Input
                    value={procurementLinkValue}
                    onChange={(e) => setProcurementLinkValue(e.target.value)}
                    placeholder="输入基础采购链接"
                    className="text-sm"
                    disabled={updatingProcurementLink}
                  />
                  <Button size="sm" onClick={handleSaveProcurementLink} disabled={updatingProcurementLink}>
                    {updatingProcurementLink ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中
                      </>
                    ) : (
                      '保存'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProcurementLink(false)
                      setProcurementLinkValue(hospital?.base_procurement_link || "")
                      setProcurementLinkMessage(null)
                    }}
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {hospital.base_procurement_link === "无" ? (
                      <span className="text-red-600 text-sm">无采购链接</span>
                    ) : hospital.base_procurement_link ? (
                      <a
                        href={hospital.base_procurement_link.startsWith('http')
                          ? hospital.base_procurement_link
                          : `https://${hospital.base_procurement_link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        采购平台
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">未设置</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingProcurementLink(true)
                      setProcurementLinkValue(hospital?.base_procurement_link || "")
                      setProcurementLinkMessage(null)
                    }}
                    className="text-xs"
                  >
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearProcurementLink}
                    disabled={clearingProcurementLink}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 p-2"
                    title="设置无采购链接"
                  >
                    {clearingProcurementLink ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              )}

              {/* Update Status Messages */}
              {procurementLinkMessage && (
                <div className={`p-2 rounded-lg text-sm ${
                  procurementLinkMessage.includes('成功')
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : procurementLinkMessage.includes('失败') || procurementLinkMessage.includes('错误')
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  {procurementLinkMessage}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">床位数</p>
              <p className="text-foreground text-sm font-medium">{hospital.beds_count || "暂无"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">主要科室</p>
              <div className="flex flex-wrap gap-2">
                {getDepartmentsArray(hospital).length > 0 ? (
                  getDepartmentsArray(hospital).map((dept, i) => (
                    <span key={i} className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded">
                      {dept}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">暂无科室信息</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Procurement Info Card */}
        <Card className={`lg:col-span-2 p-6 space-y-4 transition-all duration-300 ${
          hasProcurementLink
            ? 'opacity-100'
            : 'opacity-50 bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">采购信息</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={searchProcurement}
                disabled={searchLoading || !hasProcurementLink}
                className="gap-2"
              >
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                搜索
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={crawlProcurement}
                disabled={crawlLoading || !hasProcurementLink}
                className="gap-2"
                title="爬取最新的采购信息"
              >
                {crawlLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {crawlLoading ? '爬取中' : '刷新采购信息'}
              </Button>
              <Button
                size="sm"
                onClick={exportData}
                className="gap-2"
                disabled={!hasProcurementLink}
              >
                <Download className="w-4 h-4" />
                导出
              </Button>
            </div>
          </div>

          {/* 医院关键词设置 */}
          <div className={`mt-4 ${!hasProcurementLink ? 'opacity-50 pointer-events-none' : ''}`}>
            <HospitalKeywordsEditor
              hospitalId={hospital.id}
              hospitalName={hospital.hospitalName || hospital.name || ''}
              onKeywordsUpdated={(keywords) => {
                // 当关键词更新时，同步更新本地状态
                setHospitalKeywords(keywords)
                setIsUsingHospitalKeywords(keywords.length > 0)
                console.log('关键词已更新:', keywords)
              }}
            />
          </div>

          <div className={`flex gap-2 mb-4 ${!hasProcurementLink ? 'opacity-50' : ''}`}>
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">开始时间</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="开始时间"
                className="w-full"
                disabled={!hasProcurementLink}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">结束时间</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="结束时间"
                className="w-full"
                disabled={!hasProcurementLink}
              />
            </div>
          </div>

          {/* 无采购链接提示信息 */}
          {!hasProcurementLink && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">未设置采购链接</p>
                  <p className="text-xs mt-1 opacity-90">
                    请先在基础信息中设置医院的采购链接，然后才能使用采购信息搜索和爬取功能。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 搜索结果显示区域 */}

          {/* 爬取状态消息显示 */}
          {crawlMessage && (
            <div className={`rounded-lg p-3 mb-4 ${
              crawlMessage.includes('成功')
                ? 'bg-green-50 border border-green-200'
                : crawlMessage.includes('失败') || crawlMessage.includes('错误')
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className={`flex items-center gap-2 text-sm ${
                crawlMessage.includes('成功')
                  ? 'text-green-800'
                  : crawlMessage.includes('失败') || crawlMessage.includes('错误')
                  ? 'text-red-800'
                  : 'text-blue-800'
              }`}>
                <RefreshCw className="w-4 h-4" />
                {crawlMessage}
              </div>
            </div>
          )}

          {/* 错误信息显示 */}
          {searchError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {searchError}
              </div>
            </div>
          )}

          {/* 真实搜索结果显示 */}
          {hasSearched && (
            <div id="search-results-container" className="space-y-4 mb-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">采购信息搜索结果</h3>
                  {searchTotalCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      第 {searchCurrentPage} 页，共 {searchTotalPages} 页
                    </span>
                  )}
                </div>
                {allSearchResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>未找到匹配的采购信息</p>
                    <p className="text-sm mt-1">请尝试调整搜索条件或时间范围</p>
                  </div>
                ) : (
                  <>
                    <ul className="space-y-2 list-disc pl-5">
                      {currentSearchResults.map((link) => (
                        <li key={link.id}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {link.link_text}
                          </a>
                          <div className="text-xs text-muted-foreground mt-1 ml-5">
                            首次发现: {new Date(link.first_seen_at).toLocaleDateString("zh-CN")} |
                            最后发现: {new Date(link.last_seen_at).toLocaleDateString("zh-CN")} |
                            {link.is_latest ? (
                              <span className="text-green-600 font-medium">最新</span>
                            ) : (
                              <span>历史记录</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {/* 分页组件 - 只有结果超过20条时才显示 */}
                    {searchTotalPages > 1 && (
                      <ProcurementPagination
                        currentPage={searchCurrentPage}
                        totalPages={searchTotalPages}
                        totalCount={searchTotalCount}
                        pageSize={searchPageSize}
                        onPageChange={handleSearchPageChange}
                        loading={searchLoading}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* 保留mock数据显示（向后兼容） */}
          {showMockProcurement && (
            <div className="space-y-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">搜索结果（示例数据）</h3>
                <ul className="space-y-2 list-disc pl-5">
                  {pagedMockProcurementLinks.map((link) => (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {link.link_text}
                      </a>
                    </li>
                  ))}
                </ul>
                {mockTotalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-2 border-t border-border mt-4">
                    {Array.from({ length: mockTotalPages }).map((_, index) => {
                      const page = index + 1
                      return (
                        <Button
                          key={page}
                          size="sm"
                          variant={page === currentMockPageSafe ? "default" : "outline"}
                          onClick={() => setCurrentMockPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredProcurement.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无采购信息</p>
              </div>
            ) : (
              filteredProcurement
                .filter((item) => item.id !== 1 || item.url !== "https://example.com/1")
                .map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-border rounded-lg hover:bg-card/80 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm group-hover:text-accent transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        扫描时间: {new Date(item.scanned_at).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs font-medium whitespace-nowrap"
                    >
                      查看详情 →
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-border text-xs text-muted-foreground">
            共 {filteredProcurement.length + (showMockProcurement ? pagedMockProcurementLinks.length : 0) + currentSearchResults.length} 条记录
          </div>
        </Card>

  
      </div>
    </div>
  )
}
