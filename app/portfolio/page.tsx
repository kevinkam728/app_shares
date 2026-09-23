'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PortfolioPage() {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [rawPortfolio, setRawPortfolio] = useState<any>({})
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const clearPortfolio = async () => {
    if (!currentUser) return
    const supabase = createClient()
    const { data: port } = await supabase.from('portfolios').select('id').eq('user_id', currentUser.id).single()
    if (!port) return
    const { error } = await supabase
      .from('simulated_trades')
      .delete()
      .eq('portfolio_id', port.id)
      
    if (!error) {
      setPortfolio([])
      setRawPortfolio({})
      setIsConfirmingDelete(false)
    } else {
      console.error("Error al borrar historial:", error)
    }
  }

  useEffect(() => {
    const fetchPortfolio = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUser(user)

      const { data: port } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!port) return

      const { data: trades, error } = await supabase
        .from('simulated_trades')
        .select('*')
        .eq('portfolio_id', port.id)
        .order('buy_date', { ascending: false })

      if (trades) {
        // Agrupar los trades por ticker para mantener la estructura de la UI
        const raw: Record<string, any[]> = {}
        trades.forEach(trade => {
          if (!raw[trade.ticker]) raw[trade.ticker] = []
          const price = Number(trade.buy_price || 0)
          const amount = Number(trade.amount_invested || 0)
          const quantity = price > 0 ? amount / price : 0
          raw[trade.ticker].push({
            date: trade.buy_date || trade.created_at,
            price: price,
            quantity: quantity
          })
        })
        
        setRawPortfolio(raw)
        
        // Armar el resumen
        const summary = Object.keys(raw).map(ticker => {
          const purchases = raw[ticker]
          const totalQuantity = purchases.reduce((acc, p) => acc + p.quantity, 0)
          const totalCost = purchases.reduce((acc, p) => acc + (p.price * p.quantity), 0)
          const avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
          return { ticker, totalQuantity, totalCost, avgPrice }
        })
        
        setPortfolio(summary)
      }
    }
    fetchPortfolio()
  }, [])

  const totalGlobalInvertido = portfolio.reduce((acc, p) => acc + p.totalCost, 0)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <button onClick={() => router.push('/')} className="fixed top-6 left-6 z-50 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-gray-600">
        Volver
      </button>

      <h1 className="text-3xl font-bold mb-6 mt-16">Mi Portafolio Global</h1>
      
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6">
        <p className="text-gray-400 text-sm">Capital Total Invertido</p>
        <p className="text-3xl font-bold mt-1">${totalGlobalInvertido.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>

      {portfolio.length === 0 ? (
        <p className="text-gray-400">No hay operaciones registradas en tu portafolio.</p>
      ) : (
        <>
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
                    <td className="p-4">{Number(p.totalQuantity).toString()}</td>
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
                                            <td className="text-right">{Number(trade.quantity).toString()}</td>
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

          <div className="flex gap-4 mb-12">
            {!isConfirmingDelete ? (
                <button onClick={() => setIsConfirmingDelete(true)} className="p-3 bg-red-900/50 text-red-400 border border-red-900 rounded-lg hover:bg-red-900 hover:text-white transition-colors">
                    🗑️ Eliminar Historial
                </button>
            ) : (
                <div className="flex gap-2">
                    <button onClick={clearPortfolio} className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-500">
                        ⚠️ ¿Estás seguro? Borrar Todo
                    </button>
                    <button onClick={() => setIsConfirmingDelete(false)} className="p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                        Cancelar
                    </button>
                </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
