'use client'

import { useState, useEffect } from 'react'
import { buyStockAction } from '../actions/portfolio'
import { createClient } from '@/lib/supabase/client'
import { getStockData } from '../actions/finance'

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(null)
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadPortfolio()
  }, [])

  const loadPortfolio = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let { data: port } = await supabase.from('portfolios').select('*').eq('user_id', user.id).single()
    
    if (!port) {
      const { data: newPort } = await supabase.from('portfolios').insert({ user_id: user.id, balance_usd: 10000 }).select().single()
      port = newPort
    }
    
    setPortfolio(port)
    
    const { data: tradesData } = await supabase.from('simulated_trades').select('*').eq('portfolio_id', port.id)
    setTrades(tradesData || [])
  }

  const handleBuy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await buyStockAction(formData)
    setLoading(false)
    if (result.error) alert(result.error)
    else loadPortfolio()
  }

  if (!portfolio) return <div className="p-8 text-white">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Mi Portafolio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <p className="text-gray-400">Saldo Disponible</p>
          <p className="text-3xl font-bold">${portfolio.balance_usd.toFixed(2)}</p>
        </div>
      </div>

      <form onSubmit={handleBuy} className="bg-gray-800 p-6 rounded-lg mb-8 flex gap-4">
        <input name="ticker" placeholder="Ticker" required className="p-2 bg-gray-700 rounded" />
        <input name="amount" type="number" placeholder="Monto USD" required className="p-2 bg-gray-700 rounded" />
        <button type="submit" className="p-2 bg-green-600 rounded hover:bg-green-500">Comprar</button>
      </form>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Posiciones Abiertas</h2>
        {trades.map(trade => (
          <div key={trade.id} className="flex justify-between p-4 border-b border-gray-700">
            <span>{trade.ticker}</span>
            <span>Invertido: ${trade.amount_invested}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
