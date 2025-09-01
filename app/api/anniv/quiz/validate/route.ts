import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Quiz validation request:", body)

    const { answers, quizCode } = body

    // Validate request format
    if (!answers || !Array.isArray(answers) || !quizCode) {
      return NextResponse.json({ message: "Invalid request format" }, { status: 400 })
    }

    // Mock validation logic - in real implementation, this would check against correct answers
    const allCorrect = true // For demo purposes, always return success

    // Generate pass token for certificate generation
    const passToken = `3ac9ed9a3307482f8414cb588192f892_${Date.now()}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now

    const validationResult = {
      message: "ok",
      data: {
        allCorrect,
        items: answers.map((answer: any) => ({
          questionId: answer.questionId,
          correct: true, // Mock all answers as correct
        })),
        passToken,
        expiresAt,
      },
    }

    console.log("[v0] Quiz validation result:", validationResult)
    return NextResponse.json(validationResult)
  } catch (error) {
    console.error("[v0] Quiz validation error:", error)
    return NextResponse.json(
      { message: "Failed to validate quiz", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
