"use client"

import React, { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/lib/api-config'

interface HospitalDeleteDialogProps {
  hospitalId: number
  hospitalName: string
  onDeleteSuccess?: () => void
  trigger?: React.ReactNode
  className?: string
}

export function HospitalDeleteDialog({
  hospitalId,
  hospitalName,
  onDeleteSuccess,
  trigger,
  className = ""
}: HospitalDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      const response = await fetch(`${API_BASE_URL}/hospital/${hospitalId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || '医院删除成功')
        setIsOpen(false)
        onDeleteSuccess?.()
      } else {
        throw new Error(data.message || '删除失败')
      }

    } catch (err) {
      console.error('删除医院失败:', err)
      toast.error(err instanceof Error ? err.message : '删除医院失败，请稍后重试')
    } finally {
      setIsDeleting(false)
    }
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          删除中...
        </>
      ) : (
        <>
          <Trash2 className="w-4 h-4 mr-1" />
          删除
        </>
      )}
    </Button>
  )

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            确认删除医院
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            您确定要删除医院 <span className="font-semibold text-red-600">"{hospitalName}"</span> 吗？
            <br />
            <br />
            <span className="text-amber-600 font-medium">
              ⚠️ 注意：此操作不可恢复
            </span>
            <br />
            <span className="text-sm text-gray-600">
              • 医院将从列表中移除但历史数据会被保留
              <br />
              • 此操作可以撤销，但需要管理员操作
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}