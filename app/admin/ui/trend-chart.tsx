"use client"

import { useEffect, useMemo, useState } from "react"
import { TrendingUp } from "lucide-react"
import { apiFetch } from "@/lib/api"

interface TrendDataPoint {
    label: string        // 展示在 X 轴，如 “9月6日”
    count: number        // 当天证书数
}

interface TrendApiResponse {
    labels: string[]     // ["9月2日", ...]
    values: number[]     // [1,4,8,...]
}

interface TrendChartProps {
    className?: string
}

type RangeKey = "7d" | "30d" | "90d"
const daysMap: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90 }

export default function TrendChart({ className }: TrendChartProps) {
    const [timeRange, setTimeRange] = useState<RangeKey>("30d")
    const [points, setPoints] = useState<TrendDataPoint[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>("")

    useEffect(() => {
        let cancelled = false
        async function load() {
            setLoading(true)
            setError("")
            try {
                const res = await apiFetch(`/admin/trend?days=${daysMap[timeRange]}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
                })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const data: TrendApiResponse = await res.json()

                const merged: TrendDataPoint[] = (data.labels || []).map((label, i) => ({
                    label,
                    count: (data.values || [])[i] ?? 0,
                }))

                if (!cancelled) setPoints(merged)
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "加载失败")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [timeRange])

    const maxValue = useMemo(() => {
        const m = Math.max(0, ...points.map(p => p.count))
        return m > 0 ? m : 1 // 防止除零
    }, [points])

    return (
        <div className={`admin-card ${className || ""}`} style={{ padding: "24px" }}>
            {/* 头部 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp size={20} color="#3b82f6" />
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1e293b" }}>证书生成趋势</h3>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                    {(["7d", "30d", "90d"] as RangeKey[]).map(key => (
                        <button
                            key={key}
                            onClick={() => setTimeRange(key)}
                            style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "4px",
                                backgroundColor: timeRange === key ? "#3b82f6" : "white",
                                color: timeRange === key ? "white" : "#64748b",
                                cursor: "pointer",
                            }}
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
                        <svg width="100%" height="200" style={{ overflow: "visible" }}>
                            {/* 网格线 */}
                            {[0, 25, 50, 75, 100].map((percent) => (
                                <line
                                    key={percent}
                                    x1="0"
                                    y1={`${percent}%`}
                                    x2="100%"
                                    y2={`${percent}%`}
                                    stroke="#f1f5f9"
                                    strokeWidth="1"
                                />
                            ))}

                            {/* 折线 */}
                            {points.length > 1 && (
                                <polyline
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                    points={points
                                        .map((p, i) => {
                                            const x = (i / (points.length - 1)) * 100
                                            const y = 100 - (p.count / maxValue) * 100
                                            return `${x}%,${y}%`
                                        })
                                        .join(" ")}
                                />
                            )}

                            {/* 数据点 */}
                            {points.map((p, i) => {
                                const x = (i / (points.length - 1)) * 100
                                const y = 100 - (p.count / maxValue) * 100
                                return <circle key={i} cx={`${x}%`} cy={`${y}%`} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                            })}
                        </svg>

                        {/* Y 轴标签 */}
                        <div
                            style={{
                                position: "absolute",
                                left: "-40px",
                                top: 0,
                                height: 200,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                fontSize: "12px",
                                color: "#64748b",
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

            {/* X 轴标签 */}
            {!loading && !error && points.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "16px",
                        fontSize: "12px",
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
