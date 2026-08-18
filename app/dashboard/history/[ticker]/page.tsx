'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function HistoryPage() {
  const { ticker } = useParams()
  const router = useRouter()
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (ticker) {
      const data = localStorage.getItem(`dca_history_${ticker}`)
      if (data) setHistory(JSON.parse(data))
    }
  }, [ticker])

  const totalCost = history.reduce((acc, p) => acc + (p.price * p.quantity), 0)
  const totalQuantity = history.reduce((acc, p) => acc + p.quantity, 0)
  const avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Historial de Compras: {ticker}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-gray-400">Precio Promedio</p>
          <p className="text-2xl font-bold">${avgPrice.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-gray-400">Total Acciones</p>
          <p className="text-2xl font-bold">{totalQuantity}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-gray-400">Capital Invertido</p>
          <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
        </div>
      </div>

      <table className="w-full bg-gray-800 rounded-lg overflow-hidden mb-8">
        <thead>
          <tr className="bg-gray-700">
            <th className="p-4 text-left">Compra</th>
            <th className="p-4 text-left">Precio</th>
            <th className="p-4 text-left">Cantidad</th>
            <th className="p-4 text-left">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {history.map((p, i) => (
            <tr key={i} className="border-t border-gray-700">
              <td className="p-4">{i + 1}</td>
              <td className="p-4">${p.price.toFixed(2)}</td>
              <td className="p-4">{p.quantity}</td>
              <td className="p-4">${(p.price * p.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => router.push('/dashboard')} className="p-3 bg-blue-600 rounded-lg hover:bg-blue-500">
        Volver al Dashboard
      </button>
    </div>
  )
}
