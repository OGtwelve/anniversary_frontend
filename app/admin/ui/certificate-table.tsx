"use client"

import {useEffect, useState} from "react"
import { Search, Download, Settings, X, Check, Edit2, Trash2, Save, XCircle } from "lucide-react"
import { apiExport, apiUpdateCertificate, apiDeleteCertificate } from "@/lib/api"
import {Button} from "@/components/ui/button";
import { RefreshCw } from "lucide-react"
import {Input} from "@/components/ui/input";

interface Certificate {
    id: string
    name: string
    employeeId: string
    joinDate: string
    workYears: number
    blessing: string
    createdAt: string
}

const COL_KEY_MAP: Record<keyof Certificate, string> = {
    id: "fullNo",
    name: "name",
    employeeId: "workNo",
    joinDate: "startDate",
    workYears: "workDays",
    blessing: "wishes",
    createdAt: "createdAt",
}

/** 把显示用日期(yyyy/M/d 或 yyyy-MM-dd...) 转成 <Input type="date"> 的 yyyy-MM-dd */
function toDateInputValue(displayDate: string): string {
    if (!displayDate) return ""
    // 常见分隔替换
    const s = displayDate.replaceAll(".", "-").replaceAll("/", "-")
    // 可能是 'yyyy-MM-dd HH:mm:ss'
    const base = s.slice(0, 10)
    const parts = base.split("-").map((p) => Number(p))
    if (parts.length === 3 && !parts.some(Number.isNaN)) {
        const [y, m, d] = parts
        const mm = String(m).padStart(2, "0")
        const dd = String(d).padStart(2, "0")
        return `${y}-${mm}-${dd}`
    }
    return ""
}

interface ExportColumn {
    key: keyof Certificate
    label: string
    selected: boolean
}

/** 轻量结果弹窗 */
function ResultModal({
                         open,
                         type, // "success" | "error"
                         title,
                         message,
                         onClose,
                     }: {
    open: boolean
    type: "success" | "error"
    title: string
    message?: string
    onClose: () => void
}) {
    if (!open) return null
    const isSuccess = type === "success"
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1100,
            }}
            onClick={onClose}
        >
            <div
                className="admin-card"
                style={{
                    width: 420,
                    padding: 20,
                    margin: 16,
                    borderTop: `4px solid ${isSuccess ? "#10b981" : "#ef4444"}`,
                    boxShadow: "0 10px 30px rgba(0,0,0,.15)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: "999px",
                            background: isSuccess ? "#10b981" : "#ef4444",
                            display: "grid",
                            placeItems: "center",
                            flex: "0 0 auto",
                        }}
                    >
                        {isSuccess ? <Check size={16} color="#fff" /> : <X size={16} color="#fff" />}
                    </div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#0f172a" }}>{title}</h3>
                </div>
                {message && (
                    <p style={{ margin: "8px 0 16px", color: "#475569", fontSize: 14, lineHeight: 1.6 }}>{message}</p>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        onClick={onClose}
                        className="admin-btn-primary"
                        style={{ padding: "8px 14px" }}
                    >
                        我知道了
                    </Button>
                </div>
            </div>
        </div>
    )
}

interface PaginationProps {
    page: number
    size: number
    total: number
    onPageChange: (p: number) => void
    onSizeChange: (s: number) => void
}

interface CertificateTableProps {
    certificates?: Certificate[]   // ← 可选
    onUpdate?: () => void
    pagination?: PaginationProps
    tableLoading?: boolean
}

export default function CertificateTable({ certificates = [], onUpdate, pagination,tableLoading = false }: CertificateTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [showExportModal, setShowExportModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingData, setEditingData] = useState<Partial<Certificate>>({})
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const [resultOpen, setResultOpen] = useState(false)
    const [resultType, setResultType] = useState<"success" | "error">("success")
    const [resultTitle, setResultTitle] = useState("操作成功")
    const [resultMsg, setResultMsg] = useState<string | undefined>(undefined)

    const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.size)) : 1

    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = async () => {
        if (!onUpdate) return
        try {
            setRefreshing(true)
            await Promise.resolve(onUpdate()) // 兼容 onUpdate 返回 void
        } catch (e) {
            console.error(e)
            openResult("error", "刷新失败", "请稍后重试")
        } finally {
            setRefreshing(false)
        }
    }

    function openResult(type: "success" | "error", title: string, message?: string) {
        setResultType(type)
        setResultTitle(title)
        setResultMsg(message)
        setResultOpen(true)
        // 1.5s 自动关闭（也可改为 2s/3s）
        window.setTimeout(() => setResultOpen(false), 1500)
    }

    const [exportColumns, setExportColumns] = useState<ExportColumn[]>([
        { key: "id", label: "证书编号", selected: true },
        { key: "name", label: "姓名", selected: true },
        { key: "employeeId", label: "工号", selected: true },
        { key: "joinDate", label: "入职时间", selected: true },
        { key: "workYears", label: "工龄(天)", selected: true },
        { key: "blessing", label: "祝福语", selected: true },
        { key: "createdAt", label: "首次注册时间", selected: true },
    ])
    const [exporting, setExporting] = useState(false)

    const filteredCertificates = certificates.filter((cert) => {
        const q = searchTerm.trim()
        if (!q) return true
        return cert.name.includes(q) || cert.employeeId.includes(q) || cert.id.includes(q)
    })

    const handleEdit = (cert: Certificate) => {
        console.log("[v0] Edit button clicked for certificate:", cert.id)
        console.log("[v0] Button click event fired successfully")
        setEditingId(cert.id)
        setEditingData({
            name: cert.name,
            employeeId: cert.employeeId,
            joinDate: toDateInputValue(cert.joinDate),
            workYears: cert.workYears,
            blessing: cert.blessing,
        })
    }

    const handleSave = async () => {
        if (!editingId || !editingData) return
        setLoading(true)
        try {
            await apiUpdateCertificate(editingId, editingData)
            setEditingId(null)
            setEditingData({})
            onUpdate?.() // 刷新
            openResult("success", "修改成功")
        } catch (error) {
            console.error("修改失败:", error)
            openResult("error", "修改失败", "请稍后重试")
        } finally {
            setLoading(false)
        }
    }


    const handleCancel = () => {
        setEditingId(null)
        setEditingData({})
    }

    const handleDelete = (id: string) => {
        console.log("[v0] Delete button clicked for certificate:", id)
        console.log("[v0] Delete button click event fired successfully")
        setDeletingId(id)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        if (!deletingId) return
        setLoading(true)
        try {
            await apiDeleteCertificate(deletingId)
            setShowDeleteModal(false)
            setDeletingId(null)
            onUpdate?.() // 刷新
            openResult("success", "删除成功")
        } catch (error) {
            console.error("删除失败:", error)
            openResult("error", "删除失败", "请稍后重试")
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        const selected = exportColumns.filter((c) => c.selected)
        if (selected.length === 0) {
            openResult("error", "导出失败", "请至少选择一列再导出")
            return
        }

        setExporting(true)
        try {
            const columns = selected.map((c) => COL_KEY_MAP[c.key])
            const payload = {
                columns,
                q: searchTerm.trim() || undefined,
                limit: 5000,
                format: "csv",
            }

            await apiExport(
                "/admin/certificates/export",
                payload,
                `certificates_${new Date().toISOString().slice(0, 10)}.csv`,
            )

            setShowExportModal(false)
            // 导出一般不需要刷新，但如果后端会记录导出日志要展示，可调用 onUpdate?.()
            openResult("success", "导出开始", "文件已开始下载")
        } catch (err) {
            console.error("导出失败:", err)
            openResult("error", "导出失败", "请稍后重试")
        } finally {
            setExporting(false)
        }
    }

    const toggleColumn = (index: number) => {
        setExportColumns((prev) => prev.map((col, i) => (i === index ? { ...col, selected: !col.selected } : col)))
    }

    return (
        <>
            <div className="admin-card" style={{ padding: "24px" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                    }}
                >
                    <div>
                        <h2
                            style={{
                                fontSize: "18px",
                                fontWeight: "600",
                                margin: "0 0 4px 0",
                                color: "#1e293b",
                            }}
                        >
                            证书列表
                        </h2>
                        <p
                            style={{
                                color: "#64748b",
                                fontSize: "14px",
                                margin: 0,
                            }}
                        >
                            管理所有生成的证书
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <Button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRefresh() }}
                            disabled={refreshing}
                            className="admin-btn-secondary"
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 14, opacity: refreshing ? .6 : 1 }}
                        >
                            <RefreshCw size={16} />
                            {refreshing ? "刷新中..." : "刷新"}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setShowExportModal(true)}
                            className="admin-btn-primary"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                fontSize: "14px",
                            }}
                        >
                            <Download size={16} />
                            导出
                        </Button>

                        <div style={{ position: "relative", width: "300px" }}>
                            <Search
                                size={18}
                                color="#64748b"
                                style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }}
                            />
                            <Input
                                type="text"
                                placeholder="搜索姓名、工号或证书编号..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="admin-input"
                                style={{ paddingLeft: "40px" }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: "auto", position: "relative", zIndex: 2 }}>
                    <table className="admin-table" style={{ position: "relative", zIndex: 2 }}>
                        <thead>
                        <tr>
                            <th>证书编号</th>
                            <th>姓名</th>
                            <th>工号</th>
                            <th>入职时间</th>
                            <th>工龄(天)</th>
                            <th>祝福语</th>
                            <th>首次注册时间</th>
                            <th>操作</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredCertificates.map((cert) => (
                            <tr key={cert.id}>
                                <td style={{ fontSize: "15px" }}>{cert.id}</td>
                                <td style={{ fontWeight: "500" }}>
                                    {editingId === cert.id ? (
                                        <Input
                                            type="text"
                                            value={editingData.name || ""}
                                            onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                                            className="admin-input"
                                            style={{ width: "100%", minWidth: "80px" }}
                                        />
                                    ) : (
                                        cert.name
                                    )}
                                </td>
                                <td>
                                    {editingId === cert.id ? (
                                        <Input
                                            type="text"
                                            value={editingData.employeeId || ""}
                                            onChange={(e) => setEditingData({ ...editingData, employeeId: e.target.value })}
                                            className="admin-input"
                                            style={{ width: "100%", minWidth: "80px" }}
                                        />
                                    ) : (
                                        cert.employeeId
                                    )}
                                </td>
                                <td>
                                    {editingId === cert.id ? (
                                        <Input
                                            type="date"
                                            value={editingData.joinDate || ""}
                                            onChange={(e) => setEditingData({ ...editingData, joinDate: e.target.value })}
                                            className="admin-input"
                                            style={{ width: "100%", minWidth: "120px" }}
                                        />
                                    ) : (
                                        cert.joinDate
                                    )}
                                </td>
                                <td>
                                    {editingId === cert.id ? (
                                        <Input
                                            type="number"
                                            value={editingData.workYears ?? 0}
                                            onChange={(e) =>
                                                setEditingData({
                                                    ...editingData,
                                                    workYears: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0,
                                                })
                                            }
                                            className="admin-input"
                                            style={{ width: "100%", minWidth: "60px" }}
                                        />
                                    ) : (
                                        cert.workYears
                                    )}
                                </td>
                                <td
                                    style={{
                                        maxWidth: "200px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {editingId === cert.id ? (
                                        <Input
                                            type="text"
                                            value={editingData.blessing || ""}
                                            onChange={(e) => setEditingData({ ...editingData, blessing: e.target.value })}
                                            className="admin-input"
                                            style={{ width: "100%", minWidth: "150px" }}
                                        />
                                    ) : (
                                        cert.blessing
                                    )}
                                </td>
                                <td style={{ fontSize: "15px", color: "#64748b" }}>{cert.createdAt}</td>
                                <td>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "8px",
                                            position: "relative",
                                            zIndex: 10,
                                            pointerEvents: "auto",
                                        }}
                                    >
                                        {editingId === cert.id ? (
                                            <>
                                                <Button
                                                    type="button"
                                                    onClick={handleSave}
                                                    disabled={loading}
                                                    className="admin-btn-primary"
                                                    style={{
                                                        padding: "6px 12px",
                                                        fontSize: "12px",
                                                        backgroundColor: "#10b981",
                                                        opacity: loading ? 0.6 : 1,
                                                        minWidth: "60px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        position: "relative",
                                                        zIndex: 1,
                                                    }}
                                                >
                                                    <Save size={14} style={{ marginRight: "4px" }} />
                                                    保存
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={handleCancel}
                                                    disabled={loading}
                                                    style={{
                                                        padding: "6px 12px",
                                                        fontSize: "12px",
                                                        backgroundColor: "#64748b",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: loading ? "not-allowed" : "pointer",
                                                        opacity: loading ? 0.6 : 1,
                                                        minWidth: "60px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        position: "relative",
                                                        zIndex: 1,
                                                    }}
                                                >
                                                    <XCircle size={14} style={{ marginRight: "4px" }} />
                                                    取消
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        console.log("[v0] Edit button clicked - event object:", e)
                                                        console.log("[v0] Edit button clicked - target:", e.target)
                                                        console.log("[v0] Edit button clicked - currentTarget:", e.currentTarget)
                                                        console.log("[v0] Edit button clicked for certificate:", cert.id)
                                                        console.log("[v0] Loading state:", loading)
                                                        console.log("[v0] About to call handleEdit")
                                                        handleEdit(cert)
                                                    }}
                                                    onMouseDown={(e) => {
                                                        console.log("[v0] Edit button mouse down")
                                                        e.preventDefault()
                                                    }}
                                                    onMouseUp={(e) => {
                                                        console.log("[v0] Edit button mouse up")
                                                    }}
                                                    disabled={loading}
                                                    style={{
                                                        padding: "6px 12px",
                                                        fontSize: "12px",
                                                        backgroundColor: "#3b82f6",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: loading ? "not-allowed" : "pointer",
                                                        opacity: loading ? 0.6 : 1,
                                                        minWidth: "60px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        position: "relative",
                                                        zIndex: 1000,
                                                        transition: "all 0.2s ease",
                                                        pointerEvents: "auto",
                                                        userSelect: "none",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!loading) {
                                                            e.currentTarget.style.backgroundColor = "#2563eb"
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!loading) {
                                                            e.currentTarget.style.backgroundColor = "#3b82f6"
                                                        }
                                                    }}
                                                >
                                                    <Edit2 size={14} style={{ marginRight: "4px", pointerEvents: "none" }} />
                                                    修改
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        console.log("[v0] Delete button clicked - event object:", e)
                                                        console.log("[v0] Delete button clicked - target:", e.target)
                                                        console.log("[v0] Delete button clicked - currentTarget:", e.currentTarget)
                                                        console.log("[v0] Delete button clicked for certificate:", cert.id)
                                                        console.log("[v0] Loading state:", loading)
                                                        console.log("[v0] About to call handleDelete")
                                                        handleDelete(cert.id)
                                                    }}
                                                    onMouseDown={(e) => {
                                                        console.log("[v0] Delete button mouse down")
                                                        e.preventDefault()
                                                    }}
                                                    onMouseUp={(e) => {
                                                        console.log("[v0] Delete button mouse up")
                                                    }}
                                                    disabled={loading}
                                                    style={{
                                                        padding: "6px 12px",
                                                        fontSize: "12px",
                                                        backgroundColor: "#ef4444",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: loading ? "not-allowed" : "pointer",
                                                        opacity: loading ? 0.6 : 1,
                                                        minWidth: "60px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        position: "relative",
                                                        zIndex: 1000,
                                                        transition: "all 0.2s ease",
                                                        pointerEvents: "auto",
                                                        userSelect: "none",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!loading) {
                                                            e.currentTarget.style.backgroundColor = "#dc2626"
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!loading) {
                                                            e.currentTarget.style.backgroundColor = "#ef4444"
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={14} style={{ marginRight: "4px", pointerEvents: "none" }} />
                                                    删除
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {pagination && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16,zIndex: 2 }}>
                            <div style={{ color: "#64748b", fontSize: 14 }}>
                                共 {pagination.total} 条 · 第 {pagination.page + 1} / {totalPages} 页
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 ,zIndex: 2}}>
                                <Button
                                    type="button" // ★
                                    onClick={() => pagination?.onPageChange(Math.max(0, (pagination?.page ?? 0) - 1))}
                                    disabled={pagination?.page! <= 0}
                                    className="admin-btn"
                                    style={{ padding: "6px 10px", zIndex: 2 }}
                                >
                                    上一页
                                </Button>

                                <Button
                                    type="button" // ★
                                    onClick={() => pagination?.onPageChange(Math.min(totalPages - 1, (pagination?.page ?? 0) + 1))}
                                    disabled={(pagination?.page ?? 0) >= totalPages - 1}
                                    className="admin-btn"
                                    style={{ padding: "6px 10px", zIndex: 2 }}
                                >
                                    下一页
                                </Button>


                                <select
                                    value={pagination.size}
                                    onChange={(e) => pagination.onSizeChange(Number(e.target.value))}
                                    className="admin-input"
                                    style={{ width: 100 }}
                                >
                                    {[10, 20, 50, 100, 200].map((n) => (
                                        <option key={n} value={n}>
                                            每页 {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {filteredCertificates.length === 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "#64748b",
                        }}
                    >
                        {searchTerm ? "没有找到匹配的证书" : "暂无证书数据"}
                    </div>
                )}

                {/*{tableLoading && (*/}
                {/*    <div*/}
                {/*        style={{*/}
                {/*            position: "absolute", inset: 0, background: "rgba(255,255,255,.6)",*/}
                {/*            display: "flex", alignItems: "center", justifyContent: "center",*/}
                {/*            zIndex: 20, backdropFilter: "blur(2px)"*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        <span style={{ color: "#64748b" }}>加载中...</span>*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>

            {showDeleteModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        className="admin-card"
                        style={{
                            width: "400px",
                            padding: "24px",
                            margin: "20px",
                        }}
                    >
                        <div style={{ marginBottom: "20px" }}>
                            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#ef4444" }}>确认删除</h3>
                            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                                确定要删除这条证书记录吗？此操作不可撤销。
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <Button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeletingId(null)
                                }}
                                disabled={loading}
                                style={{
                                    padding: "8px 16px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "4px",
                                    backgroundColor: "white",
                                    color: "#64748b",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                取消
                            </Button>
                            <Button
                                type="button"
                                onClick={confirmDelete}
                                disabled={loading}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                {loading ? "删除中..." : "确认删除"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showExportModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        className="admin-card"
                        style={{
                            width: "480px",
                            maxHeight: "600px",
                            padding: "24px",
                            margin: "20px",
                        }}
                    >
                        <div
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Settings size={20} color="#3b82f6" />
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>选择导出列</h3>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setShowExportModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px",
                                    color: "#64748b",
                                }}
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 16px 0" }}>选择要导出的数据列：</p>
                            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                                {exportColumns.map((column, index) => (
                                    <label
                                        key={column.key}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "8px 0",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "18px",
                                                height: "18px",
                                                border: "2px solid #e2e8f0",
                                                borderRadius: "3px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: column.selected ? "#3b82f6" : "white",
                                                borderColor: column.selected ? "#3b82f6" : "#e2e8f0",
                                            }}
                                        >
                                            {column.selected && <Check size={12} color="white" />}
                                        </div>
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                color: column.selected ? "#1e293b" : "#64748b",
                                            }}
                                        >
                      {column.label}
                    </span>
                                        <Input
                                            type="checkbox"
                                            checked={column.selected}
                                            onChange={() => toggleColumn(index)}
                                            style={{ display: "none" }}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <Button
                                type="button"
                                onClick={() => setShowExportModal(false)}
                                style={{
                                    padding: "8px 16px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "4px",
                                    backgroundColor: "white",
                                    color: "#64748b",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                取消
                            </Button>
                            <Button
                                type="button"
                                onClick={handleExport}
                                disabled={exporting || !exportColumns.some((col) => col.selected)}
                                className="admin-btn-primary"
                                style={{
                                    padding: "8px 16px",
                                    opacity: exporting || !exportColumns.some((col) => col.selected) ? 0.6 : 1,
                                    cursor: exporting || !exportColumns.some((col) => col.selected) ? "not-allowed" : "pointer",
                                }}
                            >
                                {exporting ? "导出中..." : "确认导出"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ResultModal
                open={resultOpen}
                type={resultType}
                title={resultTitle}
                message={resultMsg}
                onClose={() => setResultOpen(false)}
            />
        </>
    )
}
