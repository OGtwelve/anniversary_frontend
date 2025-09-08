"use client"

import type { LucideIcon } from "lucide-react"

interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
}

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  menuItems: MenuItem[]
}

export default function AdminSidebar({ activeTab, onTabChange, onLogout, menuItems }: AdminSidebarProps) {
  return (
    <div className="admin-sidebar">
      <div style={{ padding: "24px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#10b981",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "600",
            }}
          >
            管
          </div>
          <div>
            <div style={{ color: "white", fontWeight: "600" }}>管理后台</div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>后台管理系统</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: "16px 0" }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`admin-nav-item ${activeTab === item.id ? "active" : ""}`}
              style={{
                width: "100%",
                border: "none",
                background: "none",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <Icon size={18} style={{ marginRight: "12px" }} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div
        style={{
          position: "absolute",
          bottom: "24px",
          left: "16px",
          right: "16px",
        }}
      >
        <div
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            marginBottom: "8px",
          }}
        >
          周年纪念管理系统
        </div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            marginBottom: "16px",
          }}
        >
          v1.0.0
        </div>
        <button
          onClick={onLogout}
          style={{
            color: "#ef4444",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          退出登录
        </button>
      </div>
    </div>
  )
}
