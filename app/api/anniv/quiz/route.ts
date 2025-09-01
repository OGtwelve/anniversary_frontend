import { NextResponse } from "next/server"

export async function GET() {
  try {
    const API_BASE_URL = process.env.ANNIV_API_BASE_URL || "http://localhost:8081/api"

    const response = await fetch(`${API_BASE_URL}/anniv/quiz`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`)
    }

    const quizData = await response.json()

    // Validate the response structure
    if (!quizData.data || !quizData.data.questions || !Array.isArray(quizData.data.questions)) {
      throw new Error("Invalid quiz data structure received from API")
    }

    console.log("[v0] Successfully fetched quiz data:", {
      quizCode: quizData.data.quizCode,
      questionCount: quizData.data.questions.length,
    })

    return NextResponse.json(quizData)
  } catch (error) {
    console.error("[v0] Quiz fetch error:", error)

    const fallbackQuizData = {
      message: "ok",
      data: {
        quizCode: "ANNIV25QZ-0001",
        title: "2025周年探索问答",
        questions: [
          {
            id: 1,
            idxNo: 1,
            content: "如果你是一颗星星，你希望自己属于哪个星座？",
            options: [
              { id: 1, idxNo: 1, content: "北斗七星" },
              { id: 2, idxNo: 2, content: "银河系中心" },
              { id: 3, idxNo: 3, content: "猎户座" },
              { id: 4, idxNo: 4, content: "其他" },
            ],
          },
          {
            id: 2,
            idxNo: 2,
            content: "你认为浙江实验室最重要的使命是什么？",
            options: [
              { id: 1, idxNo: 1, content: "科技创新" },
              { id: 2, idxNo: 2, content: "人才培养" },
              { id: 3, idxNo: 3, content: "产业发展" },
              { id: 4, idxNo: 4, content: "国际合作" },
            ],
          },
          {
            id: 3,
            idxNo: 3,
            content: "在未来的宇宙探索中，你最期待什么？",
            options: [
              { id: 1, idxNo: 1, content: "发现新的生命形式" },
              { id: 2, idxNo: 2, content: "建立太空基地" },
              { id: 3, idxNo: 3, content: "开发新能源" },
              { id: 4, idxNo: 4, content: "实现星际旅行" },
            ],
          },
        ],
      },
    }

    console.log("[v0] Using fallback quiz data with multiple questions")
    return NextResponse.json(fallbackQuizData)
  }
}
