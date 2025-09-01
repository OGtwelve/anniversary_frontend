import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock quiz data based on the API documentation
    const quizData = {
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
              {
                id: 1,
                idxNo: 1,
                content: "北斗七星",
              },
              {
                id: 2,
                idxNo: 2,
                content: "银河系中心",
              },
              {
                id: 3,
                idxNo: 3,
                content: "猎户座",
              },
              {
                id: 4,
                idxNo: 4,
                content: "其他",
              },
            ],
          },
        ],
      },
    }

    return NextResponse.json(quizData)
  } catch (error) {
    console.error("[v0] Quiz fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch quiz data", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
