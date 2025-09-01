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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
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

      if (!response.ok) {
        setError(`Certificate API request failed with status: ${response.status}`)
        return
      }

      const result = await response.json()

      if ((result.message === "恭喜成功" || result.message === "ok" || result.message === "保存成功") && result.data) {
        setCertificateData(result.data)
        console.log("[v0] Certificate generated successfully:", result.data)
        setCurrentStep("result")
      } else {
        setError(result.message || "Certificate generation failed")
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
    const selectedDate = new Date(formData.workTime)
    const maxDateObj = new Date("2025-09-05")
    const minDateObj = new Date("1998-05-12")

    if (selectedDate > maxDateObj) {
      setError("入职时间不能超过2025年9月5日")
      return
    }
    if (selectedDate < minDateObj) {
      setError("入职时间不能早于1998年5月12日")
      return
    }

    if (!passToken) {
      setError("请先完成问答验证")
      return
    }

    setError("")
    setCurrentStep("loading")
  }

  const handleOptionSelect = (questionId: number, optionId: number) => {
    setSelectedAnswers((prev) => {
      const existingIndex = prev.findIndex((a) => a.questionId === questionId)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { questionId, optionId }
        return updated
      } else {
        return [...prev, { questionId, optionId }]
      }
    })

    if (questionId === 1) {
      const optionMap: { [key: number]: string } = {
        1: "bigdipper",
        2: "galaxy",
        3: "orion",
        4: "other",
      }
      setFormData((prev) => ({ ...prev, constellation: optionMap[optionId] || "other" }))
    }
  }

  const handleNextQuestion = () => {
    if (!quizData) return

    const currentQuestion = quizData.questions[currentQuestionIndex]
    const hasAnswered = selectedAnswers.some((a) => a.questionId === currentQuestion.id)

    if (!hasAnswered) {
      setError("请先选择一个答案")
      return
    }

    setError("")

    if (currentQuestionIndex === quizData.questions.length - 1) {
      validateQuizAnswers()
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
      setError("")
    }
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

  const renderHeroSection = () => (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/background.jpg" alt="Space background" fill className="object-cover" priority />
        </div>

        <div className="absolute top-8 left-22 z-10">
          <Image src="/images/topleft-logo.png" alt="Left logo" width={125} height={125} className="" />
        </div>

        <div className="absolute top-2 right-15 z-10">
          <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={250} height={250} className="" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-end pr-24 right-15">
          <div className="text-right text-white max-w-lg">
            <h1 className="text-6xl font-bold mb-6 text-balance">探索宇宙的钥匙</h1>
            <p className="text-2xl mb-8 opacity-90 leading-relaxed">回答几个问题，解锁属于你的星际祝福</p>
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

        <div className="absolute top-8 left-22 z-10">
          <Image src="/images/topleft-logo.png" alt="Left logo" width={125} height={125} className="" />
        </div>

        <div className="absolute top-2 right-15 z-10">
          <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={250} height={250} className="" />
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
                    <div className="mb-6">
                      <div className="flex justify-between text-sm opacity-70 mb-2">
                        <span>问题 {currentQuestionIndex + 1}</span>
                        <span>共 {quizData.questions.length} 题</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                            className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-8 text-balance">
                      {quizData.questions[currentQuestionIndex].content}
                    </h2>

                    <div className="space-y-4 mb-8">
                      {quizData.questions[currentQuestionIndex].options.map((option) => {
                        const currentQuestion = quizData.questions[currentQuestionIndex]
                        const isSelected = selectedAnswers.some(
                            (a) => a.questionId === currentQuestion.id && a.optionId === option.id,
                        )

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                className={`w-full text-left p-4 rounded-lg transition-all duration-300 border ${
                                    isSelected
                                        ? "bg-cyan-400/30 border-cyan-400"
                                        : "bg-white/10 hover:bg-white/20 border-cyan-400/30 hover:border-cyan-400/60"
                                }`}
                            >
                        <span className="text-lg">
                          {String.fromCharCode(65 + option.idxNo - 1)}. {option.content}
                        </span>
                            </button>
                        )
                      })}
                    </div>

                    <div className="flex justify-between items-center">
                      <Button
                          onClick={handlePreviousQuestion}
                          disabled={currentQuestionIndex === 0}
                          variant="outline"
                          className="border-white text-white hover:bg-white/10 px-6 py-2 rounded-full disabled:opacity-30 bg-transparent"
                      >
                        上一题
                      </Button>

                      <Button
                          onClick={handleNextQuestion}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white px-8 py-3 rounded-full disabled:opacity-50"
                      >
                        {isLoading
                            ? "验证中..."
                            : currentQuestionIndex === quizData.questions.length - 1
                                ? "完成答题"
                                : "下一题"}
                      </Button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                          <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}
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

        <div className="absolute top-8 left-22 z-10">
          <Image src="/images/topleft-logo.png" alt="Left logo" width={125} height={125} className="" />
        </div>

        <div className="absolute top-2 right-15 z-10">
          <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={250} height={250} className="" />
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
                    <input
                        type="date"
                        value={formData.workTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, workTime: e.target.value }))}
                        min="1998-05-12"
                        max="2025-09-05"
                        className="w-full bg-transparent border-b-2 border-white/50 border-t-0 border-l-0 border-r-0 rounded-none text-white placeholder-white/70 focus:border-cyan-400 focus:outline-none py-2"
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

        <div className="absolute top-8 left-22 z-10">
          <Image src="/images/topleft-logo.png" alt="Left logo" width={125} height={125} className="" />
        </div>

        <div className="absolute top-2 right-15 z-10">
          <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={250} height={250} className="" />
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

        <div className="absolute top-8 left-22 z-10">
          <Image src="/images/topleft-logo.png" alt="Left logo" width={125} height={125} className="" />
        </div>

        <div className="absolute top-2 right-15 z-10">
          <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={250} height={250} className="" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="max-w-4xl mx-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/30 p-8 rounded-3xl">
              <div className="text-center text-white mb-8">
                <h2 className="text-3xl font-bold mb-4">您的专属宇宙证书</h2>
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
                    <p className="text-sm text-gray-600">{certificateData?.workNo || formData.employeeId || "002857"}</p>
                    <p className="text-sm text-gray-600">{certificateData?.fullNo || "SCS01-0880-0001"}</p>
                    {certificateData?.daysToTarget && (
                        <p className="text-xs text-gray-500 mt-1">工作天数: {certificateData.daysToTarget} 天</p>
                    )}
                  </div>
                </div>
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
