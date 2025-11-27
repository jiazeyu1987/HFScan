// 搜索相关类型定义

export interface SearchFilters {
  levels: string[]                    // 医院等级数组
  procurementStatus: 'verified' | 'unconfirmed' | 'none' | ''
}

export interface SearchParams {
  query: string                       // 搜索关键词
  filters: SearchFilters              // 过滤器配置
  limit?: number                      // 结果数量限制
}

export interface SearchResponse {
  query: string                       // 搜索关键词
  limit: number | null                // 结果数量限制
  levels: string[] | null             // 使用的医院等级
  procurement_status: string | null   // 使用的采购链接状态
  results: Hospital[]                 // 搜索结果
  count: number                       // 结果数量
}

export interface Hospital {
  id: number
  name: string
  level: string                       // 医院等级
  address: string
  phone: string
  website?: string
  base_procurement_link?: string
  beds_count?: number
  departments?: string[] | string | null
  district_id: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

// 医院等级选项（基于数据库实际数据）
export const HOSPITAL_LEVELS = [
  { value: "三甲", label: "三级甲等" },
  { value: "三乙", label: "三级乙等" },
  { value: "二甲", label: "二级甲等" },
  { value: "二乙", label: "二级乙等" },
  { value: "未定级", label: "未定级" },
  { value: "无", label: "无等级" }
] as const

// 采购链接状态选项
export const PROCUREMENT_STATUS_OPTIONS = [
  { value: "verified", label: "有" },
  { value: "unconfirmed", label: "未鉴定" },
  { value: "none", label: "无" }
] as const

// 搜索过滤器配置
export interface FilterConfig {
  levels: string[]
  procurementStatus: 'verified' | 'unconfirmed' | 'none' | ''
}

// 搜索历史记录
export interface SearchHistory {
  id: string
  query: string
  filters: FilterConfig
  timestamp: number
}