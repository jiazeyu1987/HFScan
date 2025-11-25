"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Phone, MapPin, Globe, FileText, Loader2, AlertCircle, Download } from "lucide-react"

interface HospitalInfo {
  id: number
  name: string
  level: string
  address: string
  phone: string
  website?: string
  beds_count?: number
  departments?: string[]
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
}: {
  hospitalId: number
  onBack: () => void
  hierarchyPath: string[]
}) {
  const [hospital, setHospital] = useState<HospitalInfo | null>(null)
  const [procurementInfo, setProcurementInfo] = useState<ProcurementInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingWebsite, setEditingWebsite] = useState(false)
  const [websiteValue, setWebsiteValue] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  useEffect(() => {
    // Simulating hospital detail fetch - in real app, would use the API
    // For now using mock data
    setHospital({
      id: hospitalId,
      name: "广东省人民医院",
      level: "三级甲等",
      address: "广州市越秀区中山二路106号",
      phone: "020-83827812",
      website: "www.gdph.org.cn",
      beds_count: 2800,
      departments: ["内科", "外科", "妇产科", "儿科", "急诊科", "神经科"],
    })

    setProcurementInfo([
      { id: 1, title: "医疗设备采购招标公告", url: "https://example.com/1", scanned_at: "2025-11-24" },
      { id: 2, title: "药品集中采购计划", url: "https://example.com/2", scanned_at: "2025-11-23" },
      { id: 3, title: "检查试剂采购信息", url: "https://example.com/3", scanned_at: "2025-11-22" },
    ])

    setLoading(false)
  }, [hospitalId])

  const handleSaveWebsite = () => {
    setEditingWebsite(false)
    // In real app, would call API to update
    if (hospital) {
      setHospital({ ...hospital, website: websiteValue })
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
          <h2 className="text-lg font-semibold text-foreground">基础信息</h2>

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
              <p className="text-sm text-muted-foreground mb-1">床位数</p>
              <p className="text-foreground text-sm font-medium">{hospital.beds_count || "暂无"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">主要科室</p>
              <div className="flex flex-wrap gap-2">
                {hospital.departments?.map((dept, i) => (
                  <span key={i} className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded">
                    {dept}
                  </span>
                ))}
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
