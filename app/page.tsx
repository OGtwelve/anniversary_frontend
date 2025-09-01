"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface QuizOption {
  id: number
  idxNo: number
  content: string
}

interface QuizQuestion {
  id: number
  idxNo: number
  content: string
  options: QuizOption[]
}

interface QuizData {
  quizCode: string
  title: string
  questions: QuizQuestion[]
}

interface CertificateData {
  fullNo: string
  scsCode: string
  daysToTarget: number
  name: string
  startDate: string
  workNo: string
}

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState("hero") // hero, quiz, form, loading, result
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    workTime: "",
    constellation: "",
  })

  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<{ questionId: number; optionId: number }[]>([])
  const [passToken, setPassToken] = useState<string>("")
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const fetchQuizData = async () => {
    try {
      setIsLoading(true)
      setError("")
      console.log("[v0] Fetching quiz data...")

      const response = await fetch("/api/anniv/quiz")
      const result = await response.json()

      if (result.message === "ok" && result.data) {
        setQuizData(result.data)
        console.log("[v0] Quiz data loaded:", result.data)
      } else {
        throw new Error(result.message || "Failed to load quiz")
      }
    } catch (err) {
      console.error("[v0] Quiz fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load quiz")
    } finally {
      setIsLoading(false)
    }
  }

  const validateQuizAnswers = async () => {
    if (!quizData || selectedAnswers.length === 0) return

    try {
      setIsLoading(true)
      setError("")
      console.log("[v0] Validating quiz answers:", selectedAnswers)

      const response = await fetch("/api/anniv/quiz/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: selectedAnswers,
          quizCode: quizData.quizCode,
        }),
      })

      const result = await response.json()

      if (result.message === "ok" && result.data) {
        setPassToken(result.data.passToken)
        console.log("[v0] Quiz validation successful, passToken:", result.data.passToken)
        setCurrentStep("form")
      } else {
        throw new Error(result.message || "Quiz validation failed")
      }
    } catch (err) {
      console.error("[v0] Quiz validation error:", err)
      setError(err instanceof Error ? err.message : "Quiz validation failed")
    } finally {
      setIsLoading(false)
    }
  }

  const generateCertificate = async () => {
    if (!passToken || !formData.name || !formData.employeeId || !formData.workTime) {
      setError("请填写完整信息")
      return
    }

    try {
      setIsLoading(true)
      setError("")
      console.log("[v0] Generating certificate with data:", {
        name: formData.name,
        startDate: formData.workTime,
        workNo: formData.employeeId,
        passToken,
      })

      const response = await fetch("/api/anniv/certificates/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          startDate: formData.workTime,
          workNo: formData.employeeId,
          passToken: passToken,
        }),
      })

      const result = await response.json()

      if (result.message === "恭喜成功" && result.data) {
        setCertificateData(result.data)
        console.log("[v0] Certificate generated successfully:", result.data)
        setCurrentStep("result")
      } else {
        throw new Error(result.message || "Certificate generation failed")
      }
    } catch (err) {
      console.error("[v0] Certificate generation error:", err)
      setError(err instanceof Error ? err.message : "Certificate generation failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSubmit = () => {
    if (!formData.name.trim()) {
      setError("请输入姓名")
      return
    }
    if (!formData.employeeId.trim()) {
      setError("请输入工号")
      return
    }
    if (!formData.workTime.trim()) {
      setError("请输入入职时间")
      return
    }
    if (!passToken) {
      setError("请先完成问答验证")
      return
    }

    setError("")
    setCurrentStep("loading")
  }

  useEffect(() => {
    if (currentStep === "loading" && !certificateData && passToken) {
      const timer = setTimeout(() => {
        generateCertificate()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [currentStep, certificateData, passToken])

  useEffect(() => {
    if (currentStep === "quiz" && !quizData) {
      fetchQuizData()
    }
  }, [currentStep, quizData])

  const handleOptionSelect = (questionId: number, optionId: number) => {
    setSelectedAnswers([{ questionId, optionId }])

    const optionMap: { [key: number]: string } = {
      1: "bigdipper",
      2: "galaxy",
      3: "orion",
      4: "other",
    }
    setFormData((prev) => ({ ...prev, constellation: optionMap[optionId] || "other" }))
  }

  const renderHeroSection = () => (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/background.jpg" alt="Space background" fill className="object-cover" priority />
      </div>

      <div className="absolute top-8 left-8 z-10">
        <Image src="/images/topleft-logo.png" alt="Left logo" width={120} height={60} className="opacity-90" />
      </div>

      <div className="absolute top-8 right-8 z-10">
        <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={120} height={60} className="opacity-90" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-end pr-16">
        <div className="text-right text-white max-w-lg">
          <h1 className="text-5xl font-bold mb-6 text-balance">探索宇宙的钥匙</h1>
          <p className="text-xl mb-8 opacity-90 leading-relaxed">回答几个问题，解锁属于你的星际祝福</p>
          <Button
            onClick={() => setCurrentStep("quiz")}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white px-8 py-3 text-lg rounded-full transition-all duration-300 transform hover:scale-105"
          >
            点击探秘
          </Button>
        </div>
      </div>
    </div>
  )

  const renderQuizSection = () => (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/background.jpg" alt="Space background" fill className="object-cover" />
      </div>

      <div className="absolute top-8 left-8 z-10">
        <Image src="/images/topleft-logo.png" alt="Left logo" width={120} height={60} className="opacity-90" />
      </div>

      <div className="absolute top-8 right-8 z-10">
        <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={120} height={60} className="opacity-90" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <Card className="bg-black/20 backdrop-blur-sm border-cyan-400/30 p-8 max-w-2xl mx-4">
          <div className="text-center text-white">
            {isLoading ? (
              <div>
                <h2 className="text-2xl font-bold mb-8 text-balance">加载问题中...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              </div>
            ) : error ? (
              <div>
                <h2 className="text-2xl font-bold mb-8 text-balance text-red-400">加载失败</h2>
                <p className="mb-4">{error}</p>
                <Button onClick={fetchQuizData} className="bg-red-500 hover:bg-red-600">
                  重试
                </Button>
              </div>
            ) : quizData && quizData.questions.length > 0 ? (
              <>
                <h2 className="text-2xl font-bold mb-8 text-balance">{quizData.questions[0].content}</h2>

                <div className="space-y-4 mb-8">
                  {quizData.questions[0].options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(quizData.questions[0].id, option.id)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-300 border ${
                        selectedAnswers.some((a) => a.optionId === option.id)
                          ? "bg-cyan-400/30 border-cyan-400"
                          : "bg-white/10 hover:bg-white/20 border-cyan-400/30 hover:border-cyan-400/60"
                      }`}
                    >
                      <span className="text-lg">
                        {String.fromCharCode(65 + option.idxNo - 1)}. {option.content}
                      </span>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={validateQuizAnswers}
                  disabled={selectedAnswers.length === 0 || isLoading}
                  className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white px-8 py-3 rounded-full disabled:opacity-50"
                >
                  {isLoading ? "验证中..." : "下一题"}
                </Button>
              </>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-8 text-balance">暂无问题</h2>
                <Button onClick={() => setCurrentStep("form")} className="bg-blue-500 hover:bg-blue-600">
                  跳过
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )

  const renderFormSection = () => (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/background.jpg" alt="Space background" fill className="object-cover" />
      </div>

      <div className="absolute top-8 left-8 z-10">
        <Image src="/images/topleft-logo.png" alt="Left logo" width={120} height={60} className="opacity-90" />
      </div>

      <div className="absolute top-8 right-8 z-10">
        <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={120} height={60} className="opacity-90" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <Card className="bg-teal-900/80 backdrop-blur-sm border-cyan-400 p-8 max-w-2xl mx-4 rounded-3xl">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4 text-balance">点亮你的专属星图</h2>
            <p className="text-lg mb-8 opacity-90">填写以下信息，完成你的宇宙档案</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">姓名</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-transparent border-b-2 border-white/50 border-t-0 border-l-0 border-r-0 rounded-none text-white placeholder-white/70 focus:border-cyan-400"
                    placeholder=""
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">工号</label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
                    className="bg-transparent border-b-2 border-white/50 border-t-0 border-l-0 border-r-0 rounded-none text-white placeholder-white/70 focus:border-cyan-400"
                    placeholder=""
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">入职时间</label>
                  <Input
                    value={formData.workTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, workTime: e.target.value }))}
                    className="bg-transparent border-b-2 border-white/50 border-t-0 border-l-0 border-r-0 rounded-none text-white placeholder-white/70 focus:border-cyan-400"
                    placeholder="YYYY-MM-DD"
                    required
                  />
                </div>
              </div>

              <Button
                onClick={handleFormSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white px-12 py-3 text-lg rounded-full mt-8 disabled:opacity-50"
              >
                {isLoading ? "生成中..." : "点击生成"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderLoadingSection = () => (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/loading-screen.jpg" alt="Loading background" fill className="object-cover" />
      </div>

      <div className="absolute top-8 left-8 z-10">
        <Image src="/images/topleft-logo.png" alt="Left logo" width={120} height={60} className="opacity-90" />
      </div>

      <div className="absolute top-8 right-8 z-10">
        <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={120} height={60} className="opacity-90" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-8 text-balance">您的专属宇宙证书正在生成........</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg max-w-md mx-auto">
              <p className="text-red-200 mb-4">{error}</p>
              <Button onClick={generateCertificate} className="bg-red-500 hover:bg-red-600">
                重试
              </Button>
            </div>
          )}

          <div className="flex justify-center mb-8">
            <div className="w-32 h-16 relative">
              <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-spin"></div>
              <div
                className="absolute inset-2 border-4 border-cyan-400 rounded-full animate-spin"
                style={{ animationDirection: "reverse" }}
              ></div>
            </div>
          </div>

          {!error && <p className="text-sm opacity-70">正在为您生成专属证书，请稍候...</p>}
        </div>
      </div>
    </div>
  )

  const renderResultSection = () => (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/background.jpg" alt="Space background" fill className="object-cover" />
      </div>

      <div className="absolute top-8 left-8 z-10">
        <Image src="/images/topleft-logo.png" alt="Left logo" width={120} height={60} className="opacity-90" />
      </div>

      <div className="absolute top-8 right-8 z-10">
        <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={120} height={60} className="opacity-90" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/30 p-8 rounded-3xl">
            <div className="text-center text-white mb-8">
              <h2 className="text-3xl font-bold mb-4">您的专属宇宙证书</h2>
            </div>

            <div className="bg-white/90 rounded-2xl p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <Image src="/images/topleft-logo.png" alt="Left logo" width={80} height={40} />
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-blue-900 mb-2">奋进八载</h3>
                    <h3 className="text-2xl font-bold text-blue-900">攀登巅峰</h3>
                    <p className="text-sm text-gray-600 mt-2">ANNIVERSARY OF ZHEJIANG LAB</p>
                  </div>
                  <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={80} height={40} />
                </div>

                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={60} height={30} />
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">
                        {certificateData?.name || formData.name || "胡渠楠"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {certificateData?.workNo || formData.employeeId || "002857"}
                      </p>
                      <p className="text-sm text-gray-600">{certificateData?.fullNo || "SCS01-0880-0001"}</p>
                      {certificateData?.daysToTarget && (
                        <p className="text-xs text-gray-500 mt-1">工作天数: {certificateData.daysToTarget} 天</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Button
                onClick={() => setCurrentStep("hero")}
                className="bg-gradient-to-r from-cyan-400 to-green-500 hover:from-cyan-500 hover:to-green-600 text-white px-8 py-3 rounded-full mr-4"
              >
                点击下载PDF
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep("hero")
                  setFormData({ name: "", employeeId: "", workTime: "", constellation: "" })
                  setQuizData(null)
                  setSelectedAnswers([])
                  setPassToken("")
                  setCertificateData(null)
                  setError("")
                }}
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-3 rounded-full"
              >
                重新开始
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <main className="overflow-hidden">
      {currentStep === "hero" && renderHeroSection()}
      {currentStep === "quiz" && renderQuizSection()}
      {currentStep === "form" && renderFormSection()}
      {currentStep === "loading" && renderLoadingSection()}
      {currentStep === "result" && renderResultSection()}
    </main>
  )
}
