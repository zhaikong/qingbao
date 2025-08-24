'use client'

import { IntelligentReportGenerator } from '@/components/IntelligentReportGenerator'

export default function IntelligentReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <IntelligentReportGenerator />
      </div>
    </div>
  )
}