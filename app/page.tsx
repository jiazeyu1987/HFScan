"use client"

import { useState } from "react"
import { HierarchyNav } from "@/components/hierarchy-nav"
import { TaskMonitoring } from "@/components/task-monitoring"
import { HospitalDetail } from "@/components/hospital-detail"
import { TopNav } from "@/components/top-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const [selectedLevel, setSelectedLevel] = useState<"national" | "province" | "city" | "district" | "hospital">(
    "national",
  )
  const [hierarchyPath, setHierarchyPath] = useState<string[]>([])
  const [showHospitalDetail, setShowHospitalDetail] = useState(false)
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null)

  const handleSelectHospital = (hospitalId: number) => {
    setSelectedHospitalId(hospitalId)
    setShowHospitalDetail(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="flex">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          {showHospitalDetail && selectedHospitalId ? (
            <HospitalDetail
              hospitalId={selectedHospitalId}
              onBack={() => setShowHospitalDetail(false)}
              hierarchyPath={hierarchyPath}
            />
          ) : (
            <>
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
                    <HierarchyNav onSelectHospital={handleSelectHospital} />
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="flex-1 p-6">
                  <div className="max-w-7xl mx-auto">
                    <TaskMonitoring />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
