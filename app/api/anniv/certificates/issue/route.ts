import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Certificate issue request:", body)

    const { name, startDate, workNo, passToken } = body

    // Validate request format
    if (!name || !startDate || !workNo || !passToken) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Validate pass token (in real implementation, this would verify the token)
    if (!passToken.includes("3ac9ed9a3307482f8414cb588192f892")) {
      return NextResponse.json({ message: "Invalid pass token" }, { status: 401 })
    }

    // Generate certificate data
    const currentDate = new Date()
    const startDateObj = new Date(startDate)
    const daysToTarget = Math.floor((currentDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))

    const certificateData = {
      message: "恭喜成功",
      data: {
        fullNo: "SCS01-0736-0001",
        scsCode: "SCS01",
        daysToTarget: daysToTarget,
        name: name,
        startDate: startDate,
        workNo: workNo,
      },
    }

    console.log("[v0] Certificate generated:", certificateData)
    return NextResponse.json(certificateData)
  } catch (error) {
    console.error("[v0] Certificate issue error:", error)
    return NextResponse.json(
      { message: "Failed to issue certificate", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
