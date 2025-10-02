"use client"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Globe,
  X,
  ChevronLeft,
  Table,
  Database,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { logout, user } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const { showToast } = useToast()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await logout()
      showToast({
        title: t("common.success"),
        description: "Successfully logged out",
        variant: "success",
      })
      router.push("/login")
    } catch (error) {
      showToast({
        title: t("common.error"),
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  const menuItems = [
    { icon: LayoutDashboard, label: t("sidebar.dashboard"), href: "/dashboard" },
    { icon: Table, label: t("sidebar.table"), href: "/dashboard/data" },
    { icon: Database, label: "GM ", href: "/dashboard/gm" },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />}

      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out shadow-xl flex flex-col",
          isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "translate-x-0 w-80 sm:w-72 lg:w-64",
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#0099b5] to-[#0099b5]/90 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "transition-all duration-200 overflow-hidden",
                isCollapsed ? "lg:w-0 lg:opacity-0" : "w-full opacity-100",
              )}
            >
              <h2 className="text-xl font-bold text-white whitespace-nowrap">{t("dashboard.title")}</h2>
              <p className="text-sm text-white/80 mt-1 truncate">{user?.email}</p>
            </div>

            {/* Mobile close button */}
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2 h-8 w-8 lg:hidden flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Desktop collapse button */}
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="hidden lg:flex text-white hover:bg-white/20 p-2 h-8 w-8 flex-shrink-0"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", isCollapsed && "rotate-180")} />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left transition-all duration-200 h-12 relative group",
                  isCollapsed && "lg:justify-center lg:px-2",
                  isActive
                    ? "bg-[#0099b5] text-white hover:bg-[#0099b5]/90 shadow-md"
                    : "hover:bg-[#0099b5]/10 hover:text-[#0099b5]",
                )}
                onClick={() => router.push(item.href)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={cn(
                    "ml-3 transition-all duration-200 overflow-hidden whitespace-nowrap",
                    isCollapsed && "lg:w-0 lg:opacity-0 lg:ml-0",
                  )}
                >
                  {item.label}
                </span>
                {isActive && isCollapsed && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-[#0099b5] rounded-full hidden lg:block" />
                )}

              </Button>
            )
          })}
        </nav>

        {/* Bottom section - Language and Logout */}
        <div className="border-t border-gray-200 bg-gray-50/50 flex-shrink-0">
          <div className="p-4 space-y-3">
            {/* Language Selector - Full version */}
            <div className={cn("transition-all duration-200 overflow-hidden", isCollapsed ? "lg:hidden" : "block")}>
              <label className="text-xs font-medium text-gray-700 flex items-center mb-2">
                <Globe className="h-3 w-3 mr-1 text-[#0099b5]" />
                {t("sidebar.language")}
              </label>
              <Select value={language} onValueChange={(value: "uzb" | "kares") => setLanguage(value)}>
                <SelectTrigger className="w-full border-[#0099b5]/20 hover:border-[#0099b5]/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uzb">🇺🇿 O'zbek</SelectItem>
                  <SelectItem value="kares">🇰🇷 한국어</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language Selector - Collapsed version with flag */}
            <div
              className={cn(
                "hidden lg:flex justify-center transition-all duration-200 group relative",
                isCollapsed ? "lg:block" : "lg:hidden",
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-10 w-10 hover:bg-[#0099b5]/10 text-lg"
                onClick={() => setLanguage(language === "uzb" ? "kares" : "uzb")}
                title={language === "uzb" ? "한국어" : "O'zbek"}
              >
                {language === "uzb" ? "🇺🇿" : "🇰🇷"}
              </Button>
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {language === "uzb" ? "한국어" : "O'zbek"}
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className={cn(
                "w-full justify-start text-red-600 border-red-200 hover:bg-red-50 bg-transparent transition-all duration-200 h-12 group relative",
                isCollapsed && "lg:justify-center lg:px-2",
              )}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span
                className={cn(
                  "ml-3 transition-all duration-200 overflow-hidden whitespace-nowrap",
                  isCollapsed && "lg:w-0 lg:opacity-0 lg:ml-0",
                )}
              >
                {t("sidebar.logout")}
              </span>
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 hidden lg:block">
                  {t("sidebar.logout")}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
