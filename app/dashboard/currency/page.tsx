"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight } from "lucide-react"

type ConversionMode = "usd-to-others" | "others-to-usd"

export default function CurrencyPage() {
  const { t } = useLanguage()

  const [mode, setMode] = useState<ConversionMode>("usd-to-others")

  // Exchange rates
  const [usdToUzs, setUsdToUzs] = useState<number>(12500)
  const [usdToKrw, setUsdToKrw] = useState<number>(1350)

  const [usdInput, setUsdInput] = useState<number>(0)
  const [uzsInput, setUzsInput] = useState<number>(0)
  const [krwInput, setKrwInput] = useState<number>(0)

  // Load saved exchange rates from localStorage
  useEffect(() => {
    try {
      const savedUsdToUzs = localStorage.getItem("exchangeRate_USD_UZS")
      const savedUsdToKrw = localStorage.getItem("exchangeRate_USD_KRW")

      if (savedUsdToUzs) setUsdToUzs(Number.parseFloat(savedUsdToUzs))
      if (savedUsdToKrw) setUsdToKrw(Number.parseFloat(savedUsdToKrw))
    } catch (error) {
      console.error("Failed to load exchange rates:", error)
    }
  }, [])

  // Save exchange rates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("exchangeRate_USD_UZS", usdToUzs.toString())
      localStorage.setItem("exchangeRate_USD_KRW", usdToKrw.toString())
    } catch (error) {
      console.error("Failed to save exchange rates:", error)
    }
  }, [usdToUzs, usdToKrw])

  useEffect(() => {
    if (mode === "usd-to-others") {
      setUzsInput(usdInput * usdToUzs)
      setKrwInput(usdInput * usdToKrw)
    }
  }, [usdInput, usdToUzs, usdToKrw, mode])

  useEffect(() => {
    if (mode === "others-to-usd") {
      setUsdInput(uzsInput / usdToUzs)
    }
  }, [uzsInput, usdToUzs, mode])

  useEffect(() => {
    if (mode === "others-to-usd") {
      setUsdInput(krwInput / usdToKrw)
    }
  }, [krwInput, usdToKrw, mode])

  const toggleMode = () => {
    setMode((prev) => (prev === "usd-to-others" ? "others-to-usd" : "usd-to-others"))
    // Reset inputs when switching modes
    setUsdInput(0)
    setUzsInput(0)
    setKrwInput(0)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">{t("currency.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("currency.description")}</p>
        </div>

        <Card className="border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">{t("currency.exchangeRates")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usd-uzs" className="text-sm font-normal text-muted-foreground">
                  1 USD = ? UZS
                </Label>
                <Input
                  id="usd-uzs"
                  type="number"
                  value={usdToUzs}
                  onChange={(e) => setUsdToUzs(Number.parseFloat(e.target.value) || 0)}
                  className="h-11 text-lg"
                  placeholder="12500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usd-krw" className="text-sm font-normal text-muted-foreground">
                  1 USD = ? KRW
                </Label>
                <Input
                  id="usd-krw"
                  type="number"
                  value={usdToKrw}
                  onChange={(e) => setUsdToKrw(Number.parseFloat(e.target.value) || 0)}
                  className="h-11 text-lg"
                  placeholder="1350"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">{t("currency.converter")}</CardTitle>
              <Button variant="outline" size="sm" onClick={toggleMode} className="gap-2 bg-transparent">
                <ArrowLeftRight className="h-4 w-4" />
                <span className="text-xs">Almashtirish</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === "usd-to-others" ? (
              <>
                {/* USD Input */}
                <div className="space-y-2">
                  <Label htmlFor="usd-input" className="text-sm font-normal text-muted-foreground">
                    USD (Dollar)
                  </Label>
                  <Input
                    id="usd-input"
                    type="number"
                    value={usdInput || ""}
                    onChange={(e) => setUsdInput(Number.parseFloat(e.target.value) || 0)}
                    className="h-14 text-2xl font-medium"
                    placeholder="0"
                  />
                </div>

                <div className="h-px bg-border" />

                {/* Results */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-muted-foreground">UZS (So'm)</Label>
                    <div className="h-14 flex items-center px-3 bg-muted rounded-md">
                      <span className="text-2xl font-medium text-foreground">
                        {uzsInput.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-muted-foreground">KRW (Won)</Label>
                    <div className="h-14 flex items-center px-3 bg-muted rounded-md">
                      <span className="text-2xl font-medium text-foreground">
                        {krwInput.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Other currencies input */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uzs-input" className="text-sm font-normal text-muted-foreground">
                      UZS (So'm)
                    </Label>
                    <Input
                      id="uzs-input"
                      type="number"
                      value={uzsInput || ""}
                      onChange={(e) => {
                        setUzsInput(Number.parseFloat(e.target.value) || 0)
                        setKrwInput(0)
                      }}
                      className="h-14 text-2xl font-medium"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="krw-input" className="text-sm font-normal text-muted-foreground">
                      KRW (Won)
                    </Label>
                    <Input
                      id="krw-input"
                      type="number"
                      value={krwInput || ""}
                      onChange={(e) => {
                        setKrwInput(Number.parseFloat(e.target.value) || 0)
                        setUzsInput(0)
                      }}
                      className="h-14 text-2xl font-medium"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* USD Result */}
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-muted-foreground">USD (Dollar)</Label>
                  <div className="h-14 flex items-center px-3 bg-muted rounded-md">
                    <span className="text-2xl font-medium text-foreground">
                      {usdInput.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">{t("currency.quickReference")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border bg-card space-y-1">
                <div className="text-lg font-medium">$1</div>
                <div className="text-xs text-muted-foreground">{usdToUzs.toLocaleString()} UZS</div>
              </div>
              <div className="p-3 rounded-lg border bg-card space-y-1">
                <div className="text-lg font-medium">$10</div>
                <div className="text-xs text-muted-foreground">{(usdToUzs * 10).toLocaleString()} UZS</div>
              </div>
              <div className="p-3 rounded-lg border bg-card space-y-1">
                <div className="text-lg font-medium">$1</div>
                <div className="text-xs text-muted-foreground">{usdToKrw.toLocaleString()} KRW</div>
              </div>
              <div className="p-3 rounded-lg border bg-card space-y-1">
                <div className="text-lg font-medium">$10</div>
                <div className="text-xs text-muted-foreground">{(usdToKrw * 10).toLocaleString()} KRW</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
