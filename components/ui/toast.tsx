"use client"

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success" | "info"
  onClose?: () => void
}

export function Toast({ title, description, variant = "default", onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isLeaving, setIsLeaving] = React.useState(false)

  React.useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 10)

    const hideTimer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => {
        onClose?.()
      }, 300)
    }, 4000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [onClose])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose?.()
    }, 300)
  }

  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "destructive":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-[#0099b5]" />
    }
  }

  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 ease-out",
        {
          "translate-x-0 opacity-100": isVisible && !isLeaving,
          "translate-x-full opacity-0": !isVisible || isLeaving,
        },
        {
          "bg-white/90 border-gray-200": variant === "default",
          "bg-red-50/90 border-red-200": variant === "destructive",
          "bg-green-50/90 border-green-200": variant === "success",
          "bg-blue-50/90 border-blue-200": variant === "info",
        },
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold text-gray-900 text-sm mb-1">{title}</div>}
          {description && <div className="text-sm text-gray-600 leading-relaxed">{description}</div>}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <div className="h-1 bg-gray-100 rounded-b-xl overflow-hidden">
        <div
          className={cn("h-full transition-all duration-[4000ms] ease-linear", {
            "bg-[#0099b5]": variant === "default",
            "bg-red-500": variant === "destructive",
            "bg-green-500": variant === "success",
            "bg-blue-500": variant === "info",
          })}
          style={{
            width: isVisible && !isLeaving ? "0%" : "100%",
          }}
        />
      </div>
    </div>
  )
}

// Toast context and hook
interface ToastContextType {
  showToast: (toast: Omit<ToastProps, "onClose">) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([])

  const showToast = React.useCallback((toast: Omit<ToastProps, "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{
              transform: `translateY(${index * 8}px) scale(${1 - index * 0.05})`,
              zIndex: 9999 - index,
            }}
          >
            <Toast {...toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
