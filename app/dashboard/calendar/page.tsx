'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EarningsCalendarPage() {
  const router = useRouter()
  const [ticker, setTicker] = useState('')
  const [earnings, setEarnings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchEarnings = async () => {
    if (!ticker) return
    setLoading(true)
    const fechaHoy = new Date().toISOString().split('T')[0]
    const fechaFutura = new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0]
    
    try {
      const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
      const response = await fetch(`https://finnhub.io/api/v1/calendar/earnings?symbol=${ticker.toUpperCase()}&from=${fechaHoy}&to=${fechaFutura}&token=${token}`)
      const data = await response.json()
      setEarnings(data.earningsCalendar || [])
    } catch (error) {
      console.error("Error fetching earnings:", error)
      setEarnings([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex items-center mb-8 gap-4">
        <button onClick={() => router.push('/dashboard')} className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600">
            Volver al Dashboard
        </button>
        <h1 className="text-3xl font-bold">Calendario de Ganancias (Earnings)</h1>
      </div>
      
      <div className="flex gap-2 justify-center mb-12">
        <input 
            type="text" 
            placeholder="Ingresa un Ticker, ej: AAPL" 
            className="p-3 bg-gray-800 rounded-lg border border-gray-700 w-64"
            value={ticker}
            onChange={e => setTicker(e.target.value)}
        />
        <button onClick={fetchEarnings} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500">
            {loading ? 'Buscando...' : 'Buscar Fechas'}
        </button>
      </div>

      {earnings.length === 0 && !loading ? (
        <div className="text-center text-gray-500 mt-10">
            Busca el símbolo de una empresa para conocer cuándo presentará su próximo balance.
        </div>
      ) : (
        <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-700">
                <tr>
                    <th className="p-4 text-left">Fecha del Reporte</th>
                    <th className="p-4 text-left">Trimestre / Año</th>
                    <th className="p-4 text-left">BPA (EPS) Estimado</th>
                    <th className="p-4 text-left">Ingresos Estimados</th>
                </tr>
            </thead>
            <tbody>
                {earnings.map((e, i) => (
                    <tr key={i} className="border-t border-gray-700">
                        <td className="p-4">{e.date}</td>
                        <td className="p-4">{e.quarter} / {e.year}</td>
                        <td className="p-4">{e.epsEstimate || 'N/A'}</td>
                        <td className="p-4">{e.revenueEstimate ? `$${(e.revenueEstimate / 1000000).toFixed(2)}M` : 'Por definir'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      )}
    </div>
  )
}
