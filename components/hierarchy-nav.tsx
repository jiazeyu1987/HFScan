"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, MapPin, Search, Loader2, AlertCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { HospitalDeleteDialog } from "@/components/hospital-delete-dialog"
import { HospitalStatusBadges } from "@/components/hospital-status-badges"

interface Province {
  id: number
  name: string
  code: string
}

interface City {
  id: number
  name: string
  province_id: number
}

interface District {
  id: number
  name: string
  city_id: number
}

interface Hospital {
  id: number
  name: string
  level: string
  address: string
  phone: string
  website?: string
  base_procurement_link?: string
  district_id: number
}

interface HierarchyNavRef {
  returnToHospitalList: () => void
  getSelectedHospital: (hospitalId: number) => Hospital | null
}

export const HierarchyNav = forwardRef<HierarchyNavRef, { onSelectHospital: (hospitalId: number) => void }>(
  ({ onSelectHospital }, ref) => {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("provinces")

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([])

  useEffect(() => {
    fetchProvinces()
  }, [])

  const fetchProvinces = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/provinces?page=1&page_size=100`)
      const data = await response.json()
      setProvinces(data.items || [])
      setActiveTab("provinces")
    } catch (err) {
      setError("Failed to load provinces")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCities = async (province: Province) => {
    try {
      setLoading(true)
      setError(null)
      setSelectedProvince(province)
      setSelectedCity(null)
      setSelectedDistrict(null)

      const response = await fetch(
        `${API_BASE_URL}/cities?province=${encodeURIComponent(province.name)}&page=1&page_size=100`,
      )
      const data = await response.json()
      setCities(data.items || [])
      setActiveTab("cities")
    } catch (err) {
      setError("Failed to load cities")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDistricts = async (city: City) => {
    try {
      setLoading(true)
      setError(null)
      setSelectedCity(city)
      setSelectedDistrict(null)

      const response = await fetch(
        `${API_BASE_URL}/districts?city=${encodeURIComponent(city.name)}&page=1&page_size=100`,
      )
      const data = await response.json()
      setDistricts(data.items || [])
      setActiveTab("districts")
    } catch (err) {
      setError("Failed to load districts")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHospitals = async (district: District) => {
    try {
      setLoading(true)
      setError(null)
      setSelectedDistrict(district)
      setSearchQuery("")

      const response = await fetch(
        `${API_BASE_URL}/hospitals?district=${encodeURIComponent(district.name)}&page=1&page_size=100`,
      )
      const data = await response.json()
      setHospitals(data.items || [])
      setFilteredHospitals(data.items || [])
      setActiveTab("hospitals")
    } catch (err) {
      setError("Failed to load hospitals")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const refreshHospitalList = async () => {
    // 如果当前选中的是某个区县，重新获取医院列表
    if (selectedDistrict) {
      await fetchHospitals(selectedDistrict)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const filtered = hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(query.toLowerCase()) || h.address.toLowerCase().includes(query.toLowerCase()),
    )
    setFilteredHospitals(filtered)
  }

  const returnToHospitalList = () => {
    console.log('🔄 returnToHospitalList called with current state:', {
      selectedProvince: selectedProvince?.name,
      selectedCity: selectedCity?.name,
      selectedDistrict: selectedDistrict?.name,
      currentTab: activeTab
    });

    // 如果之前已经选择了区县，直接返回到医院的tab
    if (selectedDistrict) {
      console.log('✅ Returning to hospitals tab for district:', selectedDistrict.name);
      setActiveTab("hospitals");
    }
    // 如果只选择了城市但没有区县，返回到区县tab
    else if (selectedCity) {
      console.log('✅ Returning to districts tab for city:', selectedCity.name);
      setActiveTab("districts");
    }
    // 如果只选择了省份，返回到城市tab
    else if (selectedProvince) {
      console.log('✅ Returning to cities tab for province:', selectedProvince.name);
      setActiveTab("cities");
    }
    // 否则返回到省份tab
    else {
      console.log('✅ Returning to provinces tab (no selection)');
      setActiveTab("provinces");
    }
  }

  const getSelectedHospital = (hospitalId: number): Hospital | null => {
    console.log('🏥 getSelectedHospital called with ID:', hospitalId);
    const hospital = hospitals.find(h => h.id === hospitalId) || null;
    console.log('🏥 Found hospital:', hospital?.name || 'Not found');
    return hospital;
  }

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    returnToHospitalList,
    getSelectedHospital
  }))

  const breadcrumbPath = [
    {
      label: "全国",
      onClick: () => {
        setSelectedProvince(null)
        setActiveTab("provinces")
      },
    },
    ...(selectedProvince
      ? [
          {
            label: selectedProvince.name,
            onClick: () => {
              setSelectedCity(null)
              setActiveTab("cities")
            },
          },
        ]
      : []),
    ...(selectedCity
      ? [
          {
            label: selectedCity.name,
            onClick: () => {
              setSelectedDistrict(null)
              setActiveTab("districts")
            },
          },
        ]
      : []),
    ...(selectedDistrict ? [{ label: selectedDistrict.name }] : []),
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 px-4 py-3 bg-card/50 rounded-lg border border-border">
        {breadcrumbPath.map((crumb, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {idx > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <button
              onClick={crumb.onClick}
              className={`text-sm font-medium transition-colors ${
                idx === breadcrumbPath.length - 1
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-primary cursor-pointer"
              }`}
            >
              {crumb.label}
            </button>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card">
          <TabsTrigger value="provinces">省份</TabsTrigger>
          <TabsTrigger value="cities" disabled={!selectedProvince}>
            城市
          </TabsTrigger>
          <TabsTrigger value="districts" disabled={!selectedCity}>
            区县
          </TabsTrigger>
          <TabsTrigger value="hospitals" disabled={!selectedDistrict}>
            医院
          </TabsTrigger>
        </TabsList>

        {/* Provinces Tab */}
        <TabsContent value="provinces" className="space-y-4">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {provinces.map((province) => (
                <Card
                  key={province.id}
                  className="p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                  onClick={() => fetchCities(province)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{province.name}</p>
                        <p className="text-xs text-muted-foreground">代码: {province.code}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cities Tab */}
        <TabsContent value="cities" className="space-y-4">
          {selectedProvince && (
            <div className="px-4 py-2 bg-primary/10 text-primary rounded text-sm font-medium">
              {selectedProvince.name} 的城市列表
            </div>
          )}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cities.map((city) => (
                <Card
                  key={city.id}
                  className="p-4 cursor-pointer hover:border-accent hover:shadow-md transition-all group"
                  onClick={() => fetchDistricts(city)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{city.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Districts Tab */}
        <TabsContent value="districts" className="space-y-4">
          {selectedCity && (
            <div className="px-4 py-2 bg-primary/10 text-primary rounded text-sm font-medium">
              {selectedCity.name} 的区县列表
            </div>
          )}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {districts.map((district) => (
                <Card
                  key={district.id}
                  className="p-4 cursor-pointer hover:border-accent hover:shadow-md transition-all group"
                  onClick={() => fetchHospitals(district)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{district.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Hospitals Tab */}
        <TabsContent value="hospitals" className="space-y-4">
          {selectedDistrict && (
            <div>
              <div className="px-4 py-2 bg-primary/10 text-primary rounded text-sm font-medium mb-4">
                {selectedDistrict.name} 的医院列表 ({filteredHospitals.length})
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索医院名称或地址..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {!loading && (
            <div className="grid grid-cols-1 gap-3">
              {filteredHospitals.map((hospital) => (
                <Card
                  key={hospital.id}
                  className="p-4 hover:bg-card/80 hover:border-accent hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onSelectHospital(hospital.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-foreground">{hospital.name}</p>
                        <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">{hospital.level}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{hospital.address}</p>
                      <p className="text-sm text-muted-foreground mb-2">{hospital.phone}</p>

                      {/* 状态指示器 */}
                      <HospitalStatusBadges
                        website={hospital.website}
                        baseProcurementLink={hospital.base_procurement_link}
                        className="mb-2"
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <HospitalDeleteDialog
                        hospitalId={hospital.id}
                        hospitalName={hospital.name}
                        onDeleteSuccess={refreshHospitalList}
                      />
                      <ChevronRight
                        className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors mt-1 cursor-pointer"
                        onClick={() => onSelectHospital(hospital.id)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
              {filteredHospitals.length === 0 && !loading && (
                <div className="py-12 text-center text-muted-foreground">
                  <p>未找到医院</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
)

HierarchyNav.displayName = 'HierarchyNav'
