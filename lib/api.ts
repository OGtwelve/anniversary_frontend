// lib/api.ts
const RAW = process.env.NEXT_PUBLIC_ANNIV_API_BASE_URL || "/api";

// 去掉末尾斜杠，避免 // 拼接
export const API_BASE = RAW.replace(/\/$/, "");

// 统一拼 URL
export const apiUrl = (path: string) =>
    `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

// 包一层 fetch，顺手加超时与错误处理
export async function apiFetch(path: string, init: RequestInit = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000); // 15s 超时
    try {
        const res = await fetch(apiUrl(path), { ...init, signal: controller.signal });
        if (res.status === 401) {
            // token 失效，清理并跳转
            localStorage.removeItem("admin_token")
            localStorage.removeItem("admin_user")
            window.location.href = "/admin/login" // 这里用 window.location，保证立即跳转
            return Promise.reject(new Error("未授权或登录过期"))
        }
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? `- ${text}` : ""}`);
        }
        return res;
    } finally {
        clearTimeout(id);
    }
}

// lib/api.ts 追加
export async function apiUpdateCertificate(id: string, data: any) {
    const res = await fetch(apiUrl(`/admin/certificates/${encodeURIComponent(id)}`), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
        throw new Error(msg);
    }
    return res.json(); // 返回更新后的行 DTO
}

export async function apiDeleteCertificate(id: string) {
    const res = await fetch(apiUrl(`/admin/certificates/${encodeURIComponent(id)}`), {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
    });
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
        throw new Error(msg);
    }
}


export async function apiExport(
    path: string,
    body?: any,                       // 传则用 POST，不传则 GET
    fallbackFilename?: string,        // 后端没回文件名时的兜底
    init: RequestInit = {}
) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 60_000); // 导出给 60s
    try {
        const url = apiUrl(path);

        // 统一 headers（始终带上 token）
        const headers: HeadersInit = {
            ...(init.headers || {}),
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        };

        // 选择 method
        const method = init.method || (body !== undefined ? "POST" : "GET");

        const fetchInit: RequestInit = {
            ...init,
            method,
            headers,
            signal: controller.signal,
        };

        // 有 body 才加 JSON
        if (body !== undefined) {
            (headers as any)["Content-Type"] = "application/json";
            fetchInit.body = typeof body === "string" ? body : JSON.stringify(body);
        }

        const res = await fetch(url, fetchInit);
        if (!res.ok) {
            // 统一错误信息
            let msg = `HTTP ${res.status}`;
            try {
                const j = await res.json();
                if (j?.message) msg = j.message;
            } catch {
                const txt = await res.text().catch(() => "");
                if (txt) msg += ` - ${txt}`;
            }
            throw new Error(msg);
        }

        const blob = await res.blob();

        // 从响应头拿文件名（优先）
        let filename = fallbackFilename;
        const cd = res.headers.get("content-disposition");
        if (cd) {
            const m = /filename\*?=(?:UTF-8'')?("?)([^\";]+)\1/i.exec(cd);
            if (m?.[2]) filename = decodeURIComponent(m[2]);
        }
        if (!filename) {
            const ext =
                blob.type.includes("spreadsheetml") || blob.type.includes("excel")
                    ? ".xlsx"
                    : blob.type.includes("csv")
                        ? ".csv"
                        : blob.type.includes("pdf")
                            ? ".pdf"
                            : "";
            filename = `download_${new Date().toISOString().slice(0, 10)}${ext}`;
        }

        // 触发下载
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objUrl), 0);
    } finally {
        clearTimeout(t);
    }
}
