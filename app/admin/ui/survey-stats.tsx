"use client"

import { useState, useEffect } from "react"
import { Users, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { apiFetch } from "@/lib/api"

interface SurveyData {
  totalParticipants: number
  passedParticipants: number
  passRate: number
  averageScore: number
  todayAnswers: number
  questions: QuestionStats[]
}

interface QuestionStats {
  id: number
  question: string
  totalAnswers: number
  correctAnswers: number
  correctRate: number
  isSimple: boolean
}

export default function SurveyStats() {
  const [surveyData, setSurveyData] = useState<SurveyData>({
    totalParticipants: 0,
    passedParticipants: 0,
    passRate: 0,
    averageScore: 0,
    todayAnswers: 0,
    questions: [],
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadSurveyData()
  }, [])

  const loadSurveyData = async () => {
    try {
      const response = await apiFetch("/admin/survey-stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      })
      const data = await response.json()
      setSurveyData(data)
    } catch (error) {
      console.error("加载问卷数据失败:", error)
      // 使用模拟数据
      setSurveyData({
        totalParticipants: 712,
        passedParticipants: 489,
        passRate: 69,
        averageScore: 2.3,
        todayAnswers: 67,
        questions: [
          {
            id: 1,
            question: "实验室成立于哪一天？",
            totalAnswers: 712,
            correctAnswers: 645,
            correctRate: 91,
            isSimple: true,
          },
          {
            id: 2,
            question: "实验室的主要研究方向是什么？",
            totalAnswers: 712,
            correctAnswers: 523,
            correctRate: 73,
            isSimple: false,
          },
          {
            id: 3,
            question: "实验室位于哪个城市？",
            totalAnswers: 712,
            correctAnswers: 678,
            correctRate: 95,
            isSimple: true,
          },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#1e293b",
            margin: "0 0 8px 0",
          }}
        >
          问卷统计
        </h1>
        <p
          style={{
            color: "#64748b",
            margin: 0,
            fontSize: "14px",
          }}
        >
          每道题目的答题情况统计
        </p>
      </div>

      {/* 统计卡片 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <Users size={20} color="#3b82f6" />
            <span style={{ color: "#64748b", fontSize: "14px" }}>总参与人数</span>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#1e293b" }}>{surveyData.totalParticipants}</div>
          <div style={{ color: "#64748b", fontSize: "12px" }}>累计参与人数</div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <CheckCircle size={20} color="#10b981" />
            <span style={{ color: "#64748b", fontSize: "14px" }}>通过人数</span>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#1e293b" }}>{surveyData.passedParticipants}</div>
          <div style={{ color: "#64748b", fontSize: "12px" }}>通过率 {surveyData.passRate}%</div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <Clock size={20} color="#f59e0b" />
            <span style={{ color: "#64748b", fontSize: "14px" }}>平均分数</span>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#1e293b" }}>{surveyData.averageScore}</div>
          <div style={{ color: "#64748b", fontSize: "12px" }}>满分 3 分</div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <TrendingUp size={20} color="#8b5cf6" />
            <span style={{ color: "#64748b", fontSize: "14px" }}>今日答题</span>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#1e293b" }}>{surveyData.todayAnswers}</div>
          <div style={{ color: "#64748b", fontSize: "12px" }}>今日新增答题</div>
        </div>
      </div>

      {/* 标签页 */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0" }}>
          {[
            { id: "overview", label: "数据概览" },
            { id: "analysis", label: "题目分析" },
            { id: "details", label: "详细记录" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 16px",
                border: "none",
                backgroundColor: "transparent",
                color: activeTab === tab.id ? "#3b82f6" : "#64748b",
                borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 题目详细分析 */}
      {activeTab === "analysis" && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>题目详细分析</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>每道题目的答题情况统计</p>
          </div>

          <div style={{ padding: "24px" }}>
            {surveyData.questions.map((question, index) => (
              <div
                key={question.id}
                style={{
                  marginBottom: index < surveyData.questions.length - 1 ? "32px" : 0,
                  paddingBottom: index < surveyData.questions.length - 1 ? "32px" : 0,
                  borderBottom: index < surveyData.questions.length - 1 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "500" }}>问题 {question.id}</h4>
                  {question.isSimple && (
                    <span
                      style={{
                        padding: "2px 8px",
                        backgroundColor: "#10b981",
                        color: "white",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    >
                      简单
                    </span>
                  )}
                  {!question.isSimple && (
                    <span
                      style={{
                        padding: "2px 8px",
                        backgroundColor: "#f59e0b",
                        color: "white",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    >
                      中等
                    </span>
                  )}
                </div>

                <p style={{ margin: "0 0 16px 0", color: "#374151" }}>{question.question}</p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>总答题数</div>
                    <div style={{ fontSize: "20px", fontWeight: "600" }}>{question.totalAnswers}</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>正确数</div>
                    <div style={{ fontSize: "20px", fontWeight: "600", color: "#10b981" }}>
                      {question.correctAnswers}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>正确率</div>
                    <div style={{ fontSize: "20px", fontWeight: "600", color: "#3b82f6" }}>{question.correctRate}%</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>难度</div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        backgroundColor: "#e2e8f0",
                        borderRadius: "4px",
                        overflow: "hidden",
                        marginTop: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: `${question.correctRate}%`,
                          height: "100%",
                          backgroundColor:
                            question.correctRate > 80 ? "#10b981" : question.correctRate > 60 ? "#f59e0b" : "#ef4444",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
