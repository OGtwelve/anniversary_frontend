"use client"

import { FileText, Calendar, Clock, MessageSquare } from "lucide-react"

interface DashboardStats {
  totalCertificates: number
  todaySubmissions: number
  averageWorkYears: number
  validBlessings: number
}

interface StatsCardsProps {
  stats: DashboardStats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "总证书数",
      value: stats.totalCertificates,
      subtitle: "累计生成证书",
      icon: FileText,
      color: "#3b82f6",
    },
    {
      title: "今日新增",
      value: stats.todaySubmissions,
      subtitle: "今日生成数量",
      icon: Calendar,
      color: "#10b981",
    },
    {
      title: "平均工龄",
      value: `${stats.averageWorkYears}年`,
      subtitle: "用户平均工龄",
      icon: Clock,
      color: "#f59e0b",
    },
    {
      title: "有效祝语",
      value: stats.validBlessings,
      subtitle: "包含祝福语的证书",
      icon: MessageSquare,
      color: "#8b5cf6",
    },
  ]

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
      }}
    >
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="admin-stat-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: "4px",
                  }}
                >
                  {card.value}
                </div>
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  {card.subtitle}
                </div>
              </div>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: card.color,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={24} color="white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
