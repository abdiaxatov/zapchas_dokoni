"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Globe, Shield, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<string>("")

  const { login } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const { showToast } = useToast()
  const router = useRouter()

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email.trim()) {
      newErrors.email = t("login.error.email")
    }

    if (!password.trim()) {
      newErrors.password = t("login.error.password")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getErrorMessage = (error: any): string => {
    const errorCode = error?.code || ""

    switch (errorCode) {
      case "auth/user-not-found":
        return t("login.error.userNotFound")
      case "auth/wrong-password":
        return t("login.error.wrongPassword")
      case "auth/invalid-credential":
        return t("login.error.invalid")
      case "auth/too-many-requests":
        return t("login.error.tooManyRequests")
      case "auth/network-request-failed":
        return t("login.error.networkError")
      case "auth/invalid-email":
        return t("login.error.email")
      default:
        return t("login.error.invalid")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await login(email, password)
      showToast({
        title: t("common.success"),
        description: t("login.success"),
        variant: "success",
      })
      router.push("/dashboard")
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setLoginError(errorMessage)

      showToast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-[#0099b5]/10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0099b5]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0099b5]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#0099b5]/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Language Selector */}
          <div className="flex justify-end mb-6">
            <Select value={language} onValueChange={(value: "uzb" | "kares") => setLanguage(value)}>
              <SelectTrigger className="w-36 bg-white/80 backdrop-blur-sm border-[#0099b5]/20 hover:border-[#0099b5]/40 transition-colors">
                <Globe className="h-4 w-4 mr-2 text-[#0099b5]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uzb">O'zbek</SelectItem>
                <SelectItem value="kares">한국어</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl relative overflow-hidden">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0099b5] to-[#0099b5]/60"></div>

            <CardHeader className="space-y-4 text-center pt-8 pb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#0099b5] to-[#0099b5]/80 rounded-2xl flex items-center justify-center mb-2">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {t("login.title")}
              </CardTitle>
              <CardDescription className="text-gray-600 text-base flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0099b5]" />
                {t("dashboard.welcome")}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {loginError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{loginError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    {t("login.email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setLoginError("")
                    }}
                    className={cn(
                      "h-12 transition-all duration-200 border-2 bg-white/50 backdrop-blur-sm",
                      "focus:border-[#0099b5] focus:ring-4 focus:ring-[#0099b5]/20 focus:bg-white",
                      "hover:border-[#0099b5]/60 hover:bg-white/80",
                      (errors.email || loginError) &&
                        "border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50",
                    )}
                    placeholder={t("login.email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    {t("login.password")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setLoginError("")
                      }}
                      className={cn(
                        "h-12 pr-12 transition-all duration-200 border-2 bg-white/50 backdrop-blur-sm",
                        "focus:border-[#0099b5] focus:ring-4 focus:ring-[#0099b5]/20 focus:bg-white",
                        "hover:border-[#0099b5]/60 hover:bg-white/80",
                        (errors.password || loginError) &&
                          "border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50",
                      )}
                      placeholder={t("login.password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0099b5] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[#0099b5] to-[#0099b5]/90 hover:from-[#0099b5]/90 hover:to-[#0099b5]/80 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t("common.loading")}
                    </div>
                  ) : (
                    t("login.button")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
