"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Globe, ShoppingCart, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface HospitalStatusBadgesProps {
  website?: string
  baseProcurementLink?: string
  className?: string
}

export function HospitalStatusBadges({
  website,
  baseProcurementLink,
  className = ""
}: HospitalStatusBadgesProps) {

  // 官网状态逻辑
  const getWebsiteStatus = () => {
    if (website === "无") {
      return {
        status: 'confirmed_none',
        text: '确认无数据',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-3 h-3" />
      }
    } else if (!website || website.trim() === "") {
      return {
        status: 'none',
        text: '无官网',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-3 h-3" />
      }
    } else {
      return {
        status: 'available',
        text: '有官网',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-3 h-3" />
      }
    }
  }

  // 采购链接状态逻辑
  const getProcurementStatus = () => {
    if (baseProcurementLink === "无") {
      return {
        status: 'confirmed_none',
        text: '确认无数据',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-3 h-3" />
      }
    } else if (!baseProcurementLink || baseProcurementLink.trim() === "") {
      return {
        status: 'unverified',
        text: '未鉴定',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <AlertCircle className="w-3 h-3" />
      }
    } else {
      return {
        status: 'verified',
        text: '已鉴定',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-3 h-3" />
      }
    }
  }

  const websiteStatus = getWebsiteStatus()
  const procurementStatus = getProcurementStatus()

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* 官网状态 */}
      <Badge
        variant="outline"
        className={`flex items-center gap-1 text-xs ${websiteStatus.color}`}
      >
        <Globe className="w-3 h-3" />
        {websiteStatus.icon}
        {websiteStatus.text}
      </Badge>

      {/* 采购链接状态 */}
      <Badge
        variant="outline"
        className={`flex items-center gap-1 text-xs ${procurementStatus.color}`}
      >
        <ShoppingCart className="w-3 h-3" />
        {procurementStatus.icon}
        {procurementStatus.text}
      </Badge>
    </div>
  )
}