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
  Printer,
  Receipt,
  HandCoins,
  Wallet,
  CreditCard,
  Users,
  MapPin,
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
  getSaleGMs,
  saveSaleGM,
  type SaleGM,
  getLoans,
  createLoan,
  addLoanPayment,
  getPendingLoans,
  getTotalLoanAmount,
  type LoanRecord,
} from "@/lib/firebase-gm-operations"
import * as XLSX from "xlsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "recharts"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Timestamp } from "firebase/firestore"

export default function DataPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const { showToast } = useToast()
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

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false)
  const [deletingGM, setDeletingGM] = useState<GM | null>(null)
  const [editingRow, setEditingRow] = useState<GM | null>(null)
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

  const [selectedGMs, setSelectedGMs] = useState<Set<string>>(new Set())
  const [isBulkSellModalOpen, setIsBulkSellModalOpen] = useState(false)
  const [bulkSellQuantities, setBulkSellQuantities] = useState<Record<string, number>>({})
  const [showReceipt, setShowReceipt] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [saleGMs, setSaleGMs] = useState<SaleGM[]>([])
  const [salesHistoryFilter, setSalesHistoryFilter] = useState<"all" | "today" | "week" | "month">("all")

  const [loans, setLoans] = useState<LoanRecord[]>([])
  const [pendingLoans, setPendingLoans] = useState<LoanRecord[]>([])
  const [totalLoanAmount, setTotalLoanAmount] = useState(0)
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [isLoanPaymentModalOpen, setIsLoanPaymentModalOpen] = useState(false)
  const [isLoanDetailsModalOpen, setIsLoanDetailsModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null)
  const [loanStatusFilter, setLoanStatusFilter] = useState<string>("all")
  const [loanSearchQuery, setLoanSearchQuery] = useState("")
  const [salesSearchQuery, setSalesSearchQuery] = useState("")
  const [isSaleDetailsModalOpen, setIsSaleDetailsModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<SaleGM | null>(null)
  const [sellAsLoan, setSellAsLoan] = useState(false)
  const [loanCustomerData, setLoanCustomerData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    dueDate: "",
    notes: "",
  })
  const [loanPaymentData, setLoanPaymentData] = useState({
    amount: "",
    note: "",
  })

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [refreshing, setRefreshing] = useState(false) // Added refreshing state

  // Pagination state for loans and sales tabs
  const [loansPage, setLoansPage] = useState(1)
  const [loansPerPage, setLoansPerPage] = useState(10)
  const [salesPage, setSalesPage] = useState(1)
  const [salesPerPage, setSalesPerPage] = useState(10)

  const [companies, setCompanies] = useState<string[]>([]) // Declared companies state
  const [categories, setCategories] = useState<string[]>([]) // Declared categories state
  const [salesTrendData, setSalesTrendData] = useState<Array<{ month: string; sales: number }>>([]) // Declared salesTrendData state
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number }>>([]) // Declared categoryData state
  const [formData, setFormData] = useState({
    // Declared formData state
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
    paymentType: "naqd" as "naqd" | "qarz",
  })
  const fileInputRef = useRef<HTMLInputElement>(null) // Declared fileInputRef
  const [isAddModalOpen, setIsAddModalOpen] = useState(false) // Declared isAddModalOpen state

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const loadData = async () => {
    if (user) {
      setIsInitialLoading(true)
      await Promise.all([
        loadGMs(),
        loadLowStockGMs(),
        loadInventoryValue(),
        loadCompanyData(),
        loadCategoryData(),
        loadSalesTrend(),
        loadLoans(),
        loadPendingLoans(),
        loadTotalLoanAmount(),
      ])
      setIsInitialLoading(false)
    }
  }

  // Fetch initial data including sale transactions
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsInitialLoading(true)
        try {
          const [GMsData, loansData, transactionsData] = await Promise.all([
            getGMs(),
            getLoans(),
            getSaleGMs(),
          ])
          setData(GMsData)
          setLoans(loansData)
          setSaleGMs(transactionsData)
          loadLowStockGMs()
          loadInventoryValue()
          loadCompanyData()
          loadCategoryData()
          loadSalesTrend()
          loadPendingLoans()
          loadTotalLoanAmount()
        } catch (error) {
          console.error("Error fetching data:", error)
          showToast({
            title: t("common.error"),
            description: t("common.errorFetchingData"),
            variant: "destructive",
          })
        } finally {
          setIsInitialLoading(false)
        }
      }
    }
    fetchData()
  }, [user, t, showToast])

  const loadGMs = async () => {
    try {
      setIsLoading(true)
      const GMs = await getGMs()
      setData(GMs)
    } catch (error) {
      console.error("Error loading GMs:", error)
      showToast({
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
  const loadSalesTrend = () => {
    const monthlySales: { [key: string]: number } = {}
    // Ensure data is available before iterating
    if (data.length === 0) {
      setSalesTrendData([])
      return
    }

    data.forEach((GM) => {
      // Assuming GM.sold represents sales for that GM.
      // If sales trend should be based on sale transactions, this needs to be re-evaluated.
      // For now, assuming it's based on total sold quantity per GM category or similar.
      // This calculation might need to be based on actual sale transactions for a more accurate trend.
      const month = new Date().toLocaleString("default", { month: "short" }) // Simplified for example
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedData.map((p) => p.id).filter(Boolean) as string[])
      setSelectedGMs(allIds)
      // Initialize quantities for all selected GMs
      const quantities: Record<string, number> = {}
      paginatedData.forEach((p) => {
        if (p.id) quantities[p.id] = 1
      })
      setBulkSellQuantities(quantities)
    } else {
      setSelectedGMs(new Set())
      setBulkSellQuantities({})
    }
  }

  const handleSelectGM = (GMId: string, checked: boolean) => {
    const newSelected = new Set(selectedGMs)
    if (checked) {
      newSelected.add(GMId)
      setBulkSellQuantities((prev) => ({ ...prev, [GMId]: 1 }))
    } else {
      newSelected.delete(GMId)
      setBulkSellQuantities((prev) => {
        const updated = { ...prev }
        delete updated[GMId]
        return updated
      })
    }
    setSelectedGMs(newSelected)
  }

  const handleBulkSell = async () => {
    try {
      const selectedGMsList = Array.from(selectedGMs)
        .map((id) => data.find((p) => p.id === id))
        .filter((p): p is GM => p !== undefined)

      if (selectedGMsList.length === 0) {
        showToast({
          title: t("common.error"),
          description: "Iltimos, sotish uchun mahsulotlarni tanlang",
          variant: "destructive",
        })
        return
      }

      // Validate quantities
      for (const GM of selectedGMsList) {
        const quantity = bulkSellQuantities[GM.id!] || 0
        if (quantity <= 0) {
          showToast({
            title: t("common.error"),
            description: `${GM.nomi} uchun miqdor kiriting`,
            variant: "destructive",
          })
          return
        }
        if (quantity > (GM.stock || 0)) {
          showToast({
            title: t("common.error"),
            description: `${GM.nomi} uchun yetarli mahsulot yo'q`,
            variant: "destructive",
          })
          return
        }
      }

      // If selling as loan, validate customer data
      if (sellAsLoan) {
        if (!loanCustomerData.customerName.trim()) {
          showToast({
            title: t("common.error"),
            description: t("loan.customerName") + " kiritilishi shart",
            variant: "destructive",
          })
          return
        }
      }

      // Process sales
      const saleItems = []
      for (const GM of selectedGMsList) {
        const quantity = bulkSellQuantities[GM.id!]
        await sellGM(GM.id!, quantity)

        const price = Number.parseFloat(GM.narxi.replace(/[^\d.]/g, "")) || 0
        saleItems.push({
          GMId: GM.id!,
          GMName: GM.nomi,
          GMCode: GM.kodi,
          company: GM.kompaniya,
          model: GM.model, // Added model here
          quantity,
          price,
          total: price * quantity,
          location: GM.location,
        })
      }

      // Create receipt data
      const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0)
      const receiptNumber = `RCP-${Date.now()}`

      const receipt = {
        receiptNumber,
        items: saleItems,
        totalAmount,
        date: new Date(),
      }

      const transactionData: any = {
        items: saleItems,
        totalAmount,
        receiptNumber,
        saleDate: Timestamp.now(),
        isLoan: sellAsLoan,
        amountPaid: sellAsLoan ? 0 : totalAmount,
        amountRemaining: sellAsLoan ? totalAmount : 0,
      }

      // Only add loan fields if it's actually a loan
      if (sellAsLoan) {
        transactionData.loanStatus = "pending"
      }

      const transactionId = await saveSaleGM(transactionData)

      // If loan, create loan record
      if (sellAsLoan) {
        await createLoan({
          customerName: loanCustomerData.customerName,
          customerPhone: loanCustomerData.customerPhone,
          customerAddress: loanCustomerData.customerAddress,
          transactionId,
          receiptNumber,
          totalAmount,
          amountPaid: 0,
          amountRemaining: totalAmount,
          loanDate: Timestamp.now(),
          dueDate: loanCustomerData.dueDate ? Timestamp.fromDate(new Date(loanCustomerData.dueDate)) : undefined,
          status: "pending",
          paymentHistory: [],
          notes: loanCustomerData.notes,
        })

        showToast({
          title: t("common.success"),
          description: t("loan.loanCreated"),
          variant: "success",
        })
      }

      setReceiptData(receipt)
      setShowReceipt(true)
      setIsBulkSellModalOpen(false)
      setSelectedGMs(new Set())
      setBulkSellQuantities({})
      setSellAsLoan(false)
      setLoanCustomerData({
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        dueDate: "",
        notes: "",
      })

      await loadSaleGMs()
      await loadData()

      showToast({
        title: t("common.success"),
        description: `${selectedGMsList.length} ta mahsulot sotildi`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error selling GMs:", error)
      showToast({
        title: t("common.error"),
        description: "Mahsulotlarni sotishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const printReceipt = () => {
    console.log("[v0] Starting print, receiptData:", receiptData)
    setIsPrinting(true)
    setTimeout(() => {
      console.log("[v0] isPrinting set to true, calling window.print()")
      const printElement = document.querySelector(".receipt-print-only")
      console.log("[v0] Print element found:", printElement)
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const handleCreate = async () => {
    try {
      setIsSubmitting(true)

      await addGM({
        kodi: formData.kodi,
        model: formData.model,
        nomi: formData.nomi,
        kompaniya: formData.kompaniya,
        narxi: formData.narxi,
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
        paymentType: formData.paymentType,
        sold: 0,
      })

      await loadGMs()
      await loadLowStockGMs()
      await loadInventoryValue()
      await loadCompanyData() // Reload company data
      await loadCategoryData() // Reload category data
      setIsCreateModalOpen(false)
      resetFormData()
      showToast({
        title: t("common.success"),
        description: t("GMCreated"),
        variant: "success",
      })
    } catch (error) {
      console.error("Error creating GM:", error)
      showToast({
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
      paymentType: "naqd",
    })
  }

  const handleEdit = (row: GM) => {
    setEditingRow(row)
    setFormData({
      kodi: row.kodi,
      model: row.model,
      nomi: row.nomi,
      kompaniya: row.kompaniya,
      narxi: row.narxi,
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
      paymentType: row.paymentType || "naqd",
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingRow?.id) return

    try {
      setIsSubmitting(true)

      await updateGM(editingRow.id, {
        kodi: formData.kodi,
        model: formData.model,
        nomi: formData.nomi,
        kompaniya: formData.kompaniya,
        narxi: formData.narxi,
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
        paymentType: formData.paymentType,
      })

      await loadGMs()
      await loadLowStockGMs()
      await loadInventoryValue()
      await loadCompanyData() // Reload company data
      await loadCategoryData() // Reload category data
      setIsEditModalOpen(false)
      setEditingRow(null)
      resetFormData()
      showToast({
        title: t("common.success"),
        description: t("GMUpdated"),
        variant: "success",
      })
    } catch (error) {
      console.error("Error updating GM:", error)
      showToast({
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
      await loadGMs()
      await loadLowStockGMs()
      await loadInventoryValue()
      await loadCompanyData() // Reload company data
      await loadCategoryData() // Reload category data
      setIsDeleteModalOpen(false)
      setDeletingGM(null)
      showToast({
        title: t("common.success"),
        description: t("GMDeleted"),
        variant: "success",
      })
    } catch (error) {
      console.error("Error deleting GM:", error)
      showToast({
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
      await loadGMs()
      await loadLowStockGMs()
      await loadInventoryValue()
      await loadCompanyData() // Reload company data
      await loadCategoryData() // Reload category data
      setIsDeleteAllModalOpen(false)
      showToast({
        title: t("common.success"),
        description: t("deleteAllSuccess"),
        variant: "success",
      })
    } catch (error) {
      console.error("Error deleting all GMs:", error)
      showToast({
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

    try {
      setIsSubmitting(true)

      await sellGM(sellingGM.id, sellQuantity)
      await loadGMs()
      await loadLowStockGMs()
      await loadInventoryValue()
      await loadSalesTrend() // Update sales trend after sale
      setIsSellModalOpen(false)
      setSellingGM(null)
      setSellQuantity(1)
      showToast({
        title: t("common.success"),
        description: t("GMSold", { quantity: sellQuantity, name: sellingGM.nomi }),
        variant: "success",
      })
    } catch (error) {
      console.error("Error selling GM:", error)
      showToast({
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

    try {
      setIsSubmitting(true)

      if (stockAction === "add") {
        await addStock(stockGM.id, stockQuantity)
      } else {
        await removeStock(stockGM.id, stockQuantity)
      }

      await loadGMs()
      await loadLowStockGMs()
      await loadInventoryValue()
      await loadSalesTrend() // Update sales trend after stock change
      await loadCategoryData() // Reload category data
      setIsStockModalOpen(false)
      setStockGM(null)
      setStockQuantity(1)
      showToast({
        title: t("common.success"),
        description: `${stockAction === "add" ? "Added" : "Removed"} ${stockQuantity} items`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error updating stock:", error)
      showToast({
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
      setShowImportDialog(true)
    }
    event.target.value = ""
  }

  const handleCancelImport = () => {
    setShowImportDialog(false)
    setImportFile(null)
    setIsUploading(false)
    setUploadProgress(0)
  }

  const handleConfirmImport = async () => {
    if (!importFile) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        setIsUploading(true)
        setUploadProgress(0)

        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        const rows = jsonData.slice(1).filter((row) => row.length >= 5)
        setUploadProgress(10)

        let successCount = 0
        const errors: string[] = []
        const totalRows = rows.length

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          try {
            const [kodi, model, nomi, kompaniya, narxi] = row

            if (!kodi || !nomi || !kompaniya || !narxi) {
              errors.push(`Row ${i + 2}: missing required fields`)
              continue
            }

            await addGM({
              kodi: String(kodi).trim(),
              model: String(model || "").trim(),
              nomi: String(nomi).trim(),
              kompaniya: String(kompaniya).trim(),
              narxi: String(narxi).replace(/\s/g, ""),
              sold: 0,
            })

            successCount++
            setUploadProgress(10 + ((i + 1) / totalRows) * 80)
          } catch (error) {
            console.error("Error adding GM:", error)
            errors.push(`Failed to add GM: ${row[0]}`)
          }
        }

        setUploadProgress(90)
        await loadGMs()
        await loadLowStockGMs()
        await loadInventoryValue()
        await loadCompanyData()
        await loadCategoryData()
        setUploadProgress(100)

        showToast({
          title: t("common.success"),
          description: `${successCount} GMs imported successfully${errors.length > 0 ? `. ${errors.length} errors occurred.` : ""}`,
          variant: "success",
        })

        if (errors.length > 0) {
          console.warn("Import errors:", errors)
        }

        setShowImportDialog(false)
        setImportFile(null)
      } catch (error) {
        console.error("Error processing Excel file:", error)
        showToast({
          title: t("common.error"),
          description: "Failed to process Excel file. Please check the format.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
    reader.readAsArrayBuffer(importFile)
  }

  const handleExportExcel = () => {
    const exportData = data.map((GM) => ({
      KODI: GM.kodi,
      MODEL: GM.model,
      NOMI: GM.nomi,
      KOMPANIYA: GM.kompaniya,
      NARXI: GM.narxi,
      SOLD: GM.sold || 0,
      STOCK: GM.stock || 0,
      MIN_STOCK: GM.minStock || 0,
      MAX_STOCK: GM.maxStock || 0,
      LOCATION: GM.location || "",
      CATEGORY: GM.category || "",
      SUPPLIER: GM.supplier || "",
      COST: GM.cost || "",
      STATUS: GM.status || "active",
      BARCODE: GM.barcode || "",
      WEIGHT: GM.weight || 0,
      DIMENSIONS: GM.dimensions || "",
      DESCRIPTION: GM.description || "",
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "GMs")
    XLSX.writeFile(wb, "warehouse_inventory.xlsx")

    showToast({
      title: t("common.success"),
      description: "Inventory exported successfully",
      variant: "success",
    })
  }

  const filteredData = useMemo(() => {
    const filtered = data.filter((row) => {
      const matchesSearch =
        searchTerm === "" ||
        row.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.kodi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.kompaniya.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.supplier || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.location || "").toLowerCase().includes(searchTerm.toLowerCase())

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
    const price = Number.parseFloat(GM.narxi?.toString().replace(/[^0-9.-]/g, "")) || 0
    const sold = GM.sold || 0
    return sum + sold * price
  }, 0)

  const averagePrice =
    data.length > 0
      ? data.reduce((sum, GM) => {
          const price = Number.parseFloat(GM.narxi?.toString().replace(/[^0-9.-]/g, "")) || 0
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
      const price = Number.parseFloat(GM.narxi?.toString().replace(/[^0-9.-]/g, "")) || 0
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
      name: GM.nomi || "Unknown",
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

  const loadLoans = async () => {
    try {
      const loansData = await getLoans()
      setLoans(loansData)
    } catch (error) {
      console.error("Error loading loans:", error)
    }
  }

  const loadPendingLoans = async () => {
    try {
      const pending = await getPendingLoans()
      setPendingLoans(pending)
    } catch (error) {
      console.error("Error loading pending loans:", error)
    }
  }

  const loadTotalLoanAmount = async () => {
    try {
      const total = await getTotalLoanAmount()
      setTotalLoanAmount(total)
    } catch (error) {
      console.error("Error loading total loan amount:", error)
    }
  }

  const loadSaleGMs = async () => {
    try {
      const transactions = await getSaleGMs()
      setSaleGMs(transactions)
    } catch (error) {
      console.error("Error loading sale transactions:", error)
      showToast({
        title: t("common.error"),
        description: "Sotilgan mahsulotlar tarixini yuklashda xatolik", // Error loading sales history
        variant: "destructive",
      })
    }
  }

  // Filter loans based on status and search query
  const filteredLoans = useMemo(() => {
    const searchLower = loanSearchQuery.toLowerCase()
    return loans.filter((loan) => {
      const matchesStatus =
        loanStatusFilter === "all" ||
        loan.status === loanStatusFilter ||
        (loanStatusFilter === "partial" &&
          loan.amountRemaining !== undefined &&
          loan.amountRemaining > 0 &&
          loan.amountRemaining < loan.totalAmount)
      const matchesSearch =
        !searchLower ||
        loan.customerName.toLowerCase().includes(searchLower) ||
        loan.customerPhone.toLowerCase().includes(searchLower) ||
        (loan.notes || "").toLowerCase().includes(searchLower)

      return matchesStatus && matchesSearch
    })
  }, [loans, loanStatusFilter, loanSearchQuery])

  // Updated filteredSales to correctly include paid loans with their items
  const filteredSales = useMemo(() => {
    // Get regular sales (non-loan transactions)
    const regularSales = saleGMs.filter((transaction) => !transaction.isLoan)

    // Get paid loans and map them with their transaction items
    const paidLoans = loans
      .filter((loan) => loan.status === "paid")
      .map((loan) => {
        // Find the corresponding transaction to get GM items
        const transaction = saleGMs.find((t) => t.id === loan.transactionId)

        return {
          id: loan.id,
          receiptNumber: loan.receiptNumber,
          items: transaction?.items || [],
          totalAmount: loan.totalAmount,
          saleDate: loan.loanDate || loan.saleDate || Timestamp.now(), // Use loanDate or fallback
          isLoan: true,
          isPaidLoan: true, // Mark as paid loan for display
          customerName: loan.customerName,
          customerPhone: loan.customerPhone,
          customerAddress: loan.customerAddress,
        }
      })

    // Combine regular sales and paid loans, then sort by date
    const allSales = [...regularSales, ...paidLoans].sort((a, b) => {
      const dateA = a.saleDate?.toDate?.() || new Date(0)
      const dateB = b.saleDate?.toDate?.() || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

    // Apply date filtering
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    let dateFilteredSales = allSales
    if (salesHistoryFilter === "today") {
      dateFilteredSales = allSales.filter((transaction) => transaction.saleDate?.toDate?.() >= today)
    } else if (salesHistoryFilter === "week") {
      dateFilteredSales = allSales.filter((transaction) => transaction.saleDate?.toDate?.() >= weekAgo)
    } else if (salesHistoryFilter === "month") {
      dateFilteredSales = allSales.filter((transaction) => transaction.saleDate?.toDate?.() >= monthAgo)
    }

    // Apply search filter
    if (!salesSearchQuery.trim()) return dateFilteredSales

    const searchLower = salesSearchQuery.toLowerCase()
    return dateFilteredSales.filter((transaction) => {
      const receiptMatch = transaction.receiptNumber.toLowerCase().includes(searchLower)
      const dateMatch = transaction.saleDate?.toDate?.()?.toLocaleDateString("uz-UZ").includes(searchLower)
      const GMMatch = transaction.items.some(
        (item) =>
          item.GMName.toLowerCase().includes(searchLower) ||
          item.GMCode?.toLowerCase().includes(searchLower) ||
          item.company?.toLowerCase().includes(searchLower),
      )
      const customerMatch =
        (transaction.customerName?.toLowerCase().includes(searchLower) ||
          transaction.customerPhone?.toLowerCase().includes(searchLower)) ??
        false
      return receiptMatch || dateMatch || GMMatch || customerMatch
    })
  }, [saleGMs, loans, salesHistoryFilter, salesSearchQuery])

  const loansTotalPages = Math.ceil(filteredLoans.length / loansPerPage)
  const loansStartIndex = (loansPage - 1) * loansPerPage
  const loansEndIndex = loansStartIndex + loansPerPage
  const paginatedLoans = filteredLoans.slice(loansStartIndex, loansEndIndex)

  const salesTotalPages = Math.ceil(filteredSales.length / salesPerPage)
  const salesStartIndex = (salesPage - 1) * salesPerPage
  const salesEndIndex = salesStartIndex + salesPerPage
  const paginatedSales = filteredSales.slice(salesStartIndex, salesEndIndex)

  const totalSalesAmount = useMemo(() => {
    return filteredSales.reduce((sum, t) => sum + t.totalAmount, 0)
  }, [filteredSales])

  const totalItemsSold = useMemo(() => {
    return filteredSales.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  }, [filteredSales])

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
    await loadData()
    await loadSaleGMs() // Also refresh sales history
    setRefreshing(false)
    showToast({ title: t("common.success"), description: t("data.refreshed"), variant: "success" })
  }

  const getFilteredSales = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    return saleGMs.filter((transaction) => {
      if (transaction.isLoan) {
        return false
      }

      const saleDate = transaction.saleDate.toDate()

      switch (salesHistoryFilter) {
        case "today":
          return saleDate >= today
        case "week":
          return saleDate >= weekAgo
        case "month":
          return saleDate >= monthAgo
        default: // "all"
          return true
      }
    })
  }

  const handleAddLoanPayment = async () => {
    if (!selectedLoan) return

    try {
      const amount = Number.parseFloat(loanPaymentData.amount)
      if (isNaN(amount) || amount <= 0) {
        showToast({
          title: t("common.error"),
          description: "To'g'ri summa kiriting",
          variant: "destructive",
        })
        return
      }

      if (amount > (selectedLoan.amountRemaining || 0)) {
        showToast({
          title: t("common.error"),
          description: "Summa qolgan qarzdan ko'p bo'lmasligi kerak",
          variant: "destructive",
        })
        return
      }

      await addLoanPayment(selectedLoan.id!, amount, loanPaymentData.note)

      showToast({
        title: t("common.success"),
        description: t("loan.paymentSuccess"),
        variant: "success",
      })

      setIsLoanPaymentModalOpen(false)
      setLoanPaymentData({ amount: "", note: "" })
      setSelectedLoan(null)
      await loadLoans()
      await loadPendingLoans()
      await loadTotalLoanAmount()
    } catch (error) {
      console.error("Error adding loan payment:", error)
      showToast({
        title: t("common.error"),
        description: "To'lovni qo'shishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  // Render function for the loans table with GM details
  const renderLoansTable = () => {
    return (
      <div className="space-y-4">
        {paginatedLoans.map((loan) => {
          // Find the transaction to get GM items
          const transaction = saleGMs.find((t) => t.id === loan.transactionId)
          const items = transaction?.items || []

          return (
            <Card key={loan.id} className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  {/* Customer Info */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold text-lg">{loan.customerName}</p>
                          {loan.customerPhone && <p className="text-sm text-muted-foreground">{loan.customerPhone}</p>}
                        </div>
                      </div>

                      {/* GM Details */}
                      {items.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Mahsulotlar:
                          </p>
                          <div className="space-y-1.5">
                            {items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{item.GMName}</p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600 mt-0.5">
                                      <span>Kod: {item.GMCode}</span>
                                      <span>•</span>
                                      <span>{item.company}</span>
                                      {item.location && (
                                        <>
                                          <span>•</span>
                                          <span className="flex items-center gap-0.5">
                                            <MapPin className="h-3 w-3" />
                                            {item.location}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right whitespace-nowrap">
                                    <p className="text-xs text-gray-600">
                                      {item.quantity} x ${item.price.toFixed(2)}
                                    </p>
                                    <p className="font-semibold text-sm">${(item.quantity * item.price).toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Financial Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">{t("loan.totalAmount")}</p>
                          <p className="font-semibold">${loan.totalAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("loan.amountPaid")}</p>
                          <p className="font-semibold text-green-600">${(loan.amountPaid || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("loan.amountRemaining")}</p>
                          <p className="font-semibold text-orange-600">
                            ${(loan.amountRemaining || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("loan.status")}</p>
                          <Badge
                            variant={
                              loan.status === "paid"
                                ? "default"
                                : loan.status === "partial"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {t(`loan.status.${loan.status}`)}
                          </Badge>
                        </div>
                      </div>

                      {loan.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Eslatma:</span> {loan.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLoan(loan)
                          setIsLoanDetailsModalOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {loan.status !== "paid" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedLoan(loan)
                            setIsLoanPaymentModalOpen(true)
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {t("loan.makePayment")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

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
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx,.xls" className="hidden" />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Upload className="h-4 w-4" />
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

      {isUploading && (
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
        <TabsList className="grid w-full grid-cols-4 mb-6 h-12 lg:h-10">
          <TabsTrigger value="table" className="flex items-center gap-2 text-sm lg:text-base font-medium">
            <Table className="h-4 w-4" />
            {t("tabs.table")}
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2 text-sm lg:text-base font-medium">
            <BarChart3 className="h-4 w-4" />
            {t("tabs.statistics")}
          </TabsTrigger>
          <TabsTrigger value="loans" className="flex items-center gap-2 text-sm lg:text-base font-medium">
            <HandCoins className="h-4 w-4" />
            {t("loan.title")}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 text-sm lg:text-base font-medium">
            <Receipt className="h-4 w-4" />
            Tarix
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
                    {selectedGMs.size > 0 && (
                      <Button
                        onClick={() => setIsBulkSellModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white h-9 lg:h-10 text-sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Mahsulotlarni sotish ({selectedGMs.size}) {/* Sell GMs ({count}) */}
                      </Button>
                    )}
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
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#0099b5] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        <Checkbox
                          checked={selectedGMs.size === paginatedData.length && paginatedData.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("kodi")}
                        title={t("filter.kod")}
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          {t("kodi")}
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
                        onClick={() => handleColumnClick("model")}
                        title={t("filter.model")}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          {t("model")}
                          {sortColumn === "model" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("nomi")}
                        title={t("filter.nomi")}
                      >
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {t("nomi")}
                          {sortColumn === "nomi" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("kompaniya")}
                        title={t("filter.kompaniya")}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {t("kompaniya")}
                          {sortColumn === "kompaniya" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("location")}
                        title="Joylashuv"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Joylashuv
                          {sortColumn === "location" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="text-left py-4 px-6 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleColumnClick("paymentType")}
                        title="MAXSULOT"
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          MAXSULOT
                          {sortColumn === "paymentType" &&
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
                          {t("narxi")}
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
                          "hover:bg-gray-50 transition-colors",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                        )}
                      >
                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedGMs.has(row.id || "")}
                            onCheckedChange={(checked) => handleSelectGM(row.id || "", checked as boolean)}
                          />
                        </td>
                        <td className="py-4 px-6" onClick={() => handleViewDetails(row)}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#0099b5] rounded-full"></div>
                            <span className="font-mono text-sm font-medium text-gray-900">{row.kodi}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6" onClick={() => handleViewDetails(row)}>
                          <span className="text-gray-600 font-medium">{row.model || "-"}</span>
                        </td>
                        <td className="py-4 px-6" onClick={() => handleViewDetails(row)}>
                          <div className="max-w-[200px]">
                            <p className="text-gray-900 font-medium truncate" title={row.nomi}>
                              {row.nomi || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6" onClick={() => handleViewDetails(row)}>
                          <Badge
                            className="bg-[#0099b5]/10 text-[#0099b5] border border-[#0099b5]/20 cursor-pointer hover:bg-[#0099b5]/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCompanyClick(row.kompaniya)
                            }}
                            title={t("clickToFilter")}
                          >
                            {row.kompaniya || "-"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6" onClick={() => handleViewDetails(row)}>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            {row.location || "-"}
                          </div>
                        </td>
                        <td className="py-4 px-6" onClick={() => handleViewDetails(row)}>
                          <Badge
                            className={cn(
                              "font-semibold",
                              row.paymentType === "qarz"
                                ? "bg-orange-100 text-orange-800 border-orange-200"
                                : "bg-green-100 text-green-800 border-green-200",
                            )}
                          >
                            {row.paymentType === "qarz" ? "Qarz" : "Naqd"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6" onClick={() => handleViewDetails(row)}>
                          <span className="font-semibold text-green-600 text-lg">{row.narxi}</span>
                        </td>
                        <td className="py-4 px-6" onClick={() => handleViewDetails(row)}>
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
                        <td className="py-4 px-6" onClick={() => handleViewDetails(row)}>
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
                              onClick={() => handleEdit(row)}
                              className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                              title={t("editGM")}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStockAction(row, "add")}
                            >
                              <PackagePlus className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStockAction(row, "remove")}
                            >
                              <PackageMinus className="h-4 w-4 text-orange-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(row)}
                              className="text-red-600 hover:bg-red-50 p-2 h-9 w-9 rounded-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

                        {/* GM name and model */}
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{row.nomi}</h3>
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
                            className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStockAction(row, "add")}
                          >
                            <PackagePlus className="h-4 w-4 text-green-600" />
                            {/* {t("action.addStock")} */}
                          </Button>
                          <Button
                            className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStockAction(row, "remove")}
                          >
                            <PackageMinus className="h-4 w-4 text-orange-600" />
                            {/* {t("action.removeStock")} */}
                          </Button>
                          <Button
                            className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSell(row)}
                          >
                            <ShoppingCart className="h-4 w-4 text-purple-600" />
                            {/* {t("sellGM")} */}
                          </Button>
                          <DropdownMenuSeparator />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#0099b5] hover:bg-[#0099b5]/10 p-2 h-9 w-9 rounded-full"
                            onClick={() => handleDeleteClick(row)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                            {/* {t("deleteGM")} */}
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

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5 text-[#0099b5]" />
                    Sotilgan mahsulotlar tarixi
                  </CardTitle>
                  <CardDescription className="text-sm">Barcha sotuvlar va ularning tafsilotlari</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={salesHistoryFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSalesHistoryFilter("all")}
                    className={salesHistoryFilter === "all" ? "bg-[#0099b5] hover:bg-[#0099b5]/90" : ""}
                  >
                    Barchasi
                  </Button>
                  <Button
                    variant={salesHistoryFilter === "today" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSalesHistoryFilter("today")}
                    className={salesHistoryFilter === "today" ? "bg-[#0099b5] hover:bg-[#0099b5]/90" : ""}
                  >
                    Bugun
                  </Button>
                  <Button
                    variant={salesHistoryFilter === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSalesHistoryFilter("week")}
                    className={salesHistoryFilter === "week" ? "bg-[#0099b5] hover:bg-[#0099b5]/90" : ""}
                  >
                    7 kun
                  </Button>
                  <Button
                    variant={salesHistoryFilter === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSalesHistoryFilter("month")}
                    className={salesHistoryFilter === "month" ? "bg-[#0099b5] hover:bg-[#0099b5]/90" : ""}
                  >
                    30 kun
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Chek raqami yoki mahsulot nomi bo'yicha qidirish..."
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Sales Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Jami sotuvlar</p>
                        <p className="text-2xl font-bold text-blue-900">{filteredSales.length}</p>
                      </div>
                      <div className="p-3 bg-blue-500 rounded-full">
                        <Receipt className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Jami summa</p>
                        <p className="text-2xl font-bold text-green-900">${totalSalesAmount.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-green-500 rounded-full">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Sotilgan mahsulotlar</p>
                        <p className="text-2xl font-bold text-purple-900">{totalItemsSold}</p>
                      </div>
                      <div className="p-3 bg-purple-500 rounded-full">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sales History Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  {filteredSales.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>Hozircha sotuvlar yo'q</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Chek raqami</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Sana va vaqt</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Mahsulotlar</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Jami summa</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Amallar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSales.map((transaction) => {
                          if (!transaction.saleDate) return null
                          const saleDate = transaction.saleDate.toDate()
                          return (
                            <tr
                              key={transaction.id}
                              className="border-t hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                setSelectedSale(transaction)
                                setIsSaleDetailsModalOpen(true)
                              }}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Receipt className="h-4 w-4 text-[#0099b5]" />
                                  <span className="font-mono text-sm">{transaction.receiptNumber}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    {saleDate.toLocaleDateString("uz-UZ", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </div>
                                  <div className="text-gray-500">
                                    {saleDate.toLocaleTimeString("uz-UZ", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  {transaction.items.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="text-sm">
                                      <span className="font-medium text-gray-900">{item.GMName}</span>
                                      <span className="text-gray-500 ml-2">
                                        ({item.quantity} x ${item.price.toFixed(2)})
                                      </span>
                                    </div>
                                  ))}
                                  {transaction.items.length > 2 && (
                                    <div className="text-sm text-gray-500">
                                      +{transaction.items.length - 2} ta mahsulot
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-bold text-green-600 text-lg">
                                  ${transaction.totalAmount.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setReceiptData({
                                      receiptNumber: transaction.receiptNumber,
                                      items: transaction.items,
                                      totalAmount: transaction.totalAmount,
                                      date: saleDate,
                                    })
                                    setShowReceipt(true)
                                  }}
                                  className="text-[#0099b5] hover:bg-[#0099b5]/10"
                                >
                                  <Printer className="h-4 w-4 mr-1" />
                                  Chek
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {filteredSales.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Sahifada:</span>
                    <Select
                      value={salesPerPage.toString()}
                      onValueChange={(value) => {
                        setSalesPerPage(Number(value))
                        setSalesPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[100px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">
                      {salesStartIndex + 1}-{Math.min(salesEndIndex, filteredSales.length)} / {filteredSales.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSalesPage(1)}
                      disabled={salesPage === 1}
                      className="h-9"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSalesPage((prev) => Math.max(1, prev - 1))}
                      disabled={salesPage === 1}
                      className="h-9"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-3">
                      {salesPage} / {salesTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSalesPage((prev) => Math.min(salesTotalPages, prev + 1))}
                      disabled={salesPage === salesTotalPages}
                      className="h-9"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSalesPage(salesTotalPages)}
                      disabled={salesPage === salesTotalPages}
                      className="h-9"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
          {/* Loan Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("loan.totalLoans")}</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loans.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Jami: ${totalLoanAmount.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("loan.pendingLoans")}</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingLoans.length}</div>
                <p className="text-xs text-muted-foreground mt-1">To'lanishi kerak</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("loan.paidLoans")}</CardTitle>
                <CreditCard className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loans.filter((l) => l.status === "paid").length}</div>
                <p className="text-xs text-muted-foreground mt-1">To'langan qarzlar</p>
              </CardContent>
            </Card>
          </div>

          {/* Loan Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("loan.loanList")}</CardTitle>
                    <CardDescription>Qarzga olganlar ro'yxati va to'lovlar</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Mijoz ismi, telefon yoki eslatma bo'yicha qidirish..."
                      value={loanSearchQuery}
                      onChange={(e) => setLoanSearchQuery(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                  <Select value={loanStatusFilter} onValueChange={setLoanStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[200px] h-10">
                      <SelectValue placeholder={t("loan.filterStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("loan.allLoans")}</SelectItem>
                      <SelectItem value="pending">{t("loan.status.pending")}</SelectItem>
                      <SelectItem value="partial">{t("loan.status.partial")}</SelectItem>
                      <SelectItem value="paid">{t("loan.status.paid")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLoans.length === 0 ? (
                <div className="text-center py-12">
                  <HandCoins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {loanSearchQuery ? "Qidiruv bo'yicha natija topilmadi" : t("loan.noLoans")}
                  </p>
                </div>
              ) : (
                <>
                  {renderLoansTable()}

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Sahifada:</span>
                      <Select
                        value={loansPerPage.toString()}
                        onValueChange={(value) => {
                          setLoansPerPage(Number(value))
                          setLoansPage(1)
                        }}
                      >
                        <SelectTrigger className="w-[100px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">
                        {loansStartIndex + 1}-{Math.min(loansEndIndex, filteredLoans.length)} / {filteredLoans.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLoansPage((p) => Math.max(1, p - 1))}
                        disabled={loansPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        Sahifa {loansPage} / {loansTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLoansPage((p) => Math.min(loansTotalPages, p + 1))}
                        disabled={loansPage === loansTotalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 lg:space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5 text-[#0099b5]" />
                    Sotilgan mahsulotlar tarixi
                  </CardTitle>
                  <CardDescription className="text-sm">Barcha sotuvlar va ularning tafsilotlari</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={salesHistoryFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSalesHistoryFilter("all")}
                    className={salesHistoryFilter === "all" ? "bg-[#0099b5] hover:bg-[#0099b5]/90" : ""}
                  >
                    Barchasi
                  </Button>
                  <Button
                    variant={salesHistoryFilter === "today" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSalesHistoryFilter("today")}
                    className={salesHistoryFilter === "today" ? "bg-[#0099b5] hover:bg-[#0099b5]/90" : ""}
                  >
                    Bugun
                  </Button>
                  <Button
                    variant={salesHistoryFilter === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSalesHistoryFilter("week")}
                    className={salesHistoryFilter === "week" ? "bg-[#0099b5] hover:bg-[#0099b5]/90" : ""}
                  >
                    7 kun
                  </Button>
                  <Button
                    variant={salesHistoryFilter === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSalesHistoryFilter("month")}
                    className={salesHistoryFilter === "month" ? "bg-[#0099b5] hover:bg-[#0099b5]/90" : ""}
                  >
                    30 kun
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Chek raqami yoki mahsulot nomi bo'yicha qidirish..."
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Sales Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Jami sotuvlar</p>
                        <p className="text-2xl font-bold text-blue-900">{filteredSales.length}</p>
                      </div>
                      <div className="p-3 bg-blue-500 rounded-full">
                        <Receipt className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Jami summa</p>
                        <p className="text-2xl font-bold text-green-900">${totalSalesAmount.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-green-500 rounded-full">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Sotilgan mahsulotlar</p>
                        <p className="text-2xl font-bold text-purple-900">{totalItemsSold}</p>
                      </div>
                      <div className="p-3 bg-purple-500 rounded-full">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sales History Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  {filteredSales.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>Hozircha sotuvlar yo'q</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Chek raqami</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Sana va vaqt</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Mahsulotlar</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Jami summa</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Amallar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSales.map((transaction) => {
                          if (!transaction.saleDate) return null
                          const saleDate = transaction.saleDate.toDate()
                          return (
                            <tr
                              key={transaction.id}
                              className="border-t hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                setSelectedSale(transaction)
                                setIsSaleDetailsModalOpen(true)
                              }}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Receipt className="h-4 w-4 text-[#0099b5]" />
                                  <span className="font-mono text-sm">{transaction.receiptNumber}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    {saleDate.toLocaleDateString("uz-UZ", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </div>
                                  <div className="text-gray-500">
                                    {saleDate.toLocaleTimeString("uz-UZ", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  {transaction.items.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="text-sm">
                                      <span className="font-medium text-gray-900">{item.GMName}</span>
                                      <span className="text-gray-500 ml-2">
                                        ({item.quantity} x ${item.price.toFixed(2)})
                                      </span>
                                    </div>
                                  ))}
                                  {transaction.items.length > 2 && (
                                    <div className="text-sm text-gray-500">
                                      +{transaction.items.length - 2} ta mahsulot
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-bold text-green-600 text-lg">
                                  ${transaction.totalAmount.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setReceiptData({
                                      receiptNumber: transaction.receiptNumber,
                                      items: transaction.items,
                                      totalAmount: transaction.totalAmount,
                                      date: saleDate,
                                    })
                                    setShowReceipt(true)
                                  }}
                                  className="text-[#0099b5] hover:bg-[#0099b5]/10"
                                >
                                  <Printer className="h-4 w-4 mr-1" />
                                  Chek
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {filteredSales.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Sahifada:</span>
                    <Select
                      value={salesPerPage.toString()}
                      onValueChange={(value) => {
                        setSalesPerPage(Number(value))
                        setSalesPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[100px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">
                      {salesStartIndex + 1}-{Math.min(salesEndIndex, filteredSales.length)} / {filteredSales.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSalesPage(1)}
                      disabled={salesPage === 1}
                      className="h-9"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSalesPage((prev) => Math.max(1, prev - 1))}
                      disabled={salesPage === 1}
                      className="h-9"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-3">
                      {salesPage} / {salesTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSalesPage((prev) => Math.min(salesTotalPages, prev + 1))}
                      disabled={salesPage === salesTotalPages}
                      className="h-9"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSalesPage(salesTotalPages)}
                      disabled={salesPage === salesTotalPages}
                      className="h-9"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
              {viewingGM?.nomi} - {viewingGM?.kodi}
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
                      <span className="text-gray-600">{t("nomi")}:</span>
                      <span className="font-medium">{viewingGM.nomi}</span>
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
                          {Math.round(((viewingGM.stock || 0) / (viewingGM.maxStock || 1000)) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={((viewingGM.stock || 0) / (viewingGM.maxStock || 1000)) * 100}
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
              {stockGM?.nomi} - Current stock: {stockGM?.stock || 0}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{t("GMName")}:</span>
                <span className="font-medium">{stockGM?.nomi}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Current Stock:</span>
                <Badge className="bg-blue-100 text-blue-800">{stockGM?.stock || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Min Stock:</span>
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
                    <h4 className="font-medium text-gray-900">{GM.nomi}</h4>
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
              <Label htmlFor="edit-nomi">{t("nomi")} *</Label>
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
              <Label htmlFor="edit-paymentType">To'lov turi *</Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value: "naqd" | "qarz") => setFormData({ ...formData, paymentType: value })}
              >
                <SelectTrigger className="border-[#0099b5]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="naqd">Naqd (Pul)</SelectItem>
                  <SelectItem value="qarz">Qarz</SelectItem>
                </SelectContent>
              </Select>
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
              {t("sellGMDescription")} {sellingGM?.nomi}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{t("GMName")}:</span>
                <span className="font-medium">{sellingGM?.nomi}</span>
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
                  {(Number.parseInt(sellingGM?.narxi?.replace(/,/g, "") || "0") * sellQuantity).toLocaleString()}
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
              <span className="font-medium text-red-800">{deletingGM?.nomi}</span>
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
              <Label htmlFor="nomi">{t("nomi")} *</Label>
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
              <Label htmlFor="paymentType">To'lov turi *</Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value: "naqd" | "qarz") => setFormData({ ...formData, paymentType: value })}
              >
                <SelectTrigger className="border-[#0099b5]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="naqd">Naqd (Pul)</SelectItem>
                  <SelectItem value="qarz">Qarz</SelectItem>
                </SelectContent>
              </Select>
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

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("data.import")}</DialogTitle>
            <DialogDescription>
              {importFile ? `${importFile.name} faylini import qilmoqchimisiz?` : ""} {/* Importing file? */}
            </DialogDescription>
          </DialogHeader>

          {isUploading && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("data.importing")}</span> {/* Importing... */}
                <span className="text-sm font-semibold text-[#0099b5]">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelImport} disabled={isUploading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleConfirmImport} disabled={isUploading} className="bg-[#0099b5] hover:bg-[#0099b5]/90">
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {t("data.import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkSellModalOpen} onOpenChange={setIsBulkSellModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("sellGM")}</DialogTitle>
            <DialogDescription>Tanlangan mahsulotlarni sotish</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sale type selection */}
            <div className="flex gap-4 p-4 bg-muted rounded-lg">
              <Button
                variant={!sellAsLoan ? "default" : "outline"}
                onClick={() => setSellAsLoan(false)}
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {t("loan.sellAsCash")}
              </Button>
              <Button
                variant={sellAsLoan ? "default" : "outline"}
                onClick={() => setSellAsLoan(true)}
                className="flex-1"
              >
                <HandCoins className="h-4 w-4 mr-2" />
                {t("loan.sellAsLoan")}
              </Button>
            </div>

            {/* Customer info for loans */}
            {sellAsLoan && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-base">Mijoz ma'lumotlari</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">{t("loan.customerName")} *</Label>
                    <Input
                      id="customerName"
                      value={loanCustomerData.customerName}
                      onChange={(e) => setLoanCustomerData({ ...loanCustomerData, customerName: e.target.value })}
                      placeholder="Mijoz ismini kiriting"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">{t("loan.customerPhone")}</Label>
                    <Input
                      id="customerPhone"
                      value={loanCustomerData.customerPhone}
                      onChange={(e) => setLoanCustomerData({ ...loanCustomerData, customerPhone: e.target.value })}
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerAddress">{t("loan.customerAddress")}</Label>
                    <Input
                      id="customerAddress"
                      value={loanCustomerData.customerAddress}
                      onChange={(e) => setLoanCustomerData({ ...loanCustomerData, customerAddress: e.target.value })}
                      placeholder="Manzil"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">{t("loan.dueDate")}</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={loanCustomerData.dueDate}
                      onChange={(e) => setLoanCustomerData({ ...loanCustomerData, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">{t("loan.notes")}</Label>
                    <Textarea
                      id="notes"
                      value={loanCustomerData.notes}
                      onChange={(e) => setLoanCustomerData({ ...loanCustomerData, notes: e.target.value })}
                      placeholder="Qo'shimcha eslatmalar"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* GMs list */}
            <div className="space-y-2">
              {Array.from(selectedGMs)
                .map((id) => data.find((p) => p.id === id))
                .filter((p): p is GM => p !== undefined)
                .map((GM) => (
                  <div key={GM.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{GM.nomi}</p>
                      <p className="text-sm text-muted-foreground">
                        {GM.kodi} • {GM.kompaniya}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Miqdor:</Label>
                      <Input
                        type="number"
                        min="1"
                        max={GM.stock || 0}
                        value={bulkSellQuantities[GM.id!] || 1}
                        onChange={(e) =>
                          setBulkSellQuantities({
                            ...bulkSellQuantities,
                            [GM.id!]: Number.parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-20"
                      />
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="font-semibold">
                        $
                        {(
                          (Number.parseFloat(GM.narxi.replace(/[^\d.]/g, "")) || 0) *
                          (bulkSellQuantities[GM.id!] || 1)
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
              <span className="font-semibold text-lg">{t("totalAmount")}:</span>
              <span className="font-bold text-2xl">
                $
                {Array.from(selectedGMs)
                  .map((id) => data.find((p) => p.id === id))
                  .filter((p): p is GM => p !== undefined)
                  .reduce((sum, GM) => {
                    const price = Number.parseFloat(GM.narxi.replace(/[^\d.]/g, "")) || 0
                    const quantity = bulkSellQuantities[GM.id!] || 1
                    return sum + price * quantity
                  }, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkSellModalOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleBulkSell} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yuklanmoqda...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {sellAsLoan ? t("loan.sellAsLoan") : t("confirmSale")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoanPaymentModalOpen} onOpenChange={setIsLoanPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("loan.addPayment")}</DialogTitle>
            <DialogDescription>{selectedLoan?.customerName} uchun to'lov qo'shish</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("loan.totalAmount")}:</span>
                <span className="font-semibold">${selectedLoan?.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("loan.amountPaid")}:</span>
                <span className="font-semibold text-green-600">
                  ${(selectedLoan?.amountPaid || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("loan.amountRemaining")}:</span>
                <span className="font-semibold text-orange-600">
                  ${(selectedLoan?.amountRemaining || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="paymentAmount">{t("loan.paymentAmount")} *</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                max={selectedLoan?.amountRemaining || 0}
                value={loanPaymentData.amount}
                onChange={(e) => setLoanPaymentData({ ...loanPaymentData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="paymentNote">{t("loan.paymentNote")}</Label>
              <Textarea
                id="paymentNote"
                value={loanPaymentData.note}
                onChange={(e) => setLoanPaymentData({ ...loanPaymentData, note: e.target.value })}
                placeholder="Qo'shimcha izoh"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoanPaymentModalOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleAddLoanPayment} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yuklanmoqda...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  To'lov qo'shish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoanDetailsModalOpen} onOpenChange={setIsLoanDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("loan.viewDetails")}</DialogTitle>
            <DialogDescription>{selectedLoan?.customerName}</DialogDescription>
          </DialogHeader>

          {selectedLoan && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mijoz ma'lumotlari</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ism:</span>
                    <span className="font-medium">{selectedLoan.customerName}</span>
                  </div>
                  {selectedLoan.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefon:</span>
                      <span className="font-medium">{selectedLoan.customerPhone}</span>
                    </div>
                  )}
                  {selectedLoan.customerAddress && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manzil:</span>
                      <span className="font-medium">{selectedLoan.customerAddress}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chek raqami:</span>
                    <span className="font-medium">{selectedLoan.receiptNumber}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">To'lov ma'lumotlari</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("loan.totalAmount")}:</span>
                    <span className="font-semibold">${selectedLoan.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("loan.amountPaid")}:</span>
                    <span className="font-semibold text-green-600">
                      ${(selectedLoan.amountPaid || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("loan.amountRemaining")}:</span>
                    <span className="font-semibold text-orange-600">
                      ${(selectedLoan.amountRemaining || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("loan.status")}:</span>
                    <Badge
                      variant={
                        selectedLoan.status === "paid"
                          ? "default"
                          : selectedLoan.status === "partial"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {t(`loan.status.${selectedLoan.status}`)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              {selectedLoan.paymentHistory && selectedLoan.paymentHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("loan.paymentHistory")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedLoan.paymentHistory.map((payment, index) => (
                        <div key={index} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.date?.toDate?.()?.toLocaleDateString("uz-UZ") || "N/A"}
                            </p>
                            {payment.note && <p className="text-sm text-muted-foreground mt-1">{payment.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoanDetailsModalOpen(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-[400px] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Chek</DialogTitle>
          </DialogHeader>
          {receiptData && (
            <div
              className="receipt-container bg-white p-6 text-black"
              style={{ fontFamily: "monospace", fontSize: "14px" }}
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold mb-2">SAVDO CHEKI</h2>
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Chek №: {receiptData.receiptNumber}</p>
                  <p>
                    {receiptData.date instanceof Date
                      ? receiptData.date.toLocaleString("uz-UZ", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : receiptData.date}
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-gray-800 my-3"></div>

              {/* GMs List */}
              <div className="space-y-4 text-sm">
                {receiptData.items.map((item: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="font-bold text-base">{item.GMName}</div>
                    <div className="text-xs space-y-0.5 text-gray-700">
                      <div className="flex justify-between">
                        <span>Kod:</span>
                        <span className="font-semibold">{item.GMCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Model:</span>
                        <span className="font-semibold">{item.model || "N/A"}</span>
                      </div>
                      {item.location && (
                        <div className="flex justify-between">
                          <span>Joylashuv:</span>
                          <span className="font-semibold">{item.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>
                        {item.quantity} dona x ${item.price.toFixed(2)}
                      </span>
                      <span className="font-bold">${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                    {index < receiptData.items.length - 1 && (
                      <div className="border-t border-dotted border-gray-400 mt-3"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-800 my-4"></div>

              {/* Total */}
              <div className="flex justify-between text-xl font-bold mb-4">
                <span>JAMI:</span>
                <span>${receiptData.totalAmount.toLocaleString()}</span>
              </div>

              <div className="border-t-2 border-dashed border-gray-800 my-3"></div>
            </div>
          )}
          <DialogFooter className="p-4 pt-0">
            <Button variant="outline" onClick={() => setShowReceipt(false)} className="flex-1">
              Yopish
            </Button>
            <Button onClick={printReceipt} className="bg-[#0099b5] hover:bg-[#0099b5]/90 flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Chop etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {receiptData && (
        <div className="receipt-print-only">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold mb-2">SAVDO CHEKI</h2>
            <div className="text-xs space-y-1">
              <p className="font-semibold">Chek №: {receiptData.receiptNumber}</p>
              <p>
                {receiptData.date instanceof Date
                  ? receiptData.date.toLocaleString("uz-UZ", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : receiptData.date}
              </p>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-800 my-3"></div>

          <div className="space-y-4 text-sm">
            {receiptData.items.map((item: any, index: number) => (
              <div key={index} className="space-y-1">
                <div className="font-bold text-base">{item.GMName}</div>
                <div className="text-xs space-y-0.5 text-gray-700">
                  <div className="flex justify-between">
                    <span>Kod:</span>
                    <span className="font-semibold">{item.GMCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="font-semibold">{item.model || "N/A"}</span>
                  </div>
                  {item.location && (
                    <div className="flex justify-between">
                      <span>Joylashuv:</span>
                      <span className="font-semibold">{item.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span>
                    {item.quantity} dona x ${item.price.toFixed(2)}
                  </span>
                  <span className="font-bold">${(item.quantity * item.price).toFixed(2)}</span>
                </div>
                {index < receiptData.items.length - 1 && (
                  <div className="border-t border-dotted border-gray-400 mt-3"></div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t-2 border-dashed border-gray-800 my-4"></div>

          <div className="flex justify-between text-xl font-bold mb-4">
            <span>JAMI:</span>
            <span>${receiptData.totalAmount.toLocaleString()}</span>
          </div>

          <div className="border-t-2 border-dashed border-gray-800 my-3"></div>
        </div>
      )}
    </div>
  )
}
