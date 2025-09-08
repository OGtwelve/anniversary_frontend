"use client"

import {useState, useEffect, useCallback} from "react"
import {useRouter} from "next/navigation"
import AdminSidebar from "../ui/sidebar"
import StatsCards from "../ui/stats-cards"
import CertificateTable from "../ui/certificate-table"
import SurveyStats from "../ui/survey-stats"
import TrendChart from "../ui/trend-chart"
import {FileText, Users, LogOut} from "lucide-react"
import {apiFetch} from "@/lib/api"
import {jwtDecode} from "jwt-decode"

interface JwtPayload {
    exp: number // 过期时间 (秒)
}

interface DashboardStats {
    totalCertificates: number
    todaySubmissions: number
    averageWorkYears: number
    validBlessings: number
}

interface Certificate {
    id: string
    name: string
    employeeId: string
    joinDate: string
    workYears: number
    blessing: string
    createdAt: string
    status: "generated" | "pending"
}

interface Paged<T> {
    items: T[]
    total: number
    page: number
    size: number
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("certificates")
    const [stats, setStats] = useState<DashboardStats>({
        totalCertificates: 0,
        todaySubmissions: 0,
        averageWorkYears: 0,
        validBlessings: 0,
    })
    const [certificates, setCertificates] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [userInfo, setUserInfo] = useState<{ username: string; name: string } | null>(null)
    const router = useRouter()
    // state
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(20)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        const token = localStorage.getItem("admin_token")
        const user = localStorage.getItem("admin_user")
        if (!token) {
            router.push("/admin/login")
            return
        }

        try {
            const {exp} = jwtDecode<JwtPayload>(token)
            if (Date.now() >= exp * 1000) {
                // 已过期
                localStorage.removeItem("admin_token")
                localStorage.removeItem("admin_user")
                router.push("/admin/login")
                return
            }
        } catch (err) {
            console.error("JWT 解析失败:", err)
            router.push("/admin/login")
            return
        }

        if (user) {
            setUserInfo(JSON.parse(user))
        }

        loadDashboardData(page,size)
    }, [router,page,size])

    // loadDashboardData 改为带 page/size
    async function loadDashboardData(p = page, s = size) {
        try {
            setLoading(true) // 建议：翻页时也给个轻量 loading
            const [statsResponse, certificatesResponse] = await Promise.all([
                apiFetch("/admin/stats", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
                }),
                apiFetch(`/admin/certificates?page=${p}&size=${s}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
                }),
            ])

            const statsData = await statsResponse.json()
            const certPage = await certificatesResponse.json() // { items,total,page,size } 或数组兜底

            setStats(statsData)
            const items = Array.isArray(certPage) ? certPage : (certPage?.items ?? [])
            setCertificates(items)
            setTotal(Array.isArray(certPage) ? items.length : (certPage?.total ?? 0))

            // 如果当前页被删空了，自动回退一页再拉一次
            if (p > 0 && items.length === 0 && (certPage?.total ?? 0) > 0) {
                setPage(p - 1) // 下面的 useEffect 会自动再次触发
            }
        } catch (e) {
            console.error("加载数据失败:", e)
            setStats({
                totalCertificates: 3,
                todaySubmissions: 0,
                averageWorkYears: 2.7,
                validBlessings: 2,
            })

            setCertificates([
                {
                    id: "SCS01-0886-0001",
                    name: "胡淏楠",
                    employeeId: "002857",
                    joinDate: "2023/4/4",
                    workYears: 645,
                    blessing: "祝愿之江实验室蒸蒸日上！",
                    createdAt: "2025/1/7 22:30:00",
                    status: "generated",
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_user")
        router.push("/admin/login")
    }

    const menuItems = [
        {id: "certificates", label: "证书管理", icon: FileText},
        {id: "survey", label: "问卷统计", icon: Users},
    ]

    const renderContent = () => {
        switch (activeTab) {
            case "certificates":
                return (
                    <>
                        <div style={{marginBottom: "24px"}}>
                            <h1
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "600",
                                    color: "#1e293b",
                                    margin: "0 0 8px 0",
                                }}
                            >
                                证书管理
                            </h1>
                            <p
                                style={{
                                    color: "#64748b",
                                    margin: 0,
                                    fontSize: "14px",
                                }}
                            >
                                管理所有生成的证书
                            </p>
                        </div>
                        <StatsCards stats={stats}/>
                        <div style={{marginTop: "32px"}}>
                            <TrendChart/>
                        </div>
                        <div style={{marginTop: "32px"}}>
                            <CertificateTable
                                certificates={certificates}
                                onUpdate={loadDashboardData}
                                pagination={{
                                    page,
                                    size,
                                    total,
                                    onPageChange: setPage,
                                    onSizeChange: (s: number) => { setPage(0); setSize(s) },
                                }}
                            />
                        </div>
                    </>
                )
            case "survey":
                return <SurveyStats/>
            default:
                return null
        }
    }

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                }}
            >
                <div>加载中...</div>
            </div>
        )
    }

    return (
        <div style={{display: "flex", minHeight: "100vh"}}>
            <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}
                          menuItems={menuItems}/>

            <div style={{flex: 1, backgroundColor: "#f8fafc"}}>
                <div
                    style={{
                        backgroundColor: "white",
                        padding: "16px 24px",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    {userInfo && (
                        <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                            <span style={{color: "#64748b", fontSize: "14px"}}>欢迎，</span>
                            <span style={{color: "#1e293b", fontWeight: "500"}}>{userInfo.name}</span>
                            <button
                                onClick={handleLogout}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "6px 12px",
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                }}
                            >
                                <LogOut size={14}/>
                                退出
                            </button>
                        </div>
                    )}
                </div>

                <div style={{padding: "24px"}}>{renderContent()}</div>
            </div>
        </div>
    )
}
