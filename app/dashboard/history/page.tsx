'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'

export default function HistoryPage() {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [rawPortfolio, setRawPortfolio] = useState<any>({})
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const clearPortfolio = () => {
    localStorage.removeItem('global_portfolio')
    setPortfolio([])
    setRawPortfolio({})
    setIsConfirmingDelete(false)
  }

  useEffect(() => {
    const data = localStorage.getItem('global_portfolio')
    if (data) {
      const raw = JSON.parse(data)
      setRawPortfolio(raw)
      const summary = Object.keys(raw).map(ticker => {
        const purchases = raw[ticker]
        const totalQuantity = purchases.reduce((acc: number, p: any) => acc + p.quantity, 0)
        const totalCost = purchases.reduce((acc: number, p: any) => acc + (p.price * p.quantity), 0)
        const avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
        return { ticker, totalQuantity, totalCost, avgPrice }
      })
      setPortfolio(summary)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Mi Portafolio Global</h1>
      
      <table className="w-full bg-gray-800 rounded-lg overflow-hidden mb-8">
        <thead>
          <tr className="bg-gray-700">
            <th className="p-4 text-left">Ticker</th>
            <th className="p-4 text-left">Acciones Totales</th>
            <th className="p-4 text-left">Precio Promedio (DCA)</th>
            <th className="p-4 text-left">Capital Invertido</th>
            <th className="p-4 text-left">Detalles</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map((p) => (
            <Fragment key={p.ticker}>
              <tr 
                className="border-t border-gray-700 cursor-pointer hover:bg-gray-700"
                onClick={() => setExpandedTicker(expandedTicker === p.ticker ? null : p.ticker)}
              >
                <td className="p-4 font-bold">{p.ticker}</td>
                <td className="p-4">{p.totalQuantity}</td>
                <td className="p-4">${p.avgPrice.toFixed(2)}</td>
                <td className="p-4">${p.totalCost.toFixed(2)}</td>
                <td className="p-4 text-sm text-blue-400">
                    {expandedTicker === p.ticker ? '▲ Ocultar' : '▼ Detalles'}
                </td>
              </tr>
              {expandedTicker === p.ticker && (
                <tr>
                  <td colSpan={5} className="p-4 bg-gray-900">
                    <div className="space-y-2 bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-bold text-gray-400">Transacciones:</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-left">
                                    <th>Fecha de Compra</th>
                                    <th className="text-right">Precio Unitario</th>
                                    <th className="text-right">Cantidad</th>
                                    <th className="text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rawPortfolio[p.ticker].map((trade: any, i: number) => (
                                    <tr key={`${trade.date}-${i}`} className="border-t border-gray-700">
                                        <td>{new Date(trade.date).toLocaleDateString()}</td>
                                        <td className="text-right">${trade.price.toFixed(2)}</td>
                                        <td className="text-right">{trade.quantity}</td>
                                        <td className="text-right">${(trade.quantity * trade.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      <div className="flex gap-4">
        <button onClick={() => router.push('/dashboard')} className="p-3 bg-blue-600 rounded-lg hover:bg-blue-500">
          Volver al Dashboard
        </button>

        {!isConfirmingDelete ? (
            <button onClick={() => setIsConfirmingDelete(true)} className="p-3 bg-red-900 text-red-200 rounded-lg hover:bg-red-800">
                🗑️ Eliminar Historial
            </button>
        ) : (
            <div className="flex gap-2">
                <button onClick={clearPortfolio} className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-500">
                    ⚠️ ¿Estás seguro? Borrar Todo
                </button>
                <button onClick={() => setIsConfirmingDelete(false)} className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500">
                    Cancelar
                </button>
            </div>
        )}
      </div>
    </div>
  )
}
