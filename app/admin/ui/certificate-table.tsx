"use client"

import { useState } from "react"
import { Search, MoreHorizontal, Download, Settings, X, Check } from "lucide-react"
import { apiExport } from "@/lib/api"

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

// 组件顶部，紧跟常量处
const COL_KEY_MAP: Record<keyof Certificate, string> = {
    id: "fullNo",
    name: "name",
    employeeId: "workNo",
    joinDate: "startDate",
    workYears: "workDays",
    blessing: "wishes",
    createdAt: "createdAt",
    status: "status",
};


interface CertificateTableProps {
    certificates: Certificate[]
}

interface ExportColumn {
    key: keyof Certificate
    label: string
    selected: boolean
}

export default function CertificateTable({ certificates }: CertificateTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [showExportModal, setShowExportModal] = useState(false)
    const [exportColumns, setExportColumns] = useState<ExportColumn[]>([
        { key: "id", label: "证书编号", selected: true },
        { key: "name", label: "姓名", selected: true },
        { key: "employeeId", label: "工号", selected: true },
        { key: "joinDate", label: "入职时间", selected: true },
        { key: "workYears", label: "工龄(天)", selected: true },
        { key: "blessing", label: "祝福语", selected: true },
        { key: "createdAt", label: "生成时间", selected: true },
    ])
    const [exporting, setExporting] = useState(false)

    const filteredCertificates = certificates.filter(
        (cert) => cert.name.includes(searchTerm) || cert.employeeId.includes(searchTerm) || cert.id.includes(searchTerm),
    )

    const handleExport = async () => {
        // 至少选择一列
        const selected = exportColumns.filter((c) => c.selected);
        if (selected.length === 0) {
            alert("请至少选择一列再导出");
            return;
        }

        setExporting(true);
        try {
            // 映射到后端字段名，并保留勾选顺序
            const columns = selected.map((c) => COL_KEY_MAP[c.key]);

            const payload = {
                columns,                      // 字符串数组
                q: searchTerm.trim() || undefined, // 简单搜索（与列表一致）
                limit: 5000,                  // 导出上限（可按需调整/去掉）
                format: "csv",                // 先走 csv（后端已实现；xlsx 亦可）
            };

            await apiExport(
                "/admin/certificates/export",
                payload,
                `certificates_${new Date().toISOString().slice(0, 10)}.csv`
            );

            setShowExportModal(false);
        } catch (err) {
            console.error("导出失败:", err);
            alert("导出失败，请重试");
        } finally {
            setExporting(false);
        }
    };

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
                        <button
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
                        </button>

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
                            <input
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

                <div style={{ overflowX: "auto" }}>
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>证书编号</th>
                            <th>姓名</th>
                            <th>工号</th>
                            <th>入职时间</th>
                            <th>工龄(天)</th>
                            <th>祝福语</th>
                            <th>生成时间</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredCertificates.map((cert) => (
                            <tr key={cert.id}>
                                <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{cert.id}</td>
                                <td style={{ fontWeight: "500" }}>{cert.name}</td>
                                <td>{cert.employeeId}</td>
                                <td>{cert.joinDate}</td>
                                <td>{cert.workYears}</td>
                                <td
                                    style={{
                                        maxWidth: "200px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {cert.blessing}
                                </td>
                                <td style={{ fontSize: "13px", color: "#64748b" }}>{cert.createdAt}</td>
                                <td>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            className="admin-btn-primary"
                                            style={{
                                                padding: "4px 8px",
                                                fontSize: "12px",
                                                backgroundColor: "#10b981",
                                            }}
                                        >
                                            <Download size={14} style={{ marginRight: "4px" }} />
                                            已生成
                                        </button>
                                        <button
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: "4px",
                                                color: "#64748b",
                                            }}
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
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
            </div>

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
                            <button
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
                            </button>
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
                                        <input
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
                            <button
                                onClick={() => setShowExportModal(false)}
                                style={{
                                    padding: "8px 16px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "4px",
                                    backgroundColor: "white",
                                    color: "#64748b",
                                    cursor: "pointer",
                                }}
                            >
                                取消
                            </button>
                            <button
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
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
