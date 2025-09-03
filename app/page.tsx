"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Certificate from "@/components/certificate"

interface QuizOption {
  id: number
  idxNo: number
  content: string
  ifCorrect?: boolean
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
  const [currentStep, setCurrentStep] = useState("hero") // hero, quiz, wishes, form, loading, result
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    workTime: "",
    constellation: "",
    wishes: "",
  })

  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<{ questionId: number; optionId: number }[]>([])
  const [textAnswers, setTextAnswers] = useState<{ questionId: number; answer: string }[]>([])
  const [passToken, setPassToken] = useState<string>("")
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const certificateRef = useRef<HTMLDivElement>(null)
  const [showCertificateBack, setShowCertificateBack] = useState(false)
  const [showIncorrectPopup, setShowIncorrectPopup] = useState(false)
  const [correctAnswer, setCorrectAnswer] = useState("")

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
        wishes: formData.wishes,
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
          wishes: formData.wishes,
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
    const minDateObj = new Date("2017-09-06")

    if (selectedDate > maxDateObj) {
      setError("入职时间不能超过2025年9月5日")
      return
    }
    if (selectedDate < minDateObj) {
      setError("入职时间不能早于2017年9月6日")
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

  const handleTextAnswerChange = (questionId: number, answer: string) => {
    setTextAnswers((prev) => {
      const existingIndex = prev.findIndex((a) => a.questionId === questionId)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { questionId, answer }
        return updated
      } else {
        return [...prev, { questionId, answer }]
      }
    })
  }

  const handleNextQuestion = () => {
    if (!quizData) return

    const currentQuestion = quizData.questions[currentQuestionIndex]
    const hasAnswered = selectedAnswers.some((a) => a.questionId === currentQuestion.id)
    const hasTextAnswer = textAnswers.some((a) => a.questionId === currentQuestion.id && a.answer.trim())

    const isTextInputQuestion =
        currentQuestion.options.length === 0 ||
        (currentQuestion.options.length === 1 && currentQuestion.options[0].content.includes("答案"))

    if (isTextInputQuestion) {
      if (!hasTextAnswer) {
        setError("请输入答案")
        return
      }
    } else {
      if (!hasAnswered) {
        setError("请先选择一个答案")
        return
      }
    }

    setError("")

    if (!isTextInputQuestion && hasAnswered) {
      const selectedAnswer = selectedAnswers.find((a) => a.questionId === currentQuestion.id)
      if (selectedAnswer) {
        const selectedOption = currentQuestion.options.find((opt) => opt.id === selectedAnswer.optionId)
        if (selectedOption && "ifCorrect" in selectedOption && !selectedOption.ifCorrect) {
          const correctOption = currentQuestion.options.find((opt) => "ifCorrect" in opt && opt.ifCorrect)
          if (correctOption) {
            // Progress to next step first
            if (currentQuestionIndex === quizData.questions.length - 1) {
              setCurrentStep("wishes")
            } else {
              setCurrentQuestionIndex((prev) => prev + 1)
            }

            // Then show popup with ABCD option and content
            setTimeout(() => {
              const correctOptionLetter = String.fromCharCode(65 + correctOption.idxNo - 1)
              setCorrectAnswer(`${correctOptionLetter}. ${correctOption.content}`)
              setShowIncorrectPopup(true)
            }, 300)
            return
          }
        }
      }
    }

    if (currentQuestionIndex === quizData.questions.length - 1) {
      setCurrentStep("wishes")
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

  const downloadCertificateAsPDF = async () => {
    if (!certificateRef.current || !certificateData) {
      console.error("[v0] Missing certificate ref or data")
      setError("证书数据不完整，无法下载")
      return
    }

    try {
      setIsLoading(true)
      setError("")
      console.log("[v0] Starting PDF generation with dom-to-image...")

      const domtoimage = (await import("dom-to-image")).default
      const jsPDF = (await import("jspdf")).default

      console.log("[v0] Libraries loaded, capturing with dom-to-image...")

      // Wait for images to load
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const dataUrl = await domtoimage.toPng(certificateRef.current, {
        quality: 1.0,
        width: 775, // Match certificate component width
        height: 600, // Match certificate component height
        bgcolor: "transparent", // Transparent background to avoid capturing extra elements
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: "0",
          padding: "0",
        },
        filter: (node: Node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            return element.tagName !== "SCRIPT" && element.tagName !== "STYLE"
          }
          return true
        },
      })

      console.log("[v0] Image data generated with dom-to-image")

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [210, 148], // Custom format to match certificate aspect ratio (4:3)
      })

      const imgWidth = 210 // Custom width in mm
      const imgHeight = 148 // Custom height in mm (maintains 4:3 ratio)

      pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight)

      const fileName = `${certificateData.name}-宇宙证书-${showCertificateBack ? "背面" : "正面"}.pdf`
      pdf.save(fileName)

      console.log("[v0] PDF download completed successfully:", fileName)
    } catch (error) {
      console.error("[v0] PDF generation failed:", error)
      setError(`PDF生成失败: ${error instanceof Error ? error.message : "未知错误"}`)
    } finally {
      setIsLoading(false)
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

        <div className="absolute top-1/2 right-32 transform -translate-y-1/2 z-10 pointer-events-none">
          <Image
              src="/images/topmid-line.png"
              alt="Decorative line"
              width={500}
              height={10}
              className="opacity-90 object-right scale-360 z-20 pointer-events-none"
              style={{ transform: "translateX(-30%) translateY(-6.5%)" }}
          />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-end pr-32">
          <div className="text-right text-white max-w-2xl">
            <h1 className="text-7xl font-bold mb-8 text-balance leading-tight">探索宇宙的钥匙</h1>

            <p className="text-3xl mb-12 opacity-90 leading-relaxed font-light">回答几个问题, 解锁属于你的星际祝福</p>

            <Button
                onClick={() => setCurrentStep("quiz")}
                className="z-1000 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-6 text-xl font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
          <div
              className="bg-black/40 p-12 max-w-2xl mx-4 shadow-2xl relative"
              style={{
                backgroundImage: "url('/images/quiz-left-right.png')",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
          >
            <div className="text-center text-white px-8">
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
                    <div className="mb-8">
                      <div className="flex justify-between text-sm opacity-70 mb-4">
                        <span>问题 {currentQuestionIndex + 1}</span>
                        <span>共 {quizData.questions.length} 题</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3 shadow-inner">
                        <div
                            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-lg"
                            style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <h2 className="text-3xl font-bold mb-10 text-balance leading-relaxed">
                      {quizData.questions[currentQuestionIndex].content}
                    </h2>

                    {quizData.questions[currentQuestionIndex].options.length === 0 ||
                    (quizData.questions[currentQuestionIndex].options.length === 1 &&
                        quizData.questions[currentQuestionIndex].options[0].content.includes("答案")) ? (
                        // Text input question
                        <div className="space-y-6 mb-10">
                          <div className="relative">
                            <Input
                                value={
                                    textAnswers.find((a) => a.questionId === quizData.questions[currentQuestionIndex].id)
                                        ?.answer || ""
                                }
                                onChange={(e) =>
                                    handleTextAnswerChange(quizData.questions[currentQuestionIndex].id, e.target.value)
                                }
                                className="w-full h-16 bg-black/30 backdrop-blur-sm border-2 border-cyan-400/30 rounded-xl text-white placeholder-white/50 text-xl font-medium focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-center"
                                placeholder="请输入您的答案..."
                                required
                            />
                          </div>

                          {/* Show answer if available */}
                          {quizData.questions[currentQuestionIndex].options.length === 1 &&
                              quizData.questions[currentQuestionIndex].options[0].content.includes("答案") && (
                                  <div className="mt-6 p-4 bg-cyan-400/20 backdrop-blur-sm border border-cyan-400/50 rounded-xl">
                                    <p className="text-cyan-200 text-lg font-medium">
                                      {quizData.questions[currentQuestionIndex].options[0].content}
                                    </p>
                                  </div>
                              )}
                        </div>
                    ) : (
                        // Multiple choice questions
                        <div className="space-y-4 mb-10">
                          {quizData.questions[currentQuestionIndex].options.map((option) => {
                            const currentQuestion = quizData.questions[currentQuestionIndex]
                            const isSelected = selectedAnswers.some(
                                (a) => a.questionId === currentQuestion.id && a.optionId === option.id,
                            )

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                    className={`w-full text-left p-5 rounded-xl transition-all duration-300 border-2 shadow-lg ${
                                        isSelected
                                            ? "bg-cyan-400/30 border-cyan-400 shadow-cyan-400/20"
                                            : "bg-blue-900/40 hover:bg-blue-800/50 border-blue-400/40 hover:border-blue-400/70 hover:shadow-blue-400/20"
                                    }`}
                                >
                          <span className="text-lg font-medium">
                            {String.fromCharCode(65 + option.idxNo - 1)}. {option.content}
                          </span>
                                </button>
                            )
                          })}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                      <Button
                          onClick={handlePreviousQuestion}
                          disabled={currentQuestionIndex === 0}
                          variant="outline"
                          className="border-2 border-white/50 text-white hover:bg-white/10 px-8 py-3 rounded-full disabled:opacity-30 bg-transparent font-medium"
                      >
                        上一题
                      </Button>

                      <Button
                          onClick={handleNextQuestion}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white px-10 py-3 rounded-full disabled:opacity-50 font-medium shadow-lg"
                      >
                        {currentQuestionIndex === quizData.questions.length - 1 ? "完成答题" : "下一题"}
                      </Button>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg">
                          <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}
                  </>
              ) : (
                  <div>
                    <h2 className="text-2xl font-bold mb-8 text-balance">暂无问题</h2>
                    <Button onClick={() => setCurrentStep("wishes")} className="bg-blue-500 hover:bg-blue-600">
                      跳过
                    </Button>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )

  const renderWishesSection = () => (
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
          <div
              className="bg-black/40 p-12 max-w-2xl mx-4 shadow-2xl relative"
              style={{
                backgroundImage: "url('/images/quiz-left-right.png')",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
          >
            <div className="text-center text-white px-8">
              <h2 className="text-3xl font-bold mb-10 text-balance leading-relaxed">
                请写下室友对于未来的实验室或自己写下自己的祝福
              </h2>

              <div className="space-y-6 mb-10">
              <textarea
                  value={formData.wishes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, wishes: e.target.value }))}
                  className="w-full h-32 bg-black/30 backdrop-blur-sm border-2 border-cyan-400/30 rounded-xl text-white placeholder-white/50 text-lg font-medium focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 p-4 resize-none"
                  placeholder="请写下您的祝福语..."
                  required
              />
              </div>

              <div className="flex justify-between items-center">
                <Button
                    onClick={() => setCurrentStep("quiz")}
                    variant="outline"
                    className="border-2 border-white/50 text-white hover:bg-white/10 px-8 py-3 rounded-full bg-transparent font-medium"
                >
                  返回
                </Button>

                <Button
                    onClick={() => {
                      if (!formData.wishes.trim()) {
                        setError("请填写祝福语")
                        return
                      }
                      setError("")
                      validateQuizAnswers()
                    }}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white px-10 py-3 rounded-full disabled:opacity-50 font-medium shadow-lg"
                >
                  {isLoading ? "验证中..." : "完成"}
                </Button>
              </div>

              {error && (
                  <div className="mt-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg">
                    <p className="text-red-200 text-center">{error}</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )

  const renderFormSection = () => (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/form-background.png" alt="Space background" fill className="object-cover" />
        </div>

        <div className="absolute top-8 left-22 z-10">
          <Image src="/images/topleft-logo.png" alt="Left logo" width={125} height={125} className="" />
        </div>

        <div className="absolute top-2 right-15 z-10">
          <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={250} height={250} className="" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-5xl">
            <div
                className="relative p-16 overflow-hidden"
                style={{
                  backgroundImage: "url('/images/form-data-style.png')",
                  backgroundSize: "150% 150%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 text-white text-balance">点亮你的专属星图</h2>
                <p className="text-lg text-white/80 leading-relaxed">填写以下信息，完成你的宇宙档案</p>
              </div>

              <div className="px-12">
                {error && (
                    <div className="mb-8 p-4 bg-red-500/20 border border-red-400/50 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <svg
                            className="w-5 h-5 text-red-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-red-200">{error}</p>
                      </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white/90 tracking-wide">
                      姓名 <span className="text-cyan-400">*</span>
                    </label>
                    <div>
                      <Input
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          className="h-14 bg-black/30 backdrop-blur-sm border-2 border-cyan-400/30 rounded-xl text-white placeholder-white/50 text-lg font-medium focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                          placeholder="请输入您的姓名"
                          required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white/90 tracking-wide">
                      工号 <span className="text-cyan-400">*</span>
                    </label>
                    <div>
                      <Input
                          value={formData.employeeId}
                          onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
                          className="h-14 bg-black/30 backdrop-blur-sm border-2 border-cyan-400/30 rounded-xl text-white text-lg font-medium focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 px-4"
                          placeholder="请输入您的工号"
                          required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white/90 tracking-wide">
                      入职时间 <span className="text-cyan-400">*</span>
                    </label>
                    <div>
                      <div className="relative">
                        <input
                            type="date"
                            value={formData.workTime}
                            onChange={(e) => setFormData((prev) => ({ ...prev, workTime: e.target.value }))}
                            min="2017-09-06"
                            max="2025-09-05"
                            className="w-full h-14 bg-black/30 backdrop-blur-sm border-2 border-cyan-400/30 rounded-xl text-white text-lg font-medium focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 px-4"
                            required
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-white/60 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        可选择范围：2017年9月6日 - 2025年9月5日
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                      onClick={handleFormSubmit}
                      disabled={isLoading}
                      className="h-14 px-12 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600  text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                  >
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          生成中...
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                          点击生成
                        </div>
                    )}
                  </Button>
                </div>

                <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-400/20 rounded-full mb-6 invisible">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4915a1 1 0 00.95-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )

  const renderLoadingSection = () => (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/loading-background.png" alt="Loading background" fill className="object-cover" />
        </div>

        <div className="absolute top-8 left-22 z-10">
          <Image src="/images/topleft-logo.png" alt="Left logo" width={125} height={125} className="" />
        </div>

        <div className="absolute top-2 right-15 z-10">
          <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={250} height={250} className="" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
          <div className="text-center text-white mb-70 px-4">
            <h2 className="font-bold text-balance text-shimmer text-[clamp(1.125rem,calc(0.75rem+2.5vw),2.5rem)]">
              您的专属宇宙证书正在生成........
            </h2>
          </div>

          {error && (
              <div className="mb-8 p-4 bg-red-500/20 border border-red-400/50 rounded-lg max-w-md mx-auto">
                <p className="text-red-200 mb-4">{error}</p>
                <Button onClick={generateCertificate} className="bg-red-500 hover:bg-red-600">
                  重试
                </Button>
              </div>
          )}

          <div className="absolute inset-0 infinity-container">
            <Image
                src="/images/infinity-symbol.png"
                alt="Infinity symbol"
                width={900}
                height={450}
                className="w-full h-full object-contain opacity-80 infinity-symbol-large"
            />
          </div>
        </div>
      </div>
  )

  const renderResultSection = () => (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/certificate-background.png" alt="Space background" fill className="object-cover" />
        </div>

        <div className="absolute top-8 left-22 z-10">
          <Image src="/images/topleft-logo.png" alt="Left logo" width={125} height={125} className="" />
        </div>

        <div className="absolute top-2 right-15 z-10">
          <Image src="/images/topright-logo.png" alt="Zhejiang Lab" width={250} height={250} className="" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center py-8">
          <div className="max-w-6xl mx-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/30 p-8 rounded-3xl">
              {certificateData && (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <Certificate ref={certificateRef} data={certificateData} showBack={showCertificateBack} />
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex space-x-4">
                        <Button
                            onClick={() => setShowCertificateBack(false)}
                            variant={!showCertificateBack ? "default" : "outline"}
                            className="px-6 py-2"
                        >
                          正面
                        </Button>
                        <Button
                            onClick={() => setShowCertificateBack(true)}
                            variant={showCertificateBack ? "default" : "outline"}
                            className="px-6 py-2"
                        >
                          背面
                        </Button>
                      </div>

                      <div className="flex space-x-4">
                        <Button
                            onClick={downloadCertificateAsPDF}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-3 rounded-full disabled:opacity-50"
                        >
                          {isLoading ? "生成中..." : "下载PDF"}
                        </Button>
                      </div>

                      <div className="text-center text-white/80 text-sm space-y-1">
                        <p>证书编号: {certificateData.fullNo}</p>
                        <p>生成时间: {new Date().toLocaleString("zh-CN")}</p>
                      </div>
                    </div>
                  </div>
              )}

              {error && (
                  <div className="mt-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg">
                    <p className="text-red-200 text-center">{error}</p>
                  </div>
              )}
            </Card>
          </div>
        </div>
      </div>
  )

  return (
      <main className="overflow-hidden">
        {currentStep === "hero" && renderHeroSection()}
        {currentStep === "quiz" && renderQuizSection()}
        {currentStep === "wishes" && renderWishesSection()}
        {currentStep === "form" && renderFormSection()}
        {currentStep === "loading" && renderLoadingSection()}
        {currentStep === "result" && renderResultSection()}

        {showIncorrectPopup && (
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={() => setShowIncorrectPopup(false)}
            >
              <div
                  className="bg-gradient-to-br from-blue-900/90 to-cyan-900/90 backdrop-blur-md border border-cyan-400/50 rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-cyan-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">答案提示</h3>
                  <p className="text-cyan-200 mb-6 leading-relaxed">正确答案是：{correctAnswer}</p>
                  <Button
                      onClick={() => setShowIncorrectPopup(false)}
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white px-6 py-2 rounded-full font-medium"
                  >
                    知道了
                  </Button>
                </div>
              </div>
            </div>
        )}
      </main>
  )
}
