"use client"

import { useState, useRef, forwardRef, useImperativeHandle } from "react"
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
  const [selectedHospital, setSelectedHospital] = useState<any>(null)

  const hierarchyNavRef = useRef<any>(null)

  const handleSelectHospital = (hospitalId: number) => {
    console.log('🏥 handleSelectHospital called with ID:', hospitalId);

    // Get hospital data from hierarchy nav
    const hospitalData = hierarchyNavRef.current?.getSelectedHospital(hospitalId);
    console.log('🏥 Hospital data retrieved:', hospitalData);

    setSelectedHospitalId(hospitalId)
    setSelectedHospital(hospitalData)
    setShowHospitalDetail(true)
  }

  const handleBackFromHospital = () => {
    console.log('🔙 handleBackFromHospital called');
    setShowHospitalDetail(false)
    setSelectedHospitalId(null)
    setSelectedHospital(null)
    // 调用层级导航组件的返回医院列表方法
    if (hierarchyNavRef.current) {
      console.log('✅ hierarchyNavRef.current is available, calling returnToHospitalList');
      hierarchyNavRef.current.returnToHospitalList()
    } else {
      console.log('❌ hierarchyNavRef.current is not available');
    }
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

          {/* Navigation Tabs - Always rendered but hidden when showing hospital detail */}
          <Tabs defaultValue="navigation" className={`flex-1 flex flex-col ${showHospitalDetail ? 'hidden' : ''}`}>
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
