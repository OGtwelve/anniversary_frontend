import type React from "react"
import type { Metadata } from "next"
import "./admin.css"

export const metadata: Metadata = {
  title: "后台管理系统",
  description: "Anniversary Frontend 后台管理系统",
}

export default function AdminLayout({
                                      children,
                                    }: {
  children: React.ReactNode
}) {
  return <div className="admin-root">{children}</div>
}
