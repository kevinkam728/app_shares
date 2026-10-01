'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, LayoutGrid } from 'lucide-react'
import StockHeatmap from '@/components/StockHeatmap'

export default function HeatmapPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 space-y-6">
      <button 
        onClick={() => router.push('/')} 
        className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-2 cursor-pointer w-fit"
      >
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="flex items-center gap-3">
        <LayoutGrid className="text-blue-500" size={32} />
        <h1 className="text-3xl font-bold">Heatmap del Mercado</h1>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
        <StockHeatmap />
      </div>
    </div>
  )
}
