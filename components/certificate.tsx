import { forwardRef } from "react"
import Image from "next/image"

interface CertificateData {
    fullNo: string
    scsCode: string
    daysToTarget: number
    name: string
    startDate: string
    workNo: string
}

interface CertificateProps {
    data: CertificateData
    showBack?: boolean
}

const Certificate = forwardRef<HTMLDivElement, CertificateProps>(({ data, showBack = false }, ref) => {
    return (
        <div
            ref={ref}
            className="relative w-[1200px] h-[800px] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"
        >
            <div className="absolute inset-0 bg-[url('/images/background.jpg')] bg-cover bg-center opacity-80"></div>

            {showBack ? (
                // Certificate Back
                <div className="relative w-full h-full">
                    <Image src="/images/certificate-back.png" alt="Certificate Back" fill className="object-contain" />
                    <div className="absolute bottom-20 right-35 text-right text-white">
                        {/* Certificate number with white background and work number on same line */}
                        <div className="flex items-center justify-end gap-3 mb-6">
                            {/* Name at the top */}
                            <div className="text-4xl font-bold tracking-wide mt-1">{data.name}</div>
                            <div className="bg-white text-black px-6 py-1 text-2xl font-bold rounded">
                                {data.workNo}
                            </div>
                        </div>

                        {/* Full certificate code - single line only */}
                        <div className="font-medium text-gray-200 text-4xl
                leading-none tracking-[-0.06em]">
                            {data.fullNo}
                        </div>

                    </div>
                </div>
            ) : (
                // Certificate Front
                <div className="relative w-full h-full">
                    <Image src="/images/certificate-front.png" alt="Certificate Front" fill className="object-contain" />

                    <div className="absolute bottom-20 right-35 text-right text-white">
                        {/* Certificate number with white background and work number on same line */}
                        <div className="flex items-center justify-end gap-3 mb-6">
                            {/* Name at the top */}
                            <div className="text-4xl font-bold tracking-wide mt-1">{data.name}</div>
                            <div className="bg-white text-black px-6 py-1 text-2xl font-bold rounded">
                                {data.workNo}
                            </div>
                        </div>

                        {/* Full certificate code - single line only */}
                        <div className="font-medium text-gray-200 text-4xl
                leading-none tracking-[-0.06em]">
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
