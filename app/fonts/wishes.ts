import localFont from "next/font/local";

export const wishesFont = localFont({
    src: [
        { path: "./FZHCJW-fixed.woff2", weight: "400", style: "normal" },
        { path: "./FZHCJW-fixed.woff2", weight: "500", style: "normal" }, // 映射 500，避免回退
    ],
    display: "swap",
    variable: "--font-wishes",
    preload: true,
});
