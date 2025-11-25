"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Clock, Play, Loader2, Globe, MapPin, Building2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"

interface Task {
  task_id: string
  type: "HOSPITAL" | "PROVINCE" | "NATIONWIDE"
  status: "pending" | "running" | "completed" | "failed"
  progress: string
  created_at: string
  updated_at: string
  error?: string
}

export function TaskMonitoring() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("running")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchTasks = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`${API_BASE_URL}/tasks?status=${activeTab}&page=1&page_size=20`)
      const data = await response.json()
      setTasks(data.data?.items || data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setRefreshing(false)
    }
  }

  const refreshNationalData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/refresh/all`, { method: "POST" })
      const data = await response.json()
      // Add the new task to the list
      setTasks([
        {
          task_id: data.task_id,
          type: "NATIONWIDE",
          status: "pending",
          progress: "任务已创建，等待执行...",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...tasks,
      ])
      setActiveTab("running")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getTaskIcon = (type: Task["type"]) => {
    switch (type) {
      case "NATIONWIDE":
        return <Globe className="w-4 h-4" />
      case "PROVINCE":
        return <MapPin className="w-4 h-4" />
      case "HOSPITAL":
        return <Building2 className="w-4 h-4" />
    }
  }

  const getTaskLabel = (type: Task["type"]) => {
    switch (type) {
      case "NATIONWIDE":
        return "全国扫描"
      case "PROVINCE":
        return "省份刷新"
      case "HOSPITAL":
        return "医院扫描"
    }
  }

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-accent" />
      case "running":
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />
      case "failed":
        return <AlertCircle className="w-5 h-5 text-destructive" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusLabel = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "已完成"
      case "running":
        return "运行中"
      case "failed":
        return "失败"
      default:
        return "待执行"
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "all") return true
    return task.status === activeTab
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">任务管理与监控</h2>
        <Button onClick={refreshNationalData} disabled={loading} className="gap-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              启动中...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              启动全国扫描
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="running">运行中</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
          <TabsTrigger value="failed">失败</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {refreshing && (
            <div className="px-4 py-2 bg-primary/10 text-primary rounded flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              刷新中...
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">暂无任务</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card key={task.task_id} className="p-4">
                  <div className="flex items-start gap-4">
                    {getStatusIcon(task.status)}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                          {getTaskIcon(task.type)}
                          {getTaskLabel(task.type)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {getStatusLabel(task.status)}
                        </span>
                      </div>

                      <p className="text-sm text-foreground mb-2">{task.progress}</p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>创建: {new Date(task.created_at).toLocaleString("zh-CN")}</span>
                        <span>更新: {new Date(task.updated_at).toLocaleString("zh-CN")}</span>
                      </div>

                      {task.error && (
                        <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded">{task.error}</div>
                      )}
                    </div>

                    {task.status === "running" && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
