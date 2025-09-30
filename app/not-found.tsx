"use client"

import Link from "next/link"
import { Home, ArrowLeft, Search } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function NotFound() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-8">
          <div className="text-[120px] font-bold text-[#0099b5] opacity-20 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center animate-bounce">
              <Search className="w-10 h-10 text-[#0099b5]" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{t.pageNotFound || "Sahifa topilmadi"}</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t.pageNotFoundDesc || "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin."}
          </p>

          <div className="space-y-3">
            <Link
              href="/"
              className="w-full bg-[#0099b5] hover:bg-[#0088a3] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Home className="w-4 h-4" />
              {t.goHome || "Bosh sahifaga qaytish"}
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.goBack || "Orqaga qaytish"}
            </button>
          </div>
        </div>

        <div className="absolute top-10 left-10 w-20 h-20 bg-[#0099b5]/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-[#0099b5]/5 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-5 w-12 h-12 bg-[#0099b5]/5 rounded-full animate-pulse delay-500"></div>
      </div>
    </div>
  )
}
