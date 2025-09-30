"use client"

import type React from "react"

import { useState, useMemo, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Upload,
  ChevronDown,
  Save,
  ShoppingCart,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ChevronUp,
  Table,
  BarChart3,
  Building2,
  AlertCircle,
  Settings,
  Hash,
  Tag,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  getGMs,
  addGM,
  updateGM,
  deleteGM,
  deleteAllGMs,
  sellGM,
  addStock,
  removeStock,
  getLowStockGMs,
  getInventoryValue,
  type GM,
} from "@/lib/firebase-gm-operations"
import * as XLSX from "xlsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Added for tabs
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts" // Added for charts
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu" // Added for dropdown menu

export default function GMPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const { showToast: toast } = useToast() // Renamed to toast for consistency with updates
  const router = useRouter()

  const [data, setData] = useState<GM[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [companyFilter, setCompanyFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const [sortColumn, setSortColumn] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Updated state for import functionality
  const [isImporting, setIsImporting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false) // Keep for potential file upload progress UI

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false)
  const [deletingGM, setDeletingGM] = useState<GM | null>(null)
  const [editingGM, setEditingGM] = useState<GM | null>(null) // Renamed from editingRow
  const [sellingGM, setSellingGM] = useState<GM | null>(null)
  const [viewingGM, setViewingGM] = useState<GM | null>(null)
  const [stockGM, setStockGM] = useState<GM | null>(null)
  const [stockAction, setStockAction] = useState<"add" | "remove">("add")
  const [sellQuantity, setSellQuantity] = useState(1)
  const [stockQuantity, setStockQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lowStockGMs, setLowStockGMs] = useState<GM[]>([])
  const [inventoryValue, setInventoryValue] = useState(0)

  const [activeTab, setActiveTab] = useState("table")

  // Updated formData to reflect new data structure
  const [formData, setFormData] = useState({
    kodi: "",
    model: "",
    nomi: "", // Kept for backward compatibility/display
    kompaniya: "",
    narxi: "",
    stock: "0",
    minStock: "10",
    maxStock: "1000",
    location: "",
    category: "",
    supplier: "",
    cost: "",
    barcode: "",
    weight: "",
    dimensions: "",
    description: "",
    status: "active" as "active" | "inactive" | "discontinued",
    // New fields for import handling
    tovar: "",
    olchBirligi: "",
  })

  // Added state for modal visibility and filter options
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [companies, setCompanies] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [salesTrendData, setSalesTrendData] = useState<Array<{ month: string; sales: number }>>([])
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number }>>([])

  // Added refresh state and ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [refreshing, setRefreshing] = useState(false) // Added refreshing state

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Consolidated data loading
  const loadData = async () => {
    if (!user) return

    setIsInitialLoading(true)
    try {
      await Promise.all([
        loadGMs(),
        loadLowStockGMs(),
        loadInventoryValue(),
        loadCompanyData(),
        loadCategoryData(),
        loadSalesTrend(),
      ])
    } catch (error) {
      console.error("Error loading initial data:", error)
      toast({
        title: t("common.error"),
        description: "Failed to load initial data.",
        variant: "destructive",
      })
    } finally {
      setIsInitialLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const loadGMs = async () => {
    try {
      setIsLoading(true)
      const GMs = await getGMs()
      setData(GMs)
    } catch (error) {
      console.error("Error loading GMs:", error)
      toast({
        title: t("common.error"),
        description: "Failed to load GMs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadLowStockGMs = async () => {
    try {
      const lowStock = await getLowStockGMs()
      setLowStockGMs(lowStock)
    } catch (error) {
      console.error("Error loading low stock GMs:", error)
    }
  }

  const loadInventoryValue = async () => {
    try {
      const value = await getInventoryValue()
      setInventoryValue(value)
    } catch (error) {
      console.error("Error loading inventory value:", error)
    }
  }

  // Added functions to load company and category data for filters
  const loadCompanyData = async () => {
    const uniqueCompanies = Array.from(new Set(data.map((item) => item.kompaniya).filter(Boolean)))
    setCompanies(uniqueCompanies)
  }

  const loadCategoryData = async () => {
    const uniqueCategories = Array.from(new Set(data.map((item) => item.category).filter(Boolean)))
    setCategories(uniqueCategories)
  }

  // Added function to calculate sales trend data
  const loadSalesTrend = async () => {
    // Marked as async for consistency, though not strictly necessary here
    const monthlySales: { [key: string]: number } = {}
    data.forEach((GM) => {
      // Assuming sales are recorded over time, this needs a proper date field in GM type
      // For now, a placeholder or assumption will be made.
      // Example: if GM had a 'soldDate' property
      // const month = GM.soldDate ? new Date(GM.soldDate).toLocaleString("default", { month: "short" }) : null;
      // if (month) {
      //   monthlySales[month] = (monthlySales[month] || 0) + 1; // Or use a 'quantity sold' field
      // }
      const month = new Date().toLocaleString("default", { month: "short" }) // Simplified for example, needs actual date logic
      monthlySales[month] = (monthlySales[month] || 0) + (GM.sold || 0)
    })
    const trendData = Object.entries(monthlySales).map(([month, sales]) => ({ month, sales }))
    setSalesTrendData(trendData)
  }

  // Added function to calculate category distribution data
  const calculateCategoryData = () => {
    const categoryCounts: { [key: string]: number } = {}
    data.forEach((GM) => {
      const category = GM.category || "Uncategorized"
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })
    const chartData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))
    setCategoryData(chartData)
  }

  useEffect(() => {
    calculateCategoryData()
  }, [data])

  const handleCreate = async () => {
    // Basic validation
    if (!formData.kodi || !formData.nomi || !formData.kompaniya || !formData.narxi) {
      toast({
        title: t("common.error"),
        description: "Kodi, Nomi, Kompaniya, and Narxi are required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      await addGM({
        kodi: formData.kodi,
        model: formData.model,
        nomi: formData.nomi, // This might be redundant if tovar is primary name
        kompaniya: formData.kompaniya,
        narxi: formData.narxi.replace(/[^0-9.-]/g, ""), // Clean up price input
        stock: Number.parseInt(formData.stock) || 0,
        minStock: Number.parseInt(formData.minStock) || 10,
        maxStock: Number.parseInt(formData.maxStock) || 1000,
        location: formData.location,
        category: formData.category,
        supplier: formData.supplier,
        cost: formData.cost,
        barcode: formData.barcode,
        weight: Number.parseFloat(formData.weight) || 0,
        dimensions: formData.dimensions,
        description: formData.description,
        status: formData.status,
        sold: 0,
        // New fields from import update, potentially set by user or defaults
        tovar: formData.tovar || formData.nomi, // Use tovar if provided, else nomi
        olchBirligi: formData.olchBirligi,
      })

      await loadData() // Reload all data
      setIsCreateModalOpen(false)
      resetFormData()
      toast({
        title: t("common.success"),
        description: t("GMCreated"),
        variant: "success",
      })
    } catch (error) {
      console.error("Error creating GM:", error)
      toast({
        title: t("common.error"),
        description: "Failed to create GM",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetFormData = () => {
    setFormData({
      kodi: "",
      model: "",
      nomi: "",
      kompaniya: "",
      narxi: "",
      stock: "0",
      minStock: "10",
      maxStock: "1000",
      location: "",
      category: "",
      supplier: "",
      cost: "",
      barcode: "",
      weight: "",
      dimensions: "",
      description: "",
      status: "active",
      tovar: "", // Reset new fields
      olchBirligi: "",
    })
  }

  const handleEdit = (row: GM) => {
    setEditingGM(row)
    setFormData({
      kodi: row.kodi,
      model: row.model || "",
      nomi: row.nomi || "",
      kompaniya: row.kompaniya || "",
      narxi: row.narxi || "",
      stock: (row.stock || 0).toString(),
      minStock: (row.minStock || 10).toString(),
      maxStock: (row.maxStock || 1000).toString(),
      location: row.location || "",
      category: row.category || "",
      supplier: row.supplier || "",
      cost: row.cost || "",
      barcode: row.barcode || "",
      weight: (row.weight || 0).toString(),
      dimensions: row.dimensions || "",
      description: row.description || "",
      status: row.status || "active",
      tovar: row.tovar || row.nomi || "", // Populate new fields
      olchBirligi: row.olchBirligi || "",
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingGM?.id) return

    // Basic validation
    if (!formData.kodi || !formData.nomi || !formData.kompaniya || !formData.narxi) {
      toast({
        title: t("common.error"),
        description: "Kodi, Nomi, Kompaniya, and Narxi are required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      await updateGM(editingGM.id, {
        kodi: formData.kodi,
        model: formData.model,
        nomi: formData.nomi,
        kompaniya: formData.kompaniya,
        narxi: formData.narxi.replace(/[^0-9.-]/g, ""), // Clean up price input
        stock: Number.parseInt(formData.stock) || 0,
        minStock: Number.parseInt(formData.minStock) || 10,
        maxStock: Number.parseInt(formData.maxStock) || 1000,
        location: formData.location,
        category: formData.category,
        supplier: formData.supplier,
        cost: formData.cost,
        barcode: formData.barcode,
        weight: Number.parseFloat(formData.weight) || 0,
        dimensions: formData.dimensions,
        description: formData.description,
        status: formData.status,
        tovar: formData.tovar || formData.nomi, // Update new fields
        olchBirligi: formData.olchBirligi,
      })

      await loadData() // Reload all data
      setIsEditModalOpen(false)
      setEditingGM(null)
      resetFormData()
      toast({
        title: t("common.success"),
        description: t("GMUpdated"),
        variant: "success",
      })
    } catch (error) {
      console.error("Error updating GM:", error)
      toast({
        title: t("common.error"),
        description: "Failed to update GM",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (GM: GM) => {
    setDeletingGM(GM)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingGM?.id) return

    try {
      setIsSubmitting(true)

      await deleteGM(deletingGM.id)
      await loadData() // Reload all data
      setIsDeleteModalOpen(false)
      setDeletingGM(null)
      toast({
        title: t("common.success"),
        description: t("GMDeleted"),
        variant: "success",
      })
    } catch (error) {
      console.error("Error deleting GM:", error)
      toast({
        title: t("common.error"),
        description: "Failed to delete GM",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      setIsSubmitting(true)
      await deleteAllGMs()
      await loadData() // Reload all data
      setIsDeleteAllModalOpen(false)
      toast({
        title: t("common.success"),
        description: t("deleteAllSuccess"),
        variant: "success",
      })
    } catch (error) {
      console.error("Error deleting all GMs:", error)
      toast({
        title: t("common.error"),
        description: "Failed to delete all GMs",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSell = (GM: GM) => {
    setSellingGM(GM)
    setSellQuantity(1)
    setIsSellModalOpen(true)
  }

  const confirmSell = async () => {
    if (!sellingGM?.id) return
    if (sellQuantity <= 0) {
      toast({
        title: t("common.error"),
        description: "Quantity must be greater than 0.",
        variant: "destructive",
      })
      return
    }
    if ((sellingGM.stock || 0) < sellQuantity) {
      toast({
        title: t("common.error"),
        description: `Not enough stock. Available: ${sellingGM.stock}`,
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      await sellGM(sellingGM.id, sellQuantity)
      await loadData() // Reload all data
      // Update sales trend after sale
      await loadSalesTrend()
      setIsSellModalOpen(false)
      setSellingGM(null)
      setSellQuantity(1)
      toast({
        title: t("common.success"),
        description: t("GMSold", { quantity: sellQuantity, name: sellingGM.nomi }),
        variant: "success",
      })
    } catch (error) {
      console.error("Error selling GM:", error)
      toast({
        title: t("common.error"),
        description: "Failed to sell GM",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStockAction = (GM: GM, action: "add" | "remove") => {
    setStockGM(GM)
    setStockAction(action)
    setStockQuantity(1)
    setIsStockModalOpen(true)
  }

  const confirmStockAction = async () => {
    if (!stockGM?.id) return
    if (stockQuantity <= 0) {
      toast({
        title: t("common.error"),
        description: "Quantity must be greater than 0.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (stockAction === "add") {
        await addStock(stockGM.id, stockQuantity)
      } else {
        // Check for sufficient stock before removing
        if ((stockGM.stock || 0) < stockQuantity) {
          toast({
            title: t("common.error"),
            description: `Not enough stock. Available: ${stockGM.stock}`,
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
        await removeStock(stockGM.id, stockQuantity)
      }

      await loadData() // Reload all data
      // Update sales trend after stock change
      await loadSalesTrend()
      await loadCategoryData() // Reload category data
      setIsStockModalOpen(false)
      setStockGM(null)
      setStockQuantity(1)
      toast({
        title: t("common.success"),
        description: `${stockAction === "add" ? t("warehouse.added") : t("warehouse.removed")} ${stockQuantity} ${t("items")}`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error updating stock:", error)
      toast({
        title: t("common.error"),
        description: "Failed to update stock",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDetails = (GM: GM) => {
    setViewingGM(GM)
    setIsDetailsModalOpen(true)
  }

  const handleColumnClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Renamed handleFileSelect to handleFileUpload to match update
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true) // Use setIsImporting for the import process
    setShowImportDialog(true) // Show the dialog to confirm import
    setImportFile(file) // Store the file for confirmation
    event.target.value = "" // Clear the input
  }

  const handleCancelImport = () => {
    setShowImportDialog(false)
    setImportFile(null)
    setIsImporting(false)
    setUploadProgress(0)
  }

  // Updated handleConfirmImport to match new structure and logic
  const handleConfirmImport = async () => {
    if (!importFile) return

    setIsImporting(true) // Start the import process
    setUploadProgress(0) // Reset progress

    try {
      const dataBuffer = await importFile.arrayBuffer()
      const workbook = XLSX.read(dataBuffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      const errors: string[] = []
      let successCount = 0
      const totalRows = jsonData.length - 1 // Exclude header row

      setUploadProgress(5) // Initial progress

      for (let i = 1; i < jsonData.length; i++) {
        // Start from 1 to skip header
        const row = jsonData[i]
        if (!row || row.length === 0) continue

        try {
          // Support both old format (kodi, model, nomi, kompaniya, narxi) and new format (Kod, Tovar, O'lch. birligi, Narx)
          const [col1, col2, col3, col4, col5] = row

          // Detect format based on column count and content
          let kodi, tovar, olchBirligi, narxi, model, kompaniya, nomi

          if (row.length === 4) {
            // New format: Kod, Tovar, O'lch. birligi, Narx
            ;[kodi, tovar, olchBirligi, narxi] = row
            nomi = tovar // Use tovar as nomi if not explicitly provided
          } else if (row.length >= 5) {
            // Old format: kodi, model, nomi, kompaniya, narxi
            ;[kodi, model, nomi, kompaniya, narxi] = row
            tovar = nomi // If old format, tovar might be same as nomi
          } else {
            errors.push(`Row ${i + 2}: invalid format (expected 4 or >=5 columns)`)
            continue
          }

          if (!kodi || !tovar || !narxi) {
            errors.push(`Row ${i + 2}: missing required fields (Kod, Tovar, Narx)`)
            continue
          }

          await addGM({
            kodi: String(kodi).trim(),
            tovar: String(tovar).trim(),
            nomi: String(nomi).trim(), // Keep nomi for consistency if needed, but tovar is primary
            olchBirligi: olchBirligi ? String(olchBirligi).trim() : "",
            model: model ? String(model).trim() : "",
            kompaniya: kompaniya ? String(kompaniya).trim() : "",
            narxi: String(narxi).replace(/\s/g, ""), // Clean price
            sold: 0,
            stock: 0, // Default stock to 0 on import
            // Other fields like description, status, etc., will be null/empty unless explicitly in file
          })

          successCount++
          setUploadProgress(5 + (i / totalRows) * 85) // Update progress
        } catch (error) {
          console.error("Error processing row:", error)
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : "unknown error"}`)
        }
      }

      setUploadProgress(95) // Almost done

      // Reload data after import
      await loadData()

      if (errors.length > 0) {
        toast({
          title: t("import.partialSuccess"),
          description: `${successCount} ${t("import.imported")}, ${errors.length} ${t("import.failed")}. See console for details.`,
          variant: "default",
        })
        console.warn("Import Errors:", errors)
      } else {
        toast({
          title: t("import.success"),
          description: `${successCount} ${t("import.imported")}`,
          variant: "success",
        })
      }

      setShowImportDialog(false) // Close the import confirmation dialog
      setImportFile(null) // Clear the file state
    } catch (error) {
      console.error("Error processing Excel file:", error)
      toast({
        title: t("import.error"),
        description: error instanceof Error ? error.message : t("import.unknownError"),
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      setUploadProgress(100) // Complete progress bar
    }
  }

  // Updated handleExportExcel to match new data structure
  const handleExportExcel = () => {
    const exportData = data.map((gm) => ({
      Kod: gm.kodi,
      Tovar: gm.tovar || gm.nomi || "-", // Use tovar or nomi
      "O'lch. birligi": gm.olchBirligi || "-",
      Narx: typeof gm.narxi === "string" ? Number.parseFloat(gm.narxi.replace(/[^\d.-]/g, "")) || 0 : gm.narxi || 0, // Clean and parse price
      Sold: gm.sold || 0,
      Stock: gm.stock || 0,
      "Min Stock": gm.minStock || 10,
      "Max Stock": gm.maxStock || 1000,
      Kompaniya: gm.kompaniya || "-",
      Status: gm.status || "active",
      // Add other fields if necessary for export, e.g., location, supplier, etc.
      // Model: gm.model || "-",
      // Description: gm.description || "-",
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "GMs")
    XLSX.writeFile(wb, `gm-data-${new Date().toISOString().split("T")[0]}.xlsx`)

    toast({
      title: t("export.success"),
      description: t("export.downloaded"),
      variant: "success",
    })
  }

  const filteredData = useMemo(() => {
    const filtered = data.filter((row) => {
      const matchesSearch =
        searchTerm === "" ||
        row.nomi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.kodi).toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.kompaniya?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.tovar?.toLowerCase().includes(searchTerm.toLowerCase()) || // Search by tovar
        (row.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.supplier || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.olchBirligi || "").toLowerCase().includes(searchTerm.toLowerCase()) // Search by olchBirligi

      const matchesCompany = companyFilter === "all" || row.kompaniya === companyFilter
      const matchesCategory = categoryFilter === "all" || row.category === categoryFilter
      const matchesStatus = statusFilter === "all" || row.status === statusFilter

      let matchesStock = true
      if (stockFilter === "low") {
        matchesStock = (row.stock || 0) > 0 && (row.stock || 0) <= (row.minStock || 10)
      } else if (stockFilter === "out") {
        matchesStock = (row.stock || 0) === 0
      } else if (stockFilter === "available") {
        matchesStock = (row.stock || 0) > (row.minStock || 10)
      }

      return matchesSearch && matchesCompany && matchesCategory && matchesStatus && matchesStock
    })

    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortColumn as keyof GM]
        let bValue: any = b[sortColumn as keyof GM]

        // Handle numeric fields
        if (["narxi", "stock", "sold", "minStock", "maxStock", "weight"].includes(sortColumn)) {
          // Attempt to parse numeric values, fallback to 0 for sorting
          aValue = Number.parseFloat(String(aValue).replace(/[^\d.-]/g, "")) || 0
          bValue = Number.parseFloat(String(bValue).replace(/[^\d.-]/g, "")) || 0
        }

        // Handle string fields
        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase()
          bValue = String(bValue).toLowerCase()
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, companyFilter, categoryFilter, statusFilter, stockFilter, sortColumn, sortDirection])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, companyFilter, categoryFilter, statusFilter, stockFilter, itemsPerPage])

  const uniqueCompanies = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.kompaniya).filter(Boolean)))
  }, [data])

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.category).filter(Boolean)))
  }, [data])

  const handleCompanyClick = (company: string) => {
    setCompanyFilter(company)
    setShowFilters(true)
  }

  const totalSales = data.reduce((sum, GM) => sum + (GM.sold || 0), 0)

  const totalRevenue = data.reduce((sum, GM) => {
    const price = Number.parseFloat(GM.narxi?.toString().replace(/[^0-9.-]/g, "") || "0")
    const sold = GM.sold || 0
    return sum + sold * (isNaN(price) ? 0 : price)
  }, 0)

  const averagePrice =
    data.length > 0
      ? data.reduce((sum, GM) => {
          const price = Number.parseFloat(GM.narxi?.toString().replace(/[^0-9.-]/g, "") || "0")
          return sum + (isNaN(price) ? 0 : price)
        }, 0) / data.length
      : 0

  const outOfStockGMs = data.filter((GM) => (GM.stock || 0) === 0)
  const currentLowStockGMs = data.filter((GM) => {
    const stock = GM.stock || 0
    const minStock = GM.minStock || 10
    return stock > 0 && stock <= minStock
  })

  const companyStats = data.reduce(
    (acc, GM) => {
      const company = GM.kompaniya || "Unknown"
      const price = Number.parseFloat(GM.narxi?.toString().replace(/[^0-9.-]/g, "") || "0")
      const sold = GM.sold || 0

      if (!acc[company]) {
        acc[company] = { name: company, sales: 0, GMs: 0, revenue: 0 }
      }
      acc[company].sales += sold
      acc[company].GMs += 1
      acc[company].revenue += sold * (isNaN(price) ? 0 : price)
      return acc
    },
    {} as Record<string, { name: string; sales: number; GMs: number; revenue: number }>,
  )

  const companyChartData = Object.values(companyStats)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10)

  const priceRanges = [
    { name: "0-10K", min: 0, max: 10000, count: 0 },
    { name: "10K-25K", min: 10000, max: 25000, count: 0 },
    { name: "25K-50K", min: 25000, max: 50000, count: 0 },
    { name: "50K-100K", min: 50000, max: 100000, count: 0 },
    { name: "100K+", min: 100000, max: Number.POSITIVE_INFINITY, count: 0 },
  ]

  data.forEach((GM) => {
    const price = Number.parseFloat(GM.narxi?.toString().replace(/[^0-9.-]/g, "") || "0")
    if (!isNaN(price)) {
      const range = priceRanges.find((r) => price >= r.min && price < r.max)
      if (range) range.count++
    }
  })

  const bestSellingGMs = data
    .filter((GM) => (GM.sold || 0) > 0)
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 10)
    .map((GM, index) => ({
      rank: index + 1,
      name: GM.tovar || GM.nomi || "Unknown", // Use tovar or nomi
      company: GM.kompaniya || "Unknown",
      sold: GM.sold || 0,
      revenue: (GM.sold || 0) * Number.parseFloat(GM.narxi?.toString().replace(/[^0-9.-]/g, "") || "0"),
    }))

  // Stock analytics
  const stockAnalytics = {
    available: data.filter((GM) => (GM.stock || 0) > (GM.minStock || 5)).length,
    lowStock: currentLowStockGMs.length,
    outOfStock: outOfStockGMs.length,
  }

  const stockChartData = [
    { name: t("stats.availableStock"), value: stockAnalytics.available, color: "#10b981" },
    { name: t("stats.lowStock"), value: stockAnalytics.lowStock, color: "#f59e0b" },
    { name: t("stats.outOfStock"), value: stockAnalytics.outOfStock, color: "#ef4444" },
  ]

  // Modified loading state handling
  if (loading || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0099b5] mx-auto"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData() // Use consolidated loadData
    setRefreshing(false)
    toast({ title: t("common.success"), description: t("data.refreshed"), variant: "success" })
  }

  // Current data for display (pagination applied)
  const currentData = paginatedData

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Table className="h-8 w-8 text-[#0099b5]" />
            {t("sidebar.table")}
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="font-medium text-gray-700">{t("data.manage")}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{user?.email}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t("common.refresh")}
          </Button>

          <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            {t("data.export")}
          </Button>

          <div className="relative">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              disabled={isImporting} // Disable button during import
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t("data.import")}
            </Button>
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#0099b5] hover:bg-[#0099b5]/90"
          >
            <Plus className="h-4 w-4" />
            {t("data.add")}
          </Button>
        </div>
      </div>

      {/* Statistics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-3 lg:p-6 text-center">
            <div className="p-2 lg:p-3 bg-blue-500 rounded-full w-fit mx-auto mb-2 lg:mb-4">
              <Package className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
            </div>
            <p className="text-xs lg:text-sm font-medium text-blue-700">{t("totalGMs")}</p>
            <p className="text-lg lg:text-2xl font-bold text-blue-900">{data.length.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-3 lg:p-6 text-center">
            <div className="p-2 lg:p-3 bg-green-500 rounded-full w-fit mx-auto mb-2 lg:mb-4">
              <TrendingUp className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
            </div>
            <p className="text-xs lg:text-sm font-medium text-green-700">{t("totalSales")}</p>
            <p className="text-lg lg:text-2xl font-bold text-green-900">
              {data.reduce((sum, GM) => sum + (GM.sold || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-3 lg:p-6 text-center">
            <div className="p-2 lg:p-3 bg-purple-500 rounded-full w-fit mx-auto mb-2 lg:mb-4">
              <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
            </div>
            <p className="text-xs lg:text-sm font-medium text-purple-700">{t("totalRevenue")}</p>
            <p className="text-lg lg:text-2xl font-bold text-purple-900">${totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-3 lg:p-6 text-center">
            <div className="p-2 lg:p-3 bg-orange-500 rounded-full w-fit mx-auto mb-2 lg:mb-4">
              <AlertTriangle className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
            </div>
            <p className="text-xs lg:text-sm font-medium text-orange-700">{t("lowStock")}</p>
            <p className="text-lg lg:text-2xl font-bold text-orange-900">{currentLowStockGMs.length}</p>
          </CardContent>
        </Card>
      </div>

      {lowStockGMs.length > 0 && (
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-orange-900">
                    {lowStockGMs.length} {t("stats.lowStockGMs")}
                  </span>
                  <p className="text-sm text-orange-700 mt-1">Immediate restocking required</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLowStockModalOpen(true)}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Progress Indicator */}
      {isImporting && uploadProgress > 0 && (
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-full animate-pulse">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-blue-900">{t("progress.uploadProgress")}</span>
                </div>
                <span className="text-sm font-semibold text-blue-700">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-3 bg-blue-100" />
              <p className="text-sm text-blue-700">{t("progress.uploading")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 lg:h-10">
          <TabsTrigger value="table" className="text-sm lg:text-base font-medium">
            <Table className="h-4 w-4 mr-2" />
            {t("tabs.table")}
          </TabsTrigger>
          <TabsTrigger value="statistics" className="text-sm lg:text-base font-medium">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t("tabs.statistics")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4 lg:space-y-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 lg:p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={t("searchPlaceholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 lg:h-11"
                    />
                  </div>
                  <div className="flex gap-2 lg:gap-3">
                    <Select value={companyFilter} onValueChange={setCompanyFilter}>
                      <SelectTrigger className="w-full sm:w-[180px] h-10 lg:h-11">
                        <SelectValue placeholder={t("filter.company")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("filter.allCompanies")}</SelectItem>
                        {uniqueCompanies.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={stockFilter} onValueChange={setStockFilter}>
                      <SelectTrigger className="w-full sm:w-[160px] h-10 lg:h-11">
                        <SelectValue placeholder={t("filter.stock")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("filter.allStock")}</SelectItem>
                        <SelectItem value="low">{t("filter.lowStock")}</SelectItem>
                        <SelectItem value="out">{t("filter.outOfStock")}</SelectItem>
                        <SelectItem value="available">{t("filter.inStock")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-[#0099b5] hover:bg-[#0099b5]/90 text-white h-9 lg:h-10 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("addGM")}
                    </Button>
                    <Button
                      onClick={handleExportExcel}
                      variant="outline"
                      className="border-[#0099b5]/20 text-[#0099b5] hover:bg-[#0099b5]/10 h-9 lg:h-10 text-sm bg-transparent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t("exportExcel")}
                    </Button>
                    <Button
                      onClick={() => setIsDeleteAllModalOpen(true)}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 h-9 lg:h-10 text-sm"
                      disabled={data.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("deleteAll")}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors text-sm">
                        <Upload className="h-4 w-4" />
                        {t("importExcel")}
                      </div>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload} // Use the updated handler
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("kodi")}
                        title={t("filter.kod")}
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Kod
                          {sortColumn === "kodi" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("tovar")} // Sort by tovar
                        title={t("filter.tovar")} // Assuming t("filter.tovar") exists
                      >
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Tovar
                          {sortColumn === "tovar" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("olchBirligi")} // Sort by olchBirligi
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          O&apos;lch. birligi
                          {sortColumn === "olchBirligi" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("narxi")}
                        title={t("filter.narxi")}
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Narx
                          {sortColumn === "narxi" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("stock")}
                        title={t("filter.stock")}
                      >
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {t("warehouse.stock")}
                          {sortColumn === "stock" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("sold")}
                        title={t("filter.sold")}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          {t("sold")}
                          {sortColumn === "sold" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-700">
                        <div className="flex items-center justify-center gap-2">
                          <Settings className="h-4 w-4" />
                          {t("actions")}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((row, index) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "hover:bg-gray-50 transition-colors cursor-pointer",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                        )}
                        onClick={() => handleViewDetails(row)}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#0099b5] rounded-full"></div>
                            <span className="font-mono text-sm font-medium text-gray-900">{row.kodi}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-600 font-medium">{row.tovar || row.nomi || "-"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-600 font-medium">{row.olchBirligi || "-"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-green-600 text-lg">{row.narxi}</span>
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            className={cn(
                              "font-semibold",
                              (row.stock || 0) <= (row.minStock || 10)
                                ? "bg-red-100 text-red-800 border-red-200"
                                : (row.stock || 0) === 0
                                  ? "bg-gray-100 text-gray-800 border-gray-200"
                                  : "bg-green-100 text-green-800 border-green-200",
                            )}
                          >
                            {row.stock || 0}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className="bg-blue-100 text-blue-800 border border-blue-200 font-semibold">
                            {row.sold || 0}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(row)}
                              className="text-blue-600 hover:bg-blue-50 p-2 h-9 w-9 rounded-full"
                              title={t("action.viewDetails")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                              onClick={() => handleEdit(row)}
                              title={t("editGM")}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                              onClick={() => handleStockAction(row, "add")}
                            >
                              <PackagePlus className="h-4 w-4 mr-2 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                              onClick={() => handleStockAction(row, "remove")}
                            >
                              <PackageMinus className="h-4 w-4 mr-2 text-orange-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                              onClick={() => handleSell(row)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2 text-purple-600" />
                            </Button>
                            <DropdownMenuSeparator />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                              onClick={() => handleDeleteClick(row)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Table */}
              <div className="lg:hidden space-y-3 p-3">
                {paginatedData.map((row) => (
                  <Card
                    key={row.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-[#0099b5] bg-white"
                    onClick={() => handleViewDetails(row)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header with code and company */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#0099b5] rounded-full"></div>
                            <span className="font-mono text-sm font-bold text-gray-900">{row.kodi}</span>
                          </div>
                          <Badge className="bg-[#0099b5]/10 text-[#0099b5] border border-[#0099b5]/20 text-xs">
                            {row.kompaniya}
                          </Badge>
                        </div>

                        {/* GM name and tovar */}
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{row.tovar || row.nomi}</h3>
                          {row.model && <p className="text-xs text-gray-600 mt-1">{row.model}</p>}
                        </div>

                        {/* Price and stock info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Price</p>
                              <p className="font-bold text-green-600 text-sm">{row.narxi}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Stock</p>
                              <Badge
                                className={cn(
                                  "text-xs font-semibold",
                                  (row.stock || 0) <= (row.minStock || 10)
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : (row.stock || 0) === 0
                                      ? "bg-gray-100 text-gray-800 border-gray-200"
                                      : "bg-green-100 text-green-800 border-green-200",
                                )}
                              >
                                {row.stock || 0}
                              </Badge>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Sold</p>
                              <Badge className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold">
                                {row.sold || 0}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(row)
                              }}
                              className="text-blue-600 hover:bg-blue-50 p-2 h-8 w-8 rounded-full"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(row)
                              }}
                              className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-8 w-8 rounded-full"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                            onClick={() => handleStockAction(row, "add")}
                          >
                            <PackagePlus className="h-4 w-4 mr-2 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                            onClick={() => handleStockAction(row, "remove")}
                          >
                            <PackageMinus className="h-4 w-4 mr-2 text-orange-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                            onClick={() => handleSell(row)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2 text-purple-600" />
                          </Button>
                          <DropdownMenuSeparator />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                            onClick={() => handleDeleteClick(row)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noGMs")}</h3>
              <p className="text-gray-600">{t("noGMsDescription")}</p>
            </div>
          )}

          {filteredData.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 px-4 lg:px-6 pb-4">
              <div className="text-sm text-gray-600">
                {t("pagination.showing")} {startIndex + 1}-{Math.min(endIndex, filteredData.length)}{" "}
                {t("pagination.of")} {filteredData.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="border-[#0099b5]/20 h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-[#0099b5]/20 h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-3 py-1 bg-[#0099b5]/10 text-[#0099b5] rounded">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-[#0099b5]/20 h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="border-[#0099b5]/20 h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4 lg:space-y-6">
          {/* Enhanced Statistics Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 lg:p-6 text-center">
                <div className="p-2 lg:p-3 bg-emerald-500 rounded-full w-fit mx-auto mb-3 lg:mb-4">
                  <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-emerald-700">{t("stats.averagePrice")}</p>
                <p className="text-lg lg:text-2xl font-bold text-emerald-900">
                  ${isNaN(averagePrice) ? "0.00" : averagePrice.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 lg:p-6 text-center">
                <div className="p-2 lg:p-3 bg-red-500 rounded-full w-fit mx-auto mb-3 lg:mb-4">
                  <AlertCircle className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-red-700">{t("stats.outOfStockGMs")}</p>
                <p className="text-lg lg:text-2xl font-bold text-red-900">{outOfStockGMs.length}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 lg:p-6 text-center">
                <div className="p-2 lg:p-3 bg-indigo-500 rounded-full w-fit mx-auto mb-3 lg:mb-4">
                  <Package className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-indigo-700">{t("stats.totalStock")}</p>
                <p className="text-lg lg:text-2xl font-bold text-indigo-900">
                  {data.reduce((sum, GM) => sum + (GM.stock || 0), 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 lg:p-6 text-center">
                <div className="p-2 lg:p-3 bg-amber-500 rounded-full w-fit mx-auto mb-3 lg:mb-4">
                  <TrendingUp className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-amber-700">{t("stats.inventoryValue")}</p>
                <p className="text-lg lg:text-2xl font-bold text-amber-900">${inventoryValue.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Company Performance Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Building2 className="h-4 w-4 lg:h-5 lg:w-5 text-[#0099b5]" />
                  {t("stats.companyChart")}
                </CardTitle>
                <CardDescription className="text-sm">{t("stats.bestCompanies")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={companyChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#0099b5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Stock Analytics Pie Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Package className="h-4 w-4 lg:h-5 lg:w-5 text-[#0099b5]" />
                  {t("stats.warehouseChart")}
                </CardTitle>
                <CardDescription className="text-sm">{t("stats.warehouseAnalytics")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stockChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stockChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 lg:gap-4 mt-4">
                  {stockChartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs lg:text-sm text-gray-600">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Range Analytics */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <DollarSign className="h-4 w-4 lg:h-5 lg:w-5 text-[#0099b5]" />
                  {t("stats.priceChart")}
                </CardTitle>
                <CardDescription className="text-sm">{t("stats.priceRangeAnalytics")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={priceRanges} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sales Trend Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-[#0099b5]" />
                  {t("stats.salesTrend")}
                </CardTitle>
                <CardDescription className="text-sm">{t("stats.monthlySales")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={salesTrendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#0099b5" strokeWidth={3} dot={{ fill: "#0099b5" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Best Selling GMs */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-[#0099b5]" />
                {t("stats.bestSellingGMs")}
              </CardTitle>
              <CardDescription className="text-sm">{t("stats.salesChart")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                {bestSellingGMs.map((GM, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-[#0099b5] text-white rounded-full text-sm font-bold">
                        #{GM.rank}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{GM.name}</p>
                        <p className="text-xs text-gray-600">{GM.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0099b5] text-sm">{GM.sold}</p>
                      <p className="text-xs text-gray-500">{t("stats.sold")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Category Distribution */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Tag className="h-4 w-4 lg:h-5 lg:w-5 text-[#0099b5]" />
                  {t("stats.categoryDistribution")}
                </CardTitle>
                <CardDescription className="text-sm">{t("stats.GMsByCategory")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Inventory Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-[#0099b5]" />
                  {t("stats.inventoryStatus")}
                </CardTitle>
                <CardDescription className="text-sm">{t("stats.stockLevels")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">{t("stats.inStock")}</span>
                    </div>
                    <span className="font-bold text-green-800">
                      {data.filter((p) => (p.stock || 0) > (p.minStock || 10)).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium text-yellow-800">{t("stats.lowStock")}</span>
                    </div>
                    <span className="font-bold text-yellow-800">{currentLowStockGMs.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-800">{t("stats.outOfStock")}</span>
                    </div>
                    <span className="font-bold text-red-800">{outOfStockGMs.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#0099b5]" />
              {t("modal.GMDetails")}
            </DialogTitle>
            <DialogDescription>
              {viewingGM?.tovar || viewingGM?.nomi} - {viewingGM?.kodi} {/* Use tovar */}
            </DialogDescription>
          </DialogHeader>
          {viewingGM && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("kodi")}:</span>
                      <span className="font-medium">{viewingGM.kodi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("model")}:</span>
                      <span className="font-medium">{viewingGM.model || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("tovar")}:</span> {/* Display Tovar */}
                      <span className="font-medium">{viewingGM.tovar || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("nomi")}:</span> {/* Display Nomi if different */}
                      {viewingGM.nomi && viewingGM.nomi !== viewingGM.tovar && (
                        <span className="font-medium">{viewingGM.nomi}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("kompaniya")}:</span>
                      <Badge className="bg-blue-100 text-blue-800">{viewingGM.kompaniya}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("warehouse.category")}:</span>
                      <span className="font-medium">{viewingGM.category || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("warehouse.status")}:</span>
                      <Badge
                        className={cn(
                          viewingGM.status === "active"
                            ? "bg-green-100 text-green-800"
                            : viewingGM.status === "inactive"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800",
                        )}
                      >
                        {t(`status.${viewingGM.status || "active"}`)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Financial Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("narxi")}:</span>
                      <span className="font-bold text-green-600">{viewingGM.narxi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("warehouse.cost")}:</span>
                      <span className="font-medium">{viewingGM.cost || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("sold")}:</span>
                      <Badge className="bg-blue-100 text-blue-800">{viewingGM.sold || 0}</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Warehouse Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("warehouse.location")}:</span>
                      <span className="font-medium">{viewingGM.location || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("warehouse.supplier")}:</span>
                      <span className="font-medium">{viewingGM.supplier || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("warehouse.barcode")}:</span>
                      <span className="font-medium font-mono">{viewingGM.barcode || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("warehouse.weight")}:</span>
                      <span className="font-medium">{viewingGM.weight ? `${viewingGM.weight} kg` : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("warehouse.dimensions")}:</span>
                      <span className="font-medium">{viewingGM.dimensions || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("olchBirligi")}:</span> {/* Display olchBirligi */}
                      <span className="font-medium">{viewingGM.olchBirligi || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Stock Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t("warehouse.stock")}:</span>
                      <Badge
                        className={cn(
                          "text-lg px-3 py-1",
                          (viewingGM.stock || 0) <= (viewingGM.minStock || 10)
                            ? "bg-red-100 text-red-800 border-red-200"
                            : (viewingGM.stock || 0) === 0
                              ? "bg-gray-100 text-gray-800 border-gray-200"
                              : "bg-green-100 text-green-800 border-green-200",
                        )}
                      >
                        {viewingGM.stock || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("warehouse.minStock")}:</span>
                      <span className="font-medium">{viewingGM.minStock || 10}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("warehouse.maxStock")}:</span>
                      <span className="font-medium">{viewingGM.maxStock || 1000}</span>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Stock Level</span>
                        <span>
                          {viewingGM.maxStock && viewingGM.maxStock > 0
                            ? Math.round(((viewingGM.stock || 0) / viewingGM.maxStock) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          viewingGM.maxStock && viewingGM.maxStock > 0
                            ? ((viewingGM.stock || 0) / viewingGM.maxStock) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>

                {viewingGM.description && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">{t("warehouse.description")}</h3>
                    <p className="text-gray-700">{viewingGM.description}</p>
                  </div>
                )}

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">{t("warehouse.quickActions")}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false)
                        handleStockAction(viewingGM, "add")
                      }}
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <PackagePlus className="h-4 w-4 mr-2" />
                      {t("action.addStock")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false)
                        handleStockAction(viewingGM, "remove")
                      }}
                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      <PackageMinus className="h-4 w-4 mr-2" />
                      {t("action.removeStock")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false)
                        handleSell(viewingGM)
                      }}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t("action.sell")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false)
                        handleEdit(viewingGM)
                      }}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t("action.edit")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {stockAction === "add" ? (
                <PackagePlus className="h-5 w-5 text-green-600" />
              ) : (
                <PackageMinus className="h-5 w-5 text-orange-600" />
              )}
              {t(stockAction === "add" ? "modal.addStock" : "modal.removeStock")}
            </DialogTitle>
            <DialogDescription>
              {stockGM?.tovar || stockGM?.nomi} - Current stock: {stockGM?.stock || 0} {/* Use tovar */}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{t("GMName")}:</span>
                <span className="font-medium">{stockGM?.tovar || stockGM?.nomi}</span> {/* Use tovar */}
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Current Stock:</span>
                <Badge className="bg-blue-100 text-blue-800">{stockGM?.stock || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t("warehouse.minStock")}:</span>
                <span className="font-medium">{stockGM?.minStock || 10}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="stockQuantity">{t("quantity")}</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number.parseInt(e.target.value) || 1)}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div
              className={cn(
                "p-4 rounded-lg border",
                stockAction === "add" ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200",
              )}
            >
              <div className="flex justify-between items-center">
                <span className={cn("text-sm", stockAction === "add" ? "text-green-700" : "text-orange-700")}>
                  New Stock Level:
                </span>
                <span className={cn("font-bold text-lg", stockAction === "add" ? "text-green-800" : "text-orange-800")}>
                  {stockAction === "add"
                    ? (stockGM?.stock || 0) + stockQuantity
                    : Math.max(0, (stockGM?.stock || 0) - stockQuantity)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockModalOpen(false)} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={confirmStockAction}
              className={cn(
                stockAction === "add" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700",
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : stockAction === "add" ? (
                <PackagePlus className="h-4 w-4 mr-2" />
              ) : (
                <PackageMinus className="h-4 w-4 mr-2" />
              )}
              {t(stockAction === "add" ? "warehouse.addStock" : "warehouse.removeStock")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLowStockModalOpen} onOpenChange={setIsLowStockModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              {t("modal.lowStockAlert")}
            </DialogTitle>
            <DialogDescription>GMs that need restocking ({lowStockGMs.length} items)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {lowStockGMs.map((GM) => (
              <div key={GM.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{GM.tovar || GM.nomi}</h4> {/* Use tovar */}
                    <p className="text-sm text-gray-600">
                      {GM.kodi} - {GM.kompaniya}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-100 text-red-800 border-red-200 mb-1">Stock: {GM.stock || 0}</Badge>
                    <p className="text-xs text-gray-500">Min: {GM.minStock || 10}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsLowStockModalOpen(false)
                      handleStockAction(GM, "add")
                    }}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <PackagePlus className="h-4 w-1 mr-1" />
                    Restock
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsLowStockModalOpen(false)
                      handleViewDetails(GM)
                    }}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLowStockModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editGM")}</DialogTitle>
            <DialogDescription>{t("editGMDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-kodi">{t("kodi")} *</Label>
              <Input
                id="edit-kodi"
                value={formData.kodi}
                onChange={(e) => setFormData({ ...formData, kodi: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-model">{t("model")}</Label>
              <Input
                id="edit-model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-tovar">{t("tovar")} *</Label> {/* Updated Label */}
              <Input
                id="edit-tovar"
                value={formData.tovar}
                onChange={(e) => setFormData({ ...formData, tovar: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-nomi">{t("nomi")}</Label> {/* Nomi might be optional or secondary */}
              <Input
                id="edit-nomi"
                value={formData.nomi}
                onChange={(e) => setFormData({ ...formData, nomi: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-kompaniya">{t("kompaniya")} *</Label>
              <Input
                id="edit-kompaniya"
                value={formData.kompaniya}
                onChange={(e) => setFormData({ ...formData, kompaniya: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-narxi">{t("narxi")} *</Label>
              <Input
                id="edit-narxi"
                value={formData.narxi}
                onChange={(e) => setFormData({ ...formData, narxi: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-cost">{t("warehouse.cost")}</Label>
              <Input
                id="edit-cost"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-stock">{t("warehouse.stock")}</Label>
              <Input
                id="edit-stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-minStock">{t("warehouse.minStock")}</Label>
              <Input
                id="edit-minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-maxStock">{t("warehouse.maxStock")}</Label>
              <Input
                id="edit-maxStock"
                type="number"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-location">{t("warehouse.location")}</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">{t("warehouse.category")}</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-supplier">{t("warehouse.supplier")}</Label>
              <Input
                id="edit-supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-barcode">{t("warehouse.barcode")}</Label>
              <Input
                id="edit-barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-weight">{t("warehouse.weight")}</Label>
              <Input
                id="edit-weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-dimensions">{t("warehouse.dimensions")}</Label>
              <Input
                id="edit-dimensions"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-olchBirligi">{t("olchBirligi")}</Label> {/* Updated field */}
              <Input
                id="edit-olchBirligi"
                value={formData.olchBirligi}
                onChange={(e) => setFormData({ ...formData, olchBirligi: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">{t("warehouse.status")}</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="border-[#0099b5]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                  <SelectItem value="discontinued">{t("status.discontinued")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-description">{t("warehouse.description")}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button onClick={handleUpdate} className="bg-[#0099b5] hover:bg-[#0099b5]/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {t("update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSellModalOpen} onOpenChange={setIsSellModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("sellGM")}</DialogTitle>
            <DialogDescription>
              {t("sellGMDescription")} {sellingGM?.tovar || sellingGM?.nomi} {/* Use tovar */}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{t("GMName")}:</span>
                <span className="font-medium">{sellingGM?.tovar || sellingGM?.nomi}</span> {/* Use tovar */}
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{t("price")}:</span>
                <span className="font-semibold text-green-600">{sellingGM?.narxi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t("company")}:</span>
                <span className="font-medium">{sellingGM?.kompaniya}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="quantity">{t("quantity")}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={sellQuantity}
                onChange={(e) => setSellQuantity(Number.parseInt(e.target.value) || 1)}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">{t("totalAmount")}:</span>
                <span className="font-bold text-green-800 text-lg">
                  {(Number.parseFloat(sellingGM?.narxi?.replace(/,/g, "") || "0") * sellQuantity).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSellModalOpen(false)} disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button onClick={confirmSell} className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              {t("confirmSale")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirmMessage")}</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-red-700">{t("GMName")}:</span>
              <span className="font-medium text-red-800">{deletingGM?.tovar || deletingGM?.nomi}</span>{" "}
              {/* Use tovar */}
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-red-700">{t("kodi")}:</span>
              <span className="font-medium text-red-800">{deletingGM?.kodi}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-700">{t("company")}:</span>
              <span className="font-medium text-red-800">{deletingGM?.kompaniya}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {t("deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteAllModalOpen} onOpenChange={setIsDeleteAllModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t("deleteAllConfirm")}</DialogTitle>
            <DialogDescription>{t("deleteAllMessage")}</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center">
              <span className="text-lg font-semibold text-red-800">
                {data.length} {t("GMs")}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAllModalOpen(false)} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleDeleteAll}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {t("deleteAll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add modal for creating a new GM */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("createNewGM")}</DialogTitle>
            <DialogDescription>{t("createGMDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kodi">{t("kodi")} *</Label>
              <Input
                id="kodi"
                value={formData.kodi}
                onChange={(e) => setFormData({ ...formData, kodi: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="model">{t("model")}</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="tovar">{t("tovar")} *</Label> {/* Updated field */}
              <Input
                id="tovar"
                value={formData.tovar}
                onChange={(e) => setFormData({ ...formData, tovar: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="nomi">{t("nomi")}</Label> {/* Nomi might be optional or secondary */}
              <Input
                id="nomi"
                value={formData.nomi}
                onChange={(e) => setFormData({ ...formData, nomi: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="kompaniya">{t("kompaniya")} *</Label>
              <Input
                id="kompaniya"
                value={formData.kompaniya}
                onChange={(e) => setFormData({ ...formData, kompaniya: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="narxi">{t("narxi")} *</Label>
              <Input
                id="narxi"
                value={formData.narxi}
                onChange={(e) => setFormData({ ...formData, narxi: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="cost">{t("warehouse.cost")}</Label>
              <Input
                id="cost"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="stock">{t("warehouse.stock")}</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="minStock">{t("warehouse.minStock")}</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="maxStock">{t("warehouse.maxStock")}</Label>
              <Input
                id="maxStock"
                type="number"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="location">{t("warehouse.location")}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="category">{t("warehouse.category")}</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="supplier">{t("warehouse.supplier")}</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="barcode">{t("warehouse.barcode")}</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="weight">{t("warehouse.weight")}</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="dimensions">{t("warehouse.dimensions")}</Label>
              <Input
                id="dimensions"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="olchBirligi">{t("olchBirligi")}</Label> {/* Updated field */}
              <Input
                id="olchBirligi"
                value={formData.olchBirligi}
                onChange={(e) => setFormData({ ...formData, olchBirligi: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
              />
            </div>
            <div>
              <Label htmlFor="status">{t("warehouse.status")}</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="border-[#0099b5]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                  <SelectItem value="discontinued">{t("status.discontinued")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">{t("warehouse.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-[#0099b5]/20 focus:border-[#0099b5]"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate} className="bg-[#0099b5] hover:bg-[#0099b5]/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Confirmation Dialog */}
      <Dialog open={showImportDialog} onOpenChange={handleCancelImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("data.confirmImport")}</DialogTitle>
            <DialogDescription>
              {importFile ? `Import ${importFile.name}?` : "Are you sure you want to import this file?"}
            </DialogDescription>
          </DialogHeader>
          {isImporting && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("data.importing")}</span>
                <span className="text-sm font-semibold text-[#0099b5]">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelImport} disabled={isImporting}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleConfirmImport} disabled={isImporting} className="bg-[#0099b5] hover:bg-[#0099b5]/90">
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {t("data.import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
