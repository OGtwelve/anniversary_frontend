"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, User, Eye, EyeOff } from "lucide-react"
import { apiFetch } from "@/lib/api"

export default function AdminLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      console.log("[v0] 登录成功:", data)
      // 存储token和用户信息
      localStorage.setItem("admin_token", data.token)
      localStorage.setItem("admin_user", JSON.stringify({ username, name: data.name || username }))
      router.push("/admin/dashboard")
    } catch (error) {
      console.error("登录错误:", error)
      alert("登录失败，请检查用户名和密码")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#2d3748",
          padding: "40px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              backgroundColor: "#3b82f6",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Lock size={24} color="white" />
          </div>
          <h1
            style={{
              color: "white",
              fontSize: "24px",
              fontWeight: "600",
              margin: "0 0 8px 0",
            }}
          >
            管理员登录
          </h1>
          <p
            style={{
              color: "#a0aec0",
              fontSize: "14px",
              margin: 0,
            }}
          >
            之江实验室周年庆活动后台管理系统
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                color: "white",
                fontSize: "14px",
                marginBottom: "8px",
              }}
            >
              用户名
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={18}
                color="#a0aec0"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  backgroundColor: "#4a5568",
                  border: "1px solid #718096",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                color: "white",
                fontSize: "14px",
                marginBottom: "8px",
              }}
            >
              密码
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                color="#a0aec0"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 40px",
                  backgroundColor: "#4a5568",
                  border: "1px solid #718096",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "14px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {showPassword ? <EyeOff size={18} color="#a0aec0" /> : <Eye size={18} color="#a0aec0" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        {/*<div*/}
        {/*  style={{*/}
        {/*    textAlign: "center",*/}
        {/*    marginTop: "24px",*/}
        {/*    color: "#a0aec0",*/}
        {/*    fontSize: "12px",*/}
        {/*  }}*/}
        {/*>*/}
        {/*  默认账号: admin / admin123*/}
        {/*</div>*/}
      </div>
    </div>
  )
}
