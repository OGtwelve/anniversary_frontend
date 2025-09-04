import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

// const notoSansSC = Noto_Sans_SC({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-noto-sans-sc",
// })

export const metadata: Metadata = {
  title: "之江实验室-8周年活动网站",
  description: "之江实验室宇宙主题互动体验",
  keywords: "浙江实验室,之江实验室",
  icons: {
    icon: "/images/favicon.ico",
    shortcut: "/images/favicon.ico",
    apple: "/images/favicon.ico",
  },
}

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="zh-CN">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
      </html>
  )
}
