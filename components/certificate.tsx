import { forwardRef } from "react"
import Image from "next/image"

interface CertificateData {
    fullNo: string
    scsCode: string
    daysToTarget: number
    name: string
    startDate: string
    workNo: string
    wishes?: string
}

interface CertificateProps {
    data: CertificateData
    showBack?: boolean
}

const Certificate = forwardRef<HTMLDivElement, CertificateProps>(({ data, showBack = false }, ref) => {
    return (
        <div
            ref={ref}
            className="relative w-[775px] h-[600px] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden rounded-3xl"
        >
            <div className="absolute inset-0 bg-[url('/images/certificate-background.png')] bg-cover bg-center opacity-80"></div>

            {showBack ? (
                // Certificate Back
                <div className="relative w-full h-full">
                    <Image src="/images/certificate-back.png" alt="Certificate Back" fill className="object-cover" />

                    <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white">
                        <div className="text-2xl font-medium leading-relaxed tracking-wide max-w-2xl">
                            <div className="mb-4">{data.wishes || "愿你在浩瀚宇宙中找到属于自己的星辰大海"}</div>
                        </div>
                    </div>

                    <div className="absolute bottom-13 right-9 text-right text-white">
                        {/* Certificate number with white background and work number on same line */}
                        <div className="flex items-center justify-end gap-3 mb-5">
                            {/* Name at the top */}
                            <div className="text-3xl tracking-wide mt-1">{data.name}</div>
                            <div className="bg-white text-black px-4 text-2xl rounded">{data.workNo}</div>
                        </div>

                        {/* Full certificate code - single line only */}
                        <div
                            className="text-gray-200 text-2xl
                leading-none tracking-[-0.06em]"
                        >
                            {data.fullNo}
                        </div>
                    </div>
                </div>
            ) : (
                // Certificate Front
                <div className="relative w-full h-full">
                    <Image src="/images/certificate-front-fix2.png" alt="Certificate Front" fill className="object-cover" />

                    <div className="absolute bottom-13 right-9 text-right text-white">
                        {/* Certificate number with white background and work number on same line */}
                        <div className="flex items-center justify-end gap-3 mb-5">
                            {/* Name at the top */}
                            <div className="text-3xl tracking-wide mt-1">{data.name}</div>
                            <div className="bg-white text-black px-4 text-2xl rounded">{data.workNo}</div>
                        </div>

                        {/* Full certificate code - single line only */}
                        <div
                            className="text-gray-200 text-2xl
                leading-none tracking-[-0.06em]"
                        >
                            {data.fullNo}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

Certificate.displayName = "Certificate"

export default Certificate
