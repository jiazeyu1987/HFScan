"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Phone, MapPin, Globe, FileText, Loader2, AlertCircle, Download, RefreshCw } from "lucide-react"

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
  const [dateFilter, setDateFilter] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)
  const [updatingProcurementLink, setUpdatingProcurementLink] = useState(false)
  const [procurementLinkMessage, setProcurementLinkMessage] = useState<string | null>(null)

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
        beds_count: initialHospital.beds_count || undefined,
        departments: initialHospital.departments || undefined,
      })
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
        beds_count: undefined,
        departments: undefined,
      })
    }

    // TODO: Fetch real procurement info from API
    setProcurementInfo([
      { id: 1, title: "采购信息待获取", url: "https://example.com/1", scanned_at: "2025-11-24" },
    ])

    setLoading(false)
  }, [hospitalId, initialHospital])

  const handleSaveWebsite = () => {
    setEditingWebsite(false)
    // In real app, would call API to update
    if (hospital) {
      setHospital({ ...hospital, website: websiteValue })
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

  const filteredProcurement = procurementInfo.filter((p) => {
    if (dateFilter && p.scanned_at !== dateFilter) return false
    return true
  })

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
        <div>
          <Button onClick={onBack} variant="outline" size="sm" className="mb-4 bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{hospital.name}</h1>
          <p className="text-muted-foreground mt-1">医院详细信息 & 采购数据管理</p>
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
                  {hospital.website ? (
                    <a
                      href={`https://${hospital.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      {hospital.website}
                    </a>
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
                    {hospital.base_procurement_link ? (
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
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">采购信息</h2>
            <Button size="sm" onClick={exportData} className="gap-2">
              <Download className="w-4 h-4" />
              导出
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="按日期筛选"
              className="flex-1"
            />
            {dateFilter && (
              <Button variant="outline" size="sm" onClick={() => setDateFilter("")}>
                清除
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {filteredProcurement.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无采购信息</p>
              </div>
            ) : (
              filteredProcurement.map((item) => (
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
            共 {filteredProcurement.length} 条记录
          </div>
        </Card>
      </div>
    </div>
  )
}
