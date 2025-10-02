"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Activity,
  ShoppingCart,
  Download,
  RefreshCw,
  Building2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Database,
  LineChart,
  Users,
  Layers,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
} from "recharts"
import { getProducts, type Product } from "@/lib/firebase-operations"
import { getGMs, type GM } from "@/lib/firebase-gm-operations"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

const parsePrice = (price: string | number | undefined): number => {
  if (typeof price === "number") return price
  if (!price) return 0
  const cleaned = String(price).replace(/[^\d.]/g, "")
  return Number.parseFloat(cleaned) || 0
}

const filterByDateRange = (items: (Product | GM)[], range: string) => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  return items.filter((item) => {
    if (!item.lastSold) return false
    const lastSoldDate = item.lastSold.toDate()

    switch (range) {
      case "today":
        return lastSoldDate >= startOfToday
      case "yesterday":
        return lastSoldDate >= startOfYesterday && lastSoldDate < startOfToday
      case "7d":
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return lastSoldDate >= sevenDaysAgo
      case "30d":
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return lastSoldDate >= thirtyDaysAgo
      case "1y":
        const oneYearAgo = new Date(now)
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        return lastSoldDate >= oneYearAgo
      default:
        return true
    }
  })
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [productsData, setProductsData] = useState<Product[]>([])
  const [gmsData, setGmsData] = useState<GM[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [products, gms] = await Promise.all([getProducts(), getGMs()])
      setProductsData(products.filter((p) => !p.isStatic || p.sold || p.lastSold))
      setGmsData(gms.filter((g) => !g.isStatic || g.sold || g.lastSold))
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const filteredProducts = filterByDateRange(productsData, timeRange)
  const filteredGMs = filterByDateRange(gmsData, timeRange)

  const productsAnalytics = {
    totalItems: productsData.length || 0,
    totalSales: filteredProducts.reduce((sum, product) => sum + (product.sold || 0), 0),
    totalRevenue: filteredProducts.reduce((sum, product) => sum + (product.sold || 0) * parsePrice(product.narxi), 0),
    totalStock: productsData.reduce((sum, product) => sum + (product.stock || 0), 0),
    averagePrice:
      productsData.length > 0
        ? productsData.reduce((sum, product) => sum + parsePrice(product.narxi), 0) / productsData.length
        : 0,
    lowStockItems: productsData.filter((product) => (product.stock || 0) <= (product.minStock || 5)).length,
    outOfStockItems: productsData.filter((product) => (product.stock || 0) === 0).length,
    inventoryValue: productsData.reduce((sum, product) => sum + (product.stock || 0) * parsePrice(product.narxi), 0),
  }

  const gmsAnalytics = {
    totalItems: gmsData.length || 0,
    totalSales: filteredGMs.reduce((sum, gm) => sum + (gm.sold || 0), 0),
    totalRevenue: filteredGMs.reduce((sum, gm) => sum + (gm.sold || 0) * parsePrice(gm.narxi), 0),
    totalStock: gmsData.reduce((sum, gm) => sum + (gm.stock || 0), 0),
    averagePrice: gmsData.length > 0 ? gmsData.reduce((sum, gm) => sum + parsePrice(gm.narxi), 0) / gmsData.length : 0,
    lowStockItems: gmsData.filter((gm) => (gm.stock || 0) <= (gm.minStock || 5)).length,
    outOfStockItems: gmsData.filter((gm) => (gm.stock || 0) === 0).length,
    inventoryValue: gmsData.reduce((sum, gm) => sum + (gm.stock || 0) * parsePrice(gm.narxi), 0),
  }

  const combinedAnalytics = {
    totalItems: productsAnalytics.totalItems + gmsAnalytics.totalItems,
    totalSales: productsAnalytics.totalSales + gmsAnalytics.totalSales,
    totalRevenue: productsAnalytics.totalRevenue + gmsAnalytics.totalRevenue,
    totalStock: productsAnalytics.totalStock + gmsAnalytics.totalStock,
    averagePrice:
      productsAnalytics.totalItems + gmsAnalytics.totalItems > 0
        ? (productsAnalytics.averagePrice * productsAnalytics.totalItems +
            gmsAnalytics.averagePrice * gmsAnalytics.totalItems) /
          (productsAnalytics.totalItems + gmsAnalytics.totalItems)
        : 0,
    lowStockItems: productsAnalytics.lowStockItems + gmsAnalytics.lowStockItems,
    outOfStockItems: productsAnalytics.outOfStockItems + gmsAnalytics.outOfStockItems,
    inventoryValue: productsAnalytics.inventoryValue + gmsAnalytics.inventoryValue,
    profitMargin: (() => {
      const totalRevenue = productsAnalytics.totalRevenue + gmsAnalytics.totalRevenue
      const totalProfit =
        filteredProducts.reduce(
          (sum, product) => sum + (parsePrice(product.narxi) - parsePrice(product.cost)) * (product.sold || 0),
          0,
        ) + filteredGMs.reduce((sum, gm) => sum + (parsePrice(gm.narxi) - parsePrice(gm.cost)) * (gm.sold || 0), 0)
      return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    })(),
  }

  const generateSalesTrendData = () => {
    const daysToShow = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "1y" ? 12 : 30
    const isMonthly = timeRange === "1y"
    const data: any[] = []

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date()
      if (isMonthly) {
        date.setMonth(date.getMonth() - i)
      } else {
        date.setDate(date.getDate() - i)
      }

      const dateStr = isMonthly
        ? date.toLocaleDateString("en-US", { month: "short" })
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

      const dayProducts = filteredProducts.filter((p) => {
        if (!p.lastSold) return false
        const soldDate = p.lastSold.toDate()
        if (isMonthly) {
          return soldDate.getMonth() === date.getMonth() && soldDate.getFullYear() === date.getFullYear()
        }
        return soldDate.toDateString() === date.toDateString()
      })

      const dayGMs = filteredGMs.filter((g) => {
        if (!g.lastSold) return false
        const soldDate = g.lastSold.toDate()
        if (isMonthly) {
          return soldDate.getMonth() === date.getMonth() && soldDate.getFullYear() === date.getFullYear()
        }
        return soldDate.toDateString() === date.toDateString()
      })

      const productsSales = dayProducts.reduce((sum, p) => sum + (p.sold || 0), 0)
      const gmsSales = dayGMs.reduce((sum, g) => sum + (g.sold || 0), 0)
      const productsRevenue = dayProducts.reduce((sum, p) => sum + (p.sold || 0) * parsePrice(p.narxi), 0)
      const gmsRevenue = dayGMs.reduce((sum, g) => sum + (g.sold || 0) * parsePrice(g.narxi), 0)

      data.push({
        date: dateStr,
        products: productsSales,
        gms: gmsSales,
        productsRevenue,
        gmsRevenue,
      })
    }

    return data
  }

  const salesTrendData = generateSalesTrendData()

  const combinedCompanyData = Object.entries(
    [...filteredProducts, ...filteredGMs].reduce(
      (acc, item) => {
        const company = item.kompaniya || "Unknown"
        if (!acc[company]) {
          acc[company] = { sales: 0, revenue: 0, items: 0 }
        }
        acc[company].sales += item.sold || 0
        acc[company].revenue += (item.sold || 0) * parsePrice(item.narxi)
        acc[company].items += 1
        return acc
      },
      {} as Record<string, { sales: number; revenue: number; items: number }>,
    ),
  )
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const comparisonData = [
    {
      category: "Products",
      items: productsAnalytics.totalItems,
      sales: productsAnalytics.totalSales,
      revenue: productsAnalytics.totalRevenue,
      stock: productsAnalytics.totalStock,
    },
    {
      category: "GMs",
      items: gmsAnalytics.totalItems,
      sales: gmsAnalytics.totalSales,
      revenue: gmsAnalytics.totalRevenue,
      stock: gmsAnalytics.totalStock,
    },
  ]

  const productsCategoryData = Object.entries(
    productsData.reduce(
      (acc, product) => {
        const category = product.category || "Uncategorized"
        acc[category] = (acc[category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value, type: "Products" }))

  const gmsCategoryData = Object.entries(
    gmsData.reduce(
      (acc, gm) => {
        const category = gm.category || "Uncategorized"
        acc[category] = (acc[category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value, type: "GMs" }))

  const combinedStockAnalytics = [
    {
      name: "Products In Stock",
      value: productsData.filter((p) => (p.stock || 0) > (p.minStock || 5)).length,
      color: "#10b981",
    },
    { name: "Products Low Stock", value: productsAnalytics.lowStockItems, color: "#f59e0b" },
    { name: "Products Out of Stock", value: productsAnalytics.outOfStockItems, color: "#ef4444" },
    {
      name: "GMs In Stock",
      value: gmsData.filter((g) => (g.stock || 0) > (g.minStock || 5)).length,
      color: "#3b82f6",
    },
    { name: "GMs Low Stock", value: gmsAnalytics.lowStockItems, color: "#f97316" },
    { name: "GMs Out of Stock", value: gmsAnalytics.outOfStockItems, color: "#dc2626" },
  ]

  const bestSellingProducts = filteredProducts
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5)
    .map((product, index) => ({
      rank: index + 1,
      name: product.nomi || "Unknown",
      company: product.kompaniya || "Unknown",
      sold: product.sold || 0,
      revenue: (product.sold || 0) * parsePrice(product.narxi),
      type: "Product",
    }))

  const bestSellingGMs = filteredGMs
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5)
    .map((gm, index) => ({
      rank: index + 1,
      name: gm.nomi || "Unknown",
      company: gm.kompaniya || "Unknown",
      sold: gm.sold || 0,
      revenue: (gm.sold || 0) * parsePrice(gm.narxi),
      type: "GM",
    }))

  const performanceMetrics = [
    { name: "Conversion Rate", value: 3.2, change: 0.5, trend: "up" },
    { name: "Avg Order Value", value: combinedAnalytics.averagePrice || 0, change: -2.1, trend: "down" },
    { name: "Customer Retention", value: 68.5, change: 1.8, trend: "up" },
    { name: "Inventory Turnover", value: 4.2, change: 0.3, trend: "up" },
  ]

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new()

    // Overview sheet
    const overviewData = [
      ["Metric", "Products", "GMs", "Combined"],
      ["Total Items", productsAnalytics.totalItems, gmsAnalytics.totalItems, combinedAnalytics.totalItems],
      ["Total Sales", productsAnalytics.totalSales, gmsAnalytics.totalSales, combinedAnalytics.totalSales],
      [
        "Total Revenue",
        `$${productsAnalytics.totalRevenue.toFixed(2)}`,
        `$${gmsAnalytics.totalRevenue.toFixed(2)}`,
        `$${combinedAnalytics.totalRevenue.toFixed(2)}`,
      ],
      [
        "Average Price",
        `$${productsAnalytics.averagePrice.toFixed(2)}`,
        `$${gmsAnalytics.averagePrice.toFixed(2)}`,
        `$${combinedAnalytics.averagePrice.toFixed(2)}`,
      ],
      [
        "Inventory Value",
        `$${productsAnalytics.inventoryValue.toFixed(2)}`,
        `$${gmsAnalytics.inventoryValue.toFixed(2)}`,
        `$${combinedAnalytics.inventoryValue.toFixed(2)}`,
      ],
      ["Low Stock Items", productsAnalytics.lowStockItems, gmsAnalytics.lowStockItems, combinedAnalytics.lowStockItems],
      [
        "Out of Stock Items",
        productsAnalytics.outOfStockItems,
        gmsAnalytics.outOfStockItems,
        combinedAnalytics.outOfStockItems,
      ],
    ]
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData)
    XLSX.utils.book_append_sheet(wb, wsOverview, "Overview")

    // Products sheet
    const productsExportData = filteredProducts.map((p) => ({
      Kodi: p.kodi,
      Model: p.model,
      Nomi: p.nomi,
      Kompaniya: p.kompaniya,
      Narxi: parsePrice(p.narxi),
      Sold: p.sold || 0,
      Stock: p.stock || 0,
      Revenue: (p.sold || 0) * parsePrice(p.narxi),
      Category: p.category || "",
      Status: p.status || "",
    }))
    const wsProducts = XLSX.utils.json_to_sheet(productsExportData)
    XLSX.utils.book_append_sheet(wb, wsProducts, "Products")

    // GMs sheet
    const gmsExportData = filteredGMs.map((g) => ({
      Kodi: g.kodi,
      Model: g.model,
      Nomi: g.nomi,
      Kompaniya: g.kompaniya,
      Narxi: parsePrice(g.narxi),
      Sold: g.sold || 0,
      Stock: g.stock || 0,
      Revenue: (g.sold || 0) * parsePrice(g.narxi),
      Category: g.category || "",
      Status: g.status || "",
    }))
    const wsGMs = XLSX.utils.json_to_sheet(gmsExportData)
    XLSX.utils.book_append_sheet(wb, wsGMs, "GMs")

    // Sales Trend sheet
    const wsSalesTrend = XLSX.utils.json_to_sheet(salesTrendData)
    XLSX.utils.book_append_sheet(wb, wsSalesTrend, "Sales Trend")

    // Top Companies sheet
    const wsCompanies = XLSX.utils.json_to_sheet(combinedCompanyData)
    XLSX.utils.book_append_sheet(wb, wsCompanies, "Top Companies")

    XLSX.writeFile(wb, `Analytics_Report_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0099b5] mx-auto"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3 truncate">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-[#0099b5] flex-shrink-0" />
            <span className="truncate">{t("sidebar.analytics")}</span>
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base truncate">
            Comprehensive Business Analytics - {user?.email}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Bugun</SelectItem>
              <SelectItem value="yesterday">Kecha</SelectItem>
              <SelectItem value="7d">7 kun</SelectItem>
              <SelectItem value="30d">30 kun</SelectItem>
              <SelectItem value="1y">1 yil</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {t("common.refresh")}
          </Button>

          <Button onClick={handleExportToExcel} className="flex items-center gap-2 bg-[#0099b5] hover:bg-[#0099b5]/90">
            <Download className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="gms">GMs</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="p-2 lg:p-3 bg-blue-500 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                  <Layers className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-blue-700 truncate">Total Items</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-blue-900">
                  {combinedAnalytics.totalItems.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  P: {productsAnalytics.totalItems} | G: {gmsAnalytics.totalItems}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="p-2 lg:p-3 bg-green-500 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-green-700 truncate">Total Sales</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-green-900">
                  {combinedAnalytics.totalSales.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  P: {productsAnalytics.totalSales} | G: {gmsAnalytics.totalSales}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="p-2 lg:p-3 bg-emerald-500 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-emerald-700 truncate">Total Revenue</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-emerald-900">
                  ${combinedAnalytics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="p-2 lg:p-3 bg-purple-500 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-purple-700 truncate">Avg Price</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-purple-900">
                  ${(combinedAnalytics.averagePrice || 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="p-2 lg:p-3 bg-amber-500 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-amber-700 truncate">Low Stock</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-amber-900">
                  {combinedAnalytics.lowStockItems}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="p-2 lg:p-3 bg-indigo-500 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                  <Database className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-indigo-700 truncate">Inventory Value</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-indigo-900">
                  ${combinedAnalytics.inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-[#0099b5]" />
                Performance Metrics
              </CardTitle>
              <CardDescription className="text-sm">Key business performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2 truncate">{metric.name}</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                      {metric.name.includes("Rate") || metric.name.includes("Retention")
                        ? `${metric.value.toFixed(1)}%`
                        : metric.name.includes("Value")
                          ? `$${metric.value.toFixed(2)}`
                          : metric.value.toFixed(1)}
                    </p>
                    <div
                      className={cn(
                        "flex items-center justify-center gap-1 text-xs sm:text-sm",
                        metric.trend === "up" ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {metric.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Combined Sales Trend */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-[#0099b5]" />
                  Sales Trend Comparison
                </CardTitle>
                <CardDescription>Products vs GMs sales over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="products" fill="#0099b5" name="Products Sales" />
                    <Bar dataKey="gms" fill="#8b5cf6" name="GMs Sales" />
                    <Line
                      type="monotone"
                      dataKey="productsRevenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Products Revenue"
                    />
                    <Line type="monotone" dataKey="gmsRevenue" stroke="#f59e0b" strokeWidth={2} name="GMs Revenue" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Combined Company Performance */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#0099b5]" />
                  Top Companies (Combined)
                </CardTitle>
                <CardDescription>Best performing companies across all items</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={combinedCompanyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#0099b5" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Combined Stock Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#0099b5]" />
                  Stock Status Overview
                </CardTitle>
                <CardDescription>Inventory status for products and GMs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={combinedStockAnalytics}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {combinedStockAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {combinedStockAnalytics.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-600">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inventory Health Score */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#0099b5]" />
                  Inventory Health Score
                </CardTitle>
                <CardDescription>Overall inventory management performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#0099b5] mb-2">
                    {Math.round(
                      ((combinedAnalytics.totalStock - combinedAnalytics.outOfStockItems) /
                        Math.max(combinedAnalytics.totalStock, 1)) *
                        100,
                    )}
                    %
                  </div>
                  <p className="text-gray-600">Overall Health Score</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Stock Availability</span>
                      <span>
                        {Math.round(
                          ((combinedAnalytics.totalStock - combinedAnalytics.outOfStockItems) /
                            Math.max(combinedAnalytics.totalStock, 1)) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        ((combinedAnalytics.totalStock - combinedAnalytics.outOfStockItems) /
                          Math.max(combinedAnalytics.totalStock, 1)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Profit Margin</span>
                      <span>{combinedAnalytics.profitMargin.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(combinedAnalytics.profitMargin, 100)} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Inventory Turnover</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Best Sellers Combined */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-[#0099b5]" />
                Top Selling Items
              </CardTitle>
              <CardDescription>Best performing products and GMs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-[#0099b5]">Top Products</h3>
                  <div className="space-y-3">
                    {bestSellingProducts.length > 0 ? (
                      bestSellingProducts.map((product) => (
                        <div
                          key={product.rank}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-[#0099b5] text-white rounded-full text-sm font-bold">
                              #{product.rank}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                              <p className="text-xs text-gray-600">{product.company}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#0099b5] text-sm">{product.sold}</p>
                            <p className="text-xs text-gray-500">
                              ${product.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No sales data available</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4 text-purple-600">Top GMs</h3>
                  <div className="space-y-3">
                    {bestSellingGMs.length > 0 ? (
                      bestSellingGMs.map((gm) => (
                        <div
                          key={gm.rank}
                          className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">
                              #{gm.rank}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{gm.name}</p>
                              <p className="text-xs text-gray-600">{gm.company}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600 text-sm">{gm.sold}</p>
                            <p className="text-xs text-gray-500">
                              ${gm.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No sales data available</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab - Shows only products analytics */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4 text-center">
                <Package className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-700">Total Products</p>
                <p className="text-2xl font-bold text-blue-900">{productsAnalytics.totalItems}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700">Total Sales</p>
                <p className="text-2xl font-bold text-green-900">{productsAnalytics.totalSales}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-700">Revenue</p>
                <p className="text-2xl font-bold text-emerald-900">
                  ${productsAnalytics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-amber-700">Low Stock</p>
                <p className="text-2xl font-bold text-amber-900">{productsAnalytics.lowStockItems}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Products Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {productsCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={productsCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {productsCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No category data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GMs Tab - Shows only GMs analytics */}
        <TabsContent value="gms" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-700">Total GMs</p>
                <p className="text-2xl font-bold text-purple-900">{gmsAnalytics.totalItems}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700">Total Sales</p>
                <p className="text-2xl font-bold text-green-900">{gmsAnalytics.totalSales}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-700">Revenue</p>
                <p className="text-2xl font-bold text-emerald-900">
                  ${gmsAnalytics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-amber-700">Low Stock</p>
                <p className="text-2xl font-bold text-amber-900">{gmsAnalytics.lowStockItems}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>GMs Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {gmsCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={gmsCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {gmsCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60 + 30}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No category data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab - Side by side comparison */}
        <TabsContent value="comparison" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#0099b5]" />
                Products vs GMs Comparison
              </CardTitle>
              <CardDescription>Direct comparison of key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="items" fill="#0099b5" name="Total Items" />
                  <Bar dataKey="sales" fill="#10b981" name="Total Sales" />
                  <Bar dataKey="stock" fill="#f59e0b" name="Total Stock" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Revenue Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: "Products", value: productsAnalytics.totalRevenue },
                        { name: "GMs", value: gmsAnalytics.totalRevenue },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) =>
                        `${name}: $${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      }
                    >
                      <Cell fill="#0099b5" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Stock Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: "Products",
                        inStock: productsData.filter((p) => (p.stock || 0) > (p.minStock || 5)).length,
                        lowStock: productsAnalytics.lowStockItems,
                        outOfStock: productsAnalytics.outOfStockItems,
                      },
                      {
                        name: "GMs",
                        inStock: gmsData.filter((g) => (g.stock || 0) > (g.minStock || 5)).length,
                        lowStock: gmsAnalytics.lowStockItems,
                        outOfStock: gmsAnalytics.outOfStockItems,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="inStock" fill="#10b981" name="In Stock" />
                    <Bar dataKey="lowStock" fill="#f59e0b" name="Low Stock" />
                    <Bar dataKey="outOfStock" fill="#ef4444" name="Out of Stock" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
