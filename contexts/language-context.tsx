"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type Language = "uzb" | "kares"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation data
const translations = {
  uzb: {
    // Login page
    "login.title": "Admin Panelga Kirish",
    "login.email": "Email manzil",
    "login.password": "Parol",
    "login.button": "Kirish",
    "login.error.email": "Email manzil kiritilishi shart",
    "login.error.password": "Parol kiritilishi shart",
    "login.error.invalid": "Noto'g'ri email yoki parol",
    "login.success": "Muvaffaqiyatli kirildi",
    "data.export" : "Yuklash",
    "data.import" : "Import qilish",
    "stats.lowStockGMs" : "Kam omborli GMlar",
    "totalGMs" : "Umumiy GMlar",
    "data.add" : "Qo'shish",
    "data.manage" : "Boshqarish",
    "addGM": "qo'shish",
    "stats.performanceMetricsDesc" : "Asosiy biznes ko'rsatkichlari",
    "stats.GMsByCategory": "Kategoriya bo'yicha GMlar",
"stats.conversionRate": "Konversiya Ko'rsatkichi",
"stats.avgOrderValue": "O'rtacha Buyurtma Qiymati",
"stats.customerRetention": "Mijozni Saqlash",
"stats.inventoryTurnover": "Ombor Aylanishi",
"stats.last7Days": "So'nggi 7 Kun",
"stats.last30Days": "So'nggi 30 Kun",
"stats.last90Days": "So'nggi 90 Kun",
"stats.lastYear": "O'tgan Yil",
    // Dashboard
    "dashboard.title": "Admin Dashboard",
    "dashboard.welcome": "Xush kelibsiz",
    "dashboard.overview": "Umumiy ko'rinish",
    "dashboard.users": "Foydalanuvchilar",
    "dashboard.settings": "Sozlamalar",
    "dashboard.analytics": "Analitika",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.users": "Foydalanuvchilar",
    "sidebar.table": "Jadval",
    "sidebar.analytics": "Analitika",
    "sidebar.settings": "Sozlamalar",
    "sidebar.logout": "Chiqish",
    "sidebar.language": "Til",

    // Common
  "common.loading": "Yuklanmoqda...",
  "common.error": "Xatolik yuz berdi",
  "common.success": "Muvaffaqiyat",
  "common.cancel": "Bekor qilish",
  "common.refresh": "Yangilash",

    // 404 Page
    pageNotFound: "Sahifa topilmadi",
    pageNotFoundDesc: "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.",
    goHome: "Bosh sahifaga qaytish",
    goBack: "Orqaga qaytish",

    // Product Management
    productTitle: "Mahsulot boshqaruvi",
    productDescription: "Mahsulotlarni boshqaring va sotuvni kuzating",
    searchProducts: "Mahsulotlarni qidirish...",
    filters: "Filtrlar",
    import: "Import",
    export: "Export",
    create: "Yaratish",
    createProduct: "Mahsulot yaratish",
    createNewProduct: "Yangi mahsulot yaratish",
    createProductDescription: "Yangi mahsulot ma'lumotlarini qo'shing",
    editProduct: "Mahsulotni tahrirlash",
    editProductDescription: "Mahsulot ma'lumotlarini o'zgartiring",
    kodi: "Kod",
    model: "Model",
    nomi: "Nomi",
    kompaniya: "Kompaniya",
    narxi: "Narxi",
    sold: "Sotilgan",
    actions: "Amallar",
    filterCompany: "Kompaniya bo'yicha",
    filterAll: "Hammasi",
    clearFilters: "Filtrlarni tozalash",
    productTableTitle: "Mahsulotlar jadvali",
    productTableDescription: "Barcha mahsulotlarni ko'ring va boshqaring",
    products: "mahsulot",
    noProducts: "Mahsulotlar yo'q",
    noProductsDescription: "Mahsulotlar yo'q yoki filtr natijalari yo'q",
    productCreated: "Mahsulot yaratildi",
    productUpdated: "Mahsulot yangilandi",
    productDeleted: "Mahsulot o'chirildi",
    productSold: "{quantity} ta {name} sotildi",
    update: "Yangilash",
    sellProduct: "Mahsulot sotish",
    sellProductDescription: "Quyidagi mahsulotni sotish:",
    productName: "Mahsulot nomi",
    price: "Narx",
    company: "Kompaniya",
    quantity: "Miqdor",
    totalAmount: "Umumiy summa",
    confirmSale: "Sotuvni tasdiqlash",
    deleteProduct: "Mahsulotni o'chirish",
    deleteConfirmTitle: "Mahsulotni o'chirishni tasdiqlang",
    deleteConfirmMessage: "Rostdan ham bu mahsulotni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.",
    deleteConfirm: "Ha, o'chirish",

    // Pagination
    "pagination.itemsPerPage": "Sahifada elementlar:",
    "pagination.showing": "Ko'rsatilmoqda",
    "pagination.of": "dan",
    "pagination.page": "Sahifa",
    "pagination.previous": "Oldingi",
    "pagination.next": "Keyingi",
    "pagination.first": "Birinchi",
    "pagination.last": "Oxirgi",

    // Progress and loading
    "progress.uploading": "Yuklanmoqda...",
    "progress.processing": "Qayta ishlanmoqda...",
    "progress.completed": "Yakunlandi",
    "progress.uploadProgress": "Yuklash jarayoni:",

    // Delete all
    deleteAll: "Hammasini o'chirish",
    deleteAllConfirm: "Barcha mahsulotlarni o'chirish",
    deleteAllMessage: "Rostdan ham barcha mahsulotlarni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.",
    deleteAllSuccess: "Barcha mahsulotlar o'chirildi",

    // Company filter
    clickToFilter: "Filtrlash uchun bosing",
   
    // Warehouse Management
    "warehouse.title": "Omborxona boshqaruvi",
    "warehouse.stock": "Omborda",
    "warehouse.minStock": "Minimal zaxira",
    "warehouse.maxStock": "Maksimal zaxira",
    "warehouse.location": "Joylashuv",
    "warehouse.category": "Kategoriya",
    "warehouse.supplier": "Yetkazib beruvchi",
    "warehouse.cost": "Tan narxi",
    "warehouse.profit": "Foyda",
    "warehouse.barcode": "Shtrix kod",
    "warehouse.weight": "Og'irligi (kg)",
    "warehouse.dimensions": "O'lchamlari",
    "warehouse.description": "Tavsif",
    "warehouse.status": "Holati",
    "warehouse.lastSold": "Oxirgi sotuv",
    "warehouse.lastRestocked": "Oxirgi to'ldirish",
    "warehouse.addStock": "Zaxira qo'shish",
    "warehouse.removeStock": "Zaxira chiqarish",
    "warehouse.lowStock": "Kam zaxira",
    "warehouse.outOfStock": "Zaxira tugagan",
    "warehouse.inStock": "Zaxirada bor",
    "warehouse.totalValue": "Umumiy qiymat",
    "warehouse.profitMargin": "Foyda foizi",
    "warehouse.reorderLevel": "Qayta buyurtma darajasi",
    "warehouse.stockAlert": "Zaxira ogohlantirishi",
    "warehouse.inventoryReport": "Inventar hisoboti",
    "warehouse.stockMovement": "Zaxira harakati",
    "warehouse.bulkUpdate": "Ommaviy yangilash",
    "warehouse.exportInventory": "Inventarni eksport qilish",
    "warehouse.importInventory": "Inventarni import qilish",
    "warehouse.stockHistory": "Zaxira tarixi",
    "warehouse.productDetails": "Mahsulot tafsilotlari",
    "warehouse.quickActions": "Tezkor amallar",
    "warehouse.viewDetails": "Tafsilotlarni ko'rish",
    "warehouse.editDetails": "Tafsilotlarni tahrirlash",
    "warehouse.stockIn": "Zaxira kirimi",
    "warehouse.stockOut": "Zaxira chiqimi",
    "warehouse.adjustStock": "Zaxirani sozlash",
    "warehouse.transferStock": "Zaxirani ko'chirish",
    "warehouse.reserveStock": "Zaxirani zahiralash",
    "warehouse.unreserveStock": "Zahirani bekor qilish",
    "warehouse.countStock": "Zaxirani sanash",
    "warehouse.auditStock": "Zaxira auditi",
    "warehouse.generateReport": "Hisobot yaratish",
    "warehouse.printLabel": "Yorliq chop etish",
    "warehouse.scanBarcode": "Shtrix kodni skanerlash",
    "warehouse.setReorderPoint": "Qayta buyurtma nuqtasini belgilash",
    "warehouse.trackExpiry": "Muddatni kuzatish",
    "warehouse.manageSuppliers": "Yetkazib beruvchilarni boshqarish",
    "warehouse.priceHistory": "Narx tarixi",
    "warehouse.demandForecast": "Talab prognozi",
    "warehouse.seasonalAnalysis": "Mavsumiy tahlil",
    "warehouse.abcAnalysis": "ABC tahlili",
    "warehouse.velocityAnalysis": "Tezlik tahlili",
    "warehouse.turnoverRate": "Aylanish tezligi",
    "warehouse.deadStock": "O'lik zaxira",
    "warehouse.fastMoving": "Tez harakatlanuvchi",
    "warehouse.slowMoving": "Sekin harakatlanuvchi",
    "warehouse.criticalStock": "Kritik zaxira",
    "warehouse.overStock": "Ortiqcha zaxira",
    "warehouse.underStock": "Kam zaxira",
    "warehouse.optimalStock": "Optimal zaxira",

    // Column filters
    "filter.kod": "Kod bo'yicha filtrlash",
    "filter.model": "Model bo'yicha filtrlash",
    "filter.nomi": "Nom bo'yicha filtrlash",
    "filter.kompaniya": "Kompaniya bo'yicha filtrlash",
    "filter.narxi": "Narx bo'yicha filtrlash",
    "filter.sold": "Sotilgan bo'yicha filtrlash",
    "filter.stock": "Zaxira bo'yicha filtrlash",
    "filter.actions": "Amallar",

    // Status
    "status.active": "Faol",
    "status.inactive": "Nofaol",
    "status.discontinued": "To'xtatilgan",

    // Actions
    "action.viewDetails": "Tafsilotlar",
    "action.addStock": "Zaxira +",
    "action.removeStock": "Zaxira -",
    "action.sell": "Sotish",
    "action.edit": "Tahrirlash",
    "action.delete": "O'chirish",
    "action.duplicate": "Nusxalash",
    "action.archive": "Arxivlash",
    "action.restore": "Tiklash",
    "action.transfer": "Ko'chirish",
    "action.reserve": "Zahiralash",
    "action.unreserve": "Zahirani bekor qilish",
    "action.audit": "Audit",
    "action.report": "Hisobot",
    "action.label": "Yorliq",
    "action.barcode": "Shtrix kod",
    "action.history": "Tarix",
    "action.forecast": "Prognoz",
    "action.analyze": "Tahlil",

    // Modal titles
    "modal.productDetails": "Mahsulot tafsilotlari",
    "modal.addStock": "Zaxira qo'shish",
    "modal.removeStock": "Zaxira chiqarish",
    "modal.stockAdjustment": "Zaxirani sozlash",
    "modal.bulkActions": "Ommaviy amallar",
    "modal.inventoryReport": "Inventar hisoboti",
    "modal.lowStockAlert": "Kam zaxira ogohlantirishi",

    // Tabs
    "tabs.table": "Jadval",
    "tabs.statistics": "Statistika",

    // Statistics
    "stats.totalProducts": "Jami mahsulotlar",
    "stats.totalSales": "Jami sotuvlar",
    "stats.totalRevenue": "Jami daromad",
    "stats.averagePrice": "O'rtacha narx",
    "stats.lowStockProducts": "Kam omborli mahsulotlar",
    "stats.outOfStockProducts": "Tugagan mahsulotlar",
    "stats.companyChart": "Kompaniya diagrammasi",
    "stats.bestCompanies": "Eng yaxshi kompaniyalar",
    "stats.warehouseChart": "Ombor diagrammasi",
    "stats.warehouseAnalytics": "Ombor Analitika",
    "stats.availableStock": "Ombordan mavjud",
    "stats.lowStock": "Kam ombor",
    "stats.outOfStock": "Ombordan tugagan",
    "stats.priceChart": "Narx diagrammasi",
    "stats.priceRangeAnalytics": "Narx oralig'i Analitika",
    "stats.priceRange0": "0-100$",
    "stats.priceRange1": "100-500$",
    "stats.priceRange2": "500-1000$",
    "stats.priceRange3": "1000-5000$",
    "stats.priceRange4": "5000$+",
    "stats.bestSellingProducts": "Eng ko'p sotiladigan mahsulotlar",
    "stats.salesChart": "Sotuvlar diagrammasi",
    "stats.sold": "Sotilgan",
    "stats.overview": "Umumiy ko'rinish",
    "stats.analytics": "Analitika",
    "stats.reports": "Hisobotlar",
    "stats.totalStock": "Jami zaxira",
    "stats.inventoryValue": "Inventar qiymati",
    "stats.salesTrend": "Sotuvlar tendensiyasi",
    "stats.monthlySales": "Oylik sotuvlar",
    "stats.categoryDistribution": "Kategoriya taqsimoti",
    "stats.productsByCategory": "Kategoriya bo'yicha mahsulotlar",
    "stats.inventoryStatus": "Inventar holati",
    "stats.stockLevels": "Zaxira darajalari",
    "stats.inStock": "Zaxirada",
    totalProducts: "Jami mahsulotlar",
    totalSales: "Jami sotuvlar",
    totalRevenue: "Jami daromad",
    lowStock: "Kam zaxira",
    searchPlaceholder: "Qidirish...",
    addProduct: "Mahsulot qo'shish",
    exportExcel: "Excel eksport",
    importExcel: "Excel import",
    "filter.company": "Kompaniya",
    "filter.allCompanies": "Barcha kompaniyalar",
    "filter.stock": "Zaxira",
    "filter.allStock": "Barcha zaxira",
    "filter.lowStock": "Kam zaxira",
    "filter.outOfStock": "Zaxira tugagan",
    "filter.inStock": "Zaxirada bor",
    // Removed duplicate "filter.stock"
    cancel: "Bekor qilish",

    // Analytics specific translations
    "analytics.title": "Analitika Dashboard",
    "analytics.overview": "Umumiy ko'rinish",
    "analytics.performance": "Ishlash ko'rsatkichlari",
    "analytics.trends": "Tendensiyalar",
    "analytics.insights": "Tushunchalar",
    "analytics.reports": "Hisobotlar",
    "analytics.export": "Eksport",
    "analytics.refresh": "Yangilash",
    "analytics.timeRange": "Vaqt oralig'i",
    "analytics.conversionRate": "Konversiya darajasi",
    "analytics.avgOrderValue": "O'rtacha buyurtma qiymati",
    "analytics.customerRetention": "Mijozlarni ushlab qolish",
    "analytics.inventoryTurnover": "Inventar aylanishi",
    "analytics.healthScore": "Salomatlik ko'rsatkichi",
    "analytics.stockAvailability": "Zaxira mavjudligi",
    "analytics.turnoverRate": "Aylanish tezligi",
    "analytics.profitMargin": "Foyda marjasi",
    "analytics.topPerforming": "Eng yaxshi",
    "analytics.multiDimensional": "Ko'p o'lchovli taqqoslash",
    "analytics.distributionByPrice": "Narx bo'yicha taqsimot",
    "analytics.revenueByCompany": "Kompaniya bo'yicha daromad",
    "analytics.salesVolume": "Sotuv hajmi",
    "analytics.inventoryManagement": "Inventar boshqaruvi",
    "analytics.overallHealth": "Umumiy salomatlik",
  },
  kares: {
    // Login page
    "login.title": "관리자 패널 로그인",
    "login.email": "이메일 주소",
    "login.password": "비밀번호",
    "login.button": "로그인",
    "login.error.email": "이메일 주소를 입력해주세요",
    "login.error.password": "비밀번호를 입력해주세요",
    "login.error.invalid": "잘못된 이메일 또는 비밀번호",
    "login.success": "성공적으로 로그인되었습니다",
    "stats.GMsByCategory": "캐퓨티보드로 고정하기",
    "data.export" : "쓰기",
    "totalGMs" : "캐퓨티보드로 고정하기",
    "stats.lowStockGMs" : "캐퓨티보드로 고정하기",
    "stats.performanceMetricsDesc" : "기본 비즈네스 고정치",
    "data.import" : "이모트하기",
    "data.add" : "추가",
    "data.manage" : "관리",
    "addGM" : "추가",
    "stats.conversionRate": "Konversiya",
"stats.avgOrderValue": "O'rtacha Buyurtma",
"stats.customerRetention": "Mijozni Saqlash",
"stats.inventoryTurnover": "Ombor Aylanishi",
"stats.last7Days": "Oxirgi 7 kun",
"stats.last30Days": "Oxirgi 30 kun",
"stats.last90Days": "Oxirgi 90 kun",
"stats.lastYear": "O'tgan yil",

    // Dashboard
    "dashboard.title": "관리자 대시보드",
    "dashboard.welcome": "환영합니다",
    "dashboard.overview": "개요",
    "dashboard.users": "사용자",
    "dashboard.settings": "설정",
    "dashboard.analytics": "분석",

    // Sidebar
    "sidebar.dashboard": "대시보드",
    "sidebar.users": "사용자",
    "sidebar.table": "테이블",
    "sidebar.analytics": "분석",
    "sidebar.settings": "설정",
    "sidebar.logout": "로그아웃",
    "sidebar.language": "언어",

    // Common
  "common.loading": "로딩 중...",
  "common.error": "오류가 발생했습니다",
  "common.success": "성공",
  "common.cancel": "취소",
  "common.refresh": "새로고침",

    // 404 Page
    pageNotFound: "페이지를 찾을 수 없습니다",
    pageNotFoundDesc: "찾으시는 페이지가 존재하지 않거나 이동되었을 수 있습니다.",
    goHome: "홈으로 돌아가기",
    goBack: "뒤로 가기",

    // Product Management
    productTitle: "제품 관리",
    productDescription: "제품을 관리하고 판매를 추적하세요",
    searchProducts: "제품 검색...",
    filters: "필터",
    import: "가져오기",
    export: "내보내기",
    create: "생성",
    createProduct: "제품 생성",
    createNewProduct: "새 제품 생성",
    createProductDescription: "새로운 제품 정보를 추가하세요",
    editProduct: "제품 편집",
    editProductDescription: "제품 정보를 수정하세요",
    kodi: "코드",
    model: "모델",
    nomi: "제품명",
    kompaniya: "회사",
    narxi: "가격",
    sold: "판매량",
    actions: "작업",
    filterCompany: "회사별",
    filterAll: "전체",
    clearFilters: "필터 지우기",
    productTableTitle: "제품 테이블",
    productTableDescription: "모든 제품을 보고 관리하세요",
    products: "제품",
    noProducts: "제품이 없습니다",
    noProductsDescription: "제품이 없거나 필터 결과가 없습니다",
    productCreated: "제품이 생성되었습니다",
    productUpdated: "제품이 업데이트되었습니다",
    productDeleted: "제품이 삭제되었습니다",
    productSold: "{quantity}개의 {name}이(가) 판매되었습니다",
    update: "업데이트",
    sellProduct: "제품 판매",
    sellProductDescription: "다음 제품을 판매:",
    productName: "제품명",
    price: "가격",
    company: "회사",
    quantity: "수량",
    totalAmount: "총 금액",
    confirmSale: "판매 확인",
    deleteProduct: "제품 삭제",
    deleteConfirmTitle: "제품 삭제 확인",
    deleteConfirmMessage: "정말로 이 제품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    deleteConfirm: "예, 삭제",

    // Pagination
    "pagination.itemsPerPage": "페이지당 항목:",
    "pagination.showing": "표시 중",
    "pagination.of": "중",
    "pagination.page": "페이지",
    "pagination.previous": "이전",
    "pagination.next": "다음",
    "pagination.first": "처음",
    "pagination.last": "마지막",

    // Progress and loading
    "progress.uploading": "업로드 중...",
    "progress.processing": "처리 중...",
    "progress.completed": "완료됨",
    "progress.uploadProgress": "업로드 진행률:",

    // Delete all
    deleteAll: "모두 삭제",
    deleteAllConfirm: "모든 제품 삭제",
    deleteAllMessage: "정말로 모든 제품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    deleteAllSuccess: "모든 제품이 삭제되었습니다",

    // Company filter
    clickToFilter: "필터링하려면 클릭",

    // Warehouse Management
    "warehouse.title": "창고 관리",
    "warehouse.stock": "재고",
    "warehouse.minStock": "최소 재고",
    "warehouse.maxStock": "최대 재고",
    "warehouse.location": "위치",
    "warehouse.category": "카테고리",
    "warehouse.supplier": "공급업체",
    "warehouse.cost": "원가",
    "warehouse.profit": "이익",
    "warehouse.barcode": "바코드",
    "warehouse.weight": "무게 (kg)",
    "warehouse.dimensions": "치수",
    "warehouse.description": "설명",
    "warehouse.status": "상태",
    "warehouse.lastSold": "마지막 판매",
    "warehouse.lastRestocked": "마지막 입고",
    "warehouse.addStock": "재고 추가",
    "warehouse.removeStock": "재고 제거",
    "warehouse.lowStock": "재고 부족",
    "warehouse.outOfStock": "재고 없음",
    "warehouse.inStock": "재고 있음",
    "warehouse.totalValue": "총 가치",
    "warehouse.profitMargin": "이익률",
    "warehouse.reorderLevel": "재주문 수준",
    "warehouse.stockAlert": "재고 알림",
    "warehouse.inventoryReport": "재고 보고서",
    "warehouse.stockMovement": "재고 이동",
    "warehouse.bulkUpdate": "일괄 업데이트",
    "warehouse.exportInventory": "재고 내보내기",
    "warehouse.importInventory": "재고 가져오기",
    "warehouse.stockHistory": "재고 이력",
    "warehouse.productDetails": "제품 세부정보",
    "warehouse.quickActions": "빠른 작업",
    "warehouse.viewDetails": "세부정보 보기",
    "warehouse.editDetails": "세부정보 편집",
    "warehouse.stockIn": "입고",
    "warehouse.stockOut": "출고",
    "warehouse.adjustStock": "재고 조정",
    "warehouse.transferStock": "재고 이전",
    "warehouse.reserveStock": "재고 예약",
    "warehouse.unreserveStock": "예약 취소",
    "warehouse.countStock": "재고 계산",
    "warehouse.auditStock": "재고 감사",
    "warehouse.generateReport": "보고서 생성",
    "warehouse.printLabel": "라벨 인쇄",
    "warehouse.scanBarcode": "바코드 스캔",
    "warehouse.setReorderPoint": "재주문 지점 설정",
    "warehouse.trackExpiry": "만료일 추적",
    "warehouse.manageSuppliers": "공급업체 관리",
    "warehouse.priceHistory": "가격 이력",
    "warehouse.demandForecast": "수요 예측",
    "warehouse.seasonalAnalysis": "계절 분석",
    "warehouse.abcAnalysis": "ABC 분석",
    "warehouse.velocityAnalysis": "속도 분석",
    "warehouse.turnoverRate": "회전율",
    "warehouse.deadStock": "데드 스톡",
    "warehouse.fastMoving": "빠른 이동",
    "warehouse.slowMoving": "느린 이동",
    "warehouse.criticalStock": "중요 재고",
    "warehouse.overStock": "과잉 재고",
    "warehouse.underStock": "부족 재고",
    "warehouse.optimalStock": "최적 재고",

    // Column filters
    "filter.kod": "코드로 필터링",
    "filter.model": "모델로 필터링",
    "filter.nomi": "이름으로 필터링",
    "filter.kompaniya": "회사로 필터링",
    "filter.narxi": "가격으로 필터링",
    "filter.sold": "판매량으로 필터링",
    "filter.stock": "재고로 필터링",
    "filter.actions": "작업",

    // Status
    "status.active": "활성",
    "status.inactive": "비활성",
    "status.discontinued": "단종",

    // Actions
    "action.viewDetails": "세부정보",
    "action.addStock": "재고 +",
    "action.removeStock": "재고 -",
    "action.sell": "판매",
    "action.edit": "편집",
    "action.delete": "삭제",
    "action.duplicate": "복제",
    "action.archive": "보관",
    "action.restore": "복원",
    "action.transfer": "이전",
    "action.reserve": "예약",
    "action.unreserve": "예약 취소",
    "action.audit": "감사",
    "action.report": "보고서",
    "action.label": "라벨",
    "action.barcode": "바코드",
    "action.history": "이력",
    "action.forecast": "예측",
    "action.analyze": "분석",

    // Modal titles
    "modal.productDetails": "제품 세부정보",
    "modal.addStock": "재고 추가",
    "modal.removeStock": "재고 제거",
    "modal.stockAdjustment": "재고 조정",
    "modal.bulkActions": "일괄 작업",
    "modal.inventoryReport": "재고 보고서",
    "modal.lowStockAlert": "재고 부족 알림",

    // Tabs
    "tabs.table": "테이블",
    "tabs.statistics": "통계",

    // Statistics
    "stats.totalProducts": "총 제품",
    "stats.totalSales": "총 판매",
    "stats.totalRevenue": "총 수익",
    "stats.averagePrice": "평균 가격",
    "stats.lowStockProducts": "재고 부족 제품",
    "stats.outOfStockProducts": "품절 제품",
    "stats.companyChart": "회사 차트",
    "stats.bestCompanies": "최고의 회사",
    "stats.warehouseChart": "창고 차트",
    "stats.warehouseAnalytics": "창고 분석",
    "stats.availableStock": "사용 가능한 재고",
    "stats.lowStock": "재고 부족",
    "stats.outOfStock": "품절",
    "stats.priceChart": "가격 차트",
    "stats.priceRangeAnalytics": "가격 범위 분석",
    "stats.priceRange0": "0-100$",
    "stats.priceRange1": "100-500$",
    "stats.priceRange2": "500-1000$",
    "stats.priceRange3": "1000-5000$",
    "stats.priceRange4": "5000$+",
    "stats.bestSellingProducts": "베스트셀러 제품",
    "stats.salesChart": "판매 차트",
    "stats.sold": "판매됨",
    "stats.overview": "개요",
    "stats.analytics": "분석",
    "stats.reports": "보고서",
    "stats.totalStock": "총 재고",
    "stats.inventoryValue": "재고 가치",
    "stats.salesTrend": "판매 동향",
    "stats.monthlySales": "월별 판매",
    "stats.categoryDistribution": "카테고리 분포",
    "stats.productsByCategory": "카테고리별 제품",
    "stats.inventoryStatus": "재고 상태",
    "stats.stockLevels": "재고 수준",
    "stats.inStock": "재고 있음",
    totalProducts: "총 제품",
    totalSales: "총 판매",
    totalRevenue: "총 수익",
    lowStock: "재고 부족",
    searchPlaceholder: "검색...",
    addProduct: "제품 추가",
    exportExcel: "Excel 내보내기",
    importExcel: "Excel 가져오기",
    "filter.company": "회사",
    "filter.stock": "재고",
    "filter.allStock": "모든 재고",
    "filter.lowStock": "재고 부족",
    "filter.outOfStock": "품절",
    "filter.inStock": "재고 있음",
    // Removed duplicate "filter.stock"
    cancel: "취소",
    cancel: "취소",

    // Analytics specific translations
    "analytics.title": "분석 대시보드",
    "analytics.overview": "개요",
    "analytics.performance": "성과 지표",
    "analytics.trends": "트렌드",
    "analytics.insights": "인사이트",
    "analytics.reports": "보고서",
    "analytics.export": "내보내기",
    "analytics.refresh": "새로고침",
    "analytics.timeRange": "기간",
    "analytics.conversionRate": "전환율",
    "analytics.avgOrderValue": "평균 주문 가치",
    "analytics.customerRetention": "고객 유지율",
    "analytics.inventoryTurnover": "재고 회전율",
    "analytics.healthScore": "건강 점수",
    "analytics.stockAvailability": "재고 가용성",
    "analytics.turnoverRate": "회전율",
    "analytics.profitMargin": "이익률",
    "analytics.topPerforming": "최고 성과",
    "analytics.multiDimensional": "다차원 비교",
    "analytics.distributionByPrice": "가격별 분포",
    "analytics.revenueByCompany": "회사별 수익",
    "analytics.salesVolume": "판매량",
    "analytics.inventoryManagement": "재고 관리",
    "analytics.overallHealth": "전체 건강도",


    
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("uzb")

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("language") as Language
      if (savedLanguage && (savedLanguage === "uzb" || savedLanguage === "kares")) {
        setLanguage(savedLanguage)
      }
    } catch (error) {
      console.error("Failed to load language from localStorage:", error)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    try {
      localStorage.setItem("language", lang)
    } catch (error) {
      console.error("Failed to save language to localStorage:", error)
    }
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key as keyof (typeof translations)[typeof language]] || key

    // Handle parameter interpolation
    if (params && typeof translation === "string") {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, String(paramValue))
      })
    }

    return translation
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
