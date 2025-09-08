"use client"

import { useEffect, useMemo, useState } from "react"
import { TrendingUp } from "lucide-react"
import { apiFetch } from "@/lib/api"

interface TrendDataPoint {
    label: string   // 展示在 X 轴，如 “9月6日”
    count: number   // 当天证书数
}

interface TrendApiResponse {
    labels: string[]
    values: number[]
}

type RangeKey = "7d" | "30d" | "90d"
const daysMap: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90 }

// 固定的最早日期（9月5日）
const MIN_DATE = new Date(2025, 8, 6) // 月份从0开始，8=9月

// 解析后端 label 为日期（支持几种常见格式）
function parseLabelToDate(s: string): Date | null {
    // 1) ISO: 2025-09-06
    const iso = new Date(s)
    if (!Number.isNaN(iso.getTime())) return iso

    // 2) 2025/9/6 或 2025/09/06
    const m2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
    if (m2) {
        const y = Number(m2[1]), mo = Number(m2[2]) - 1, d = Number(m2[3])
        const dt = new Date(y, mo, d)
        if (!Number.isNaN(dt.getTime())) return dt
    }

    // 3) 9月6日（默认年份 2025）
    const m3 = s.match(/^(\d{1,2})月(\d{1,2})日$/)
    if (m3) {
        const mo = Number(m3[1]) - 1, d = Number(m3[2])
        const dt = new Date(2025, mo, d)
        if (!Number.isNaN(dt.getTime())) return dt
    }

    return null
}

export default function TrendChart({ className }: { className?: string }) {
    const [timeRange, setTimeRange] = useState<RangeKey>("30d")
    const [rawPoints, setRawPoints] = useState<TrendDataPoint[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>("")

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError("")
            try {
                const res = await apiFetch(`/admin/trend?days=${daysMap[timeRange]}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}` },
                })
                const data: TrendApiResponse = await res.json()

                const points: TrendDataPoint[] = (data.labels || []).map((label, i) => ({
                    label,
                    count: (data.values || [])[i] ?? 0,
                }))

                if (!cancelled) setRawPoints(points)
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "加载失败")
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [timeRange])

    // —— 数据整理：按日期排序，砍掉 9/5 之前，再按范围裁剪 —— //
    const points = useMemo(() => {
        // 附带解析出的 Date，解析失败的放最后且保持原顺序
        const withDate = rawPoints.map(p => ({ p, d: parseLabelToDate(p.label) }))
        withDate.sort((a, b) => {
            if (a.d && b.d) return a.d.getTime() - b.d.getTime()
            if (a.d && !b.d) return -1
            if (!a.d && b.d) return 1
            return 0
        })

        // 丢掉 9/5 之前
        const cut = withDate.filter(x => !x.d || x.d >= MIN_DATE)

        // 再按范围长度裁剪到「最近 N 天」，但起点不早于 9/5
        const days = daysMap[timeRange]
        const end = cut.length - 1
        const start = Math.max(0, end - (days - 1))
        return cut.slice(start, end + 1).map(x => x.p)
    }, [rawPoints, timeRange])

    const maxValue = useMemo(() => {
        const m = Math.max(0, ...points.map(p => p.count))
        return m > 0 ? m : 1
    }, [points])

    // —— 绘图坐标（用数值坐标，避免 polyline 百分比报错） —— //
    const W = 600, H = 200
    const PAD_L = 48, PAD_R = 12, PAD_T = 12, PAD_B = 24
    const innerW = W - PAD_L - PAD_R
    const innerH = H - PAD_T - PAD_B

    const getX = (i: number) =>
        points.length <= 1 ? PAD_L : PAD_L + (i / (points.length - 1)) * innerW
    const getY = (v: number) =>
        PAD_T + (1 - v / maxValue) * innerH

    const gridYs = [0, 0.25, 0.5, 0.75, 1].map(t => PAD_T + t * innerH)

    return (
        <div className={`admin-card ${className || ""}`} style={{ padding: 24 }}>
            {/* 头部 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <TrendingUp size={20} color="#3b82f6" />
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1e293b" }}>证书生成趋势</h3>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    {(["7d", "30d", "90d"] as RangeKey[]).map(key => (
                        <button
                            key={key}
                            onClick={() => setTimeRange(key)}
                            style={{
                                padding: "6px 12px",
                                fontSize: 12,
                                border: "1px solid #e2e8f0",
                                borderRadius: 4,
                                backgroundColor: timeRange === key ? "#3b82f6" : "white",
                                color: timeRange === key ? "white" : "#64748b",
                                cursor: "pointer",
                            }}
                            type="button"
                        >
                            {key === "7d" ? "7天" : key === "30d" ? "30天" : "90天"}
                        </button>
                    ))}
                </div>
            </div>

            {/* 图表区域 */}
            <div style={{ minHeight: 220, position: "relative" }}>
                {loading ? (
                    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                        加载中…
                    </div>
                ) : error ? (
                    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                        {error}
                    </div>
                ) : points.length === 0 ? (
                    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                        暂无数据
                    </div>
                ) : (
                    <>
                        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: "visible" }}>
                            {/* 网格线 */}
                            {gridYs.map((y, idx) => (
                                <line
                                    key={idx}
                                    x1={PAD_L}
                                    x2={W - PAD_R}
                                    y1={y}
                                    y2={y}
                                    stroke="#f1f5f9"
                                    strokeWidth={1}
                                />
                            ))}

                            {/* 折线 */}
                            {points.length > 1 && (
                                <polyline
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    points={points.map((p, i) => `${getX(i)},${getY(p.count)}`).join(" ")}
                                />
                            )}

                            {/* 数据点 */}
                            {points.map((p, i) => (
                                <circle key={i} cx={getX(i)} cy={getY(p.count)} r={4} fill="#3b82f6" stroke="white" strokeWidth={2} />
                            ))}
                        </svg>

                        {/* Y 轴标签 */}
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: PAD_L - 8,
                                height: H,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                fontSize: 12,
                                color: "#64748b",
                                textAlign: "right",
                                paddingRight: 6,
                                boxSizing: "border-box",
                            }}
                        >
                            <span>{maxValue}</span>
                            <span>{Math.floor(maxValue * 0.75)}</span>
                            <span>{Math.floor(maxValue * 0.5)}</span>
                            <span>{Math.floor(maxValue * 0.25)}</span>
                            <span>0</span>
                        </div>
                    </>
                )}
            </div>

            {/* X 轴标签（按当前点均匀抽样5个） */}
            {!loading && !error && points.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 16,
                        fontSize: 12,
                        color: "#64748b",
                    }}
                >
                    {points
                        .filter((_, i) => i % Math.ceil(points.length / 5 || 1) === 0)
                        .map((p, i) => (
                            <span key={i}>{p.label}</span>
                        ))}
                </div>
            )}
        </div>
    )
}
