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
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? `- ${text}` : ""}`);
        }
        return res;
    } finally {
        clearTimeout(id);
    }
}
