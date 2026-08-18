'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InvestmentCalculator({ isOpen, onClose, defaultMode }: { isOpen: boolean; onClose: () => void; defaultMode: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'compound' | 'trade' | 'dca'>('compound')
  
  useEffect(() => {
    if (defaultMode === 'Interés Compuesto') setMode('compound')
    else if (defaultMode === 'Precio Promedio (DCA)') setMode('dca')
  }, [defaultMode, isOpen])
  
  const [compound, setCompound] = useState({ initial: 1000, monthly: 100, rate: 8, years: 10 })
  const [trade, setTrade] = useState({ buy: 100, sell: 120, quantity: 10, years: 0 })
  const [purchases, setPurchases] = useState<{price: number, quantity: number}[]>([])
  const [currentPrice, setCurrentPrice] = useState('')
  const [currentQty, setCurrentQty] = useState('')
  const [ticker, setTicker] = useState('')

  if (!isOpen) return null

  const calcCompound = () => {
    const { initial, monthly, rate, years } = compound
    const r = rate / 100 / 12
    const n = years * 12
    let futureValue = initial * Math.pow(1 + r, n)
    if (r > 0) futureValue += monthly * ((Math.pow(1 + r, n) - 1) / r)
    else futureValue += monthly * n
    
    const totalInvested = initial + (monthly * n)
    return { final: futureValue, gain: futureValue - totalInvested }
  }

  const calcTrade = () => {
    const { buy, sell, quantity, years } = trade
    const totalCost = buy * quantity
    const totalValue = sell * quantity
    const pnl = totalValue - totalCost
    const pct = (pnl / totalCost) * 100
    
    let annualized = 0
    if (years > 0 && buy > 0) {
      annualized = (Math.pow(sell / buy, 1 / years) - 1) * 100
    }
    
    return { pnl, pct, annualized }
  }

  const calcDCA = () => {
    const totalCost = purchases.reduce((acc, p) => acc + (p.price * p.quantity), 0)
    const totalQuantity = purchases.reduce((acc, p) => acc + p.quantity, 0)
    const avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
    return { avgPrice, totalQuantity, isValid: purchases.length > 0 }
  }

  const handleAddPurchase = () => {
    const price = Number(currentPrice)
    const qty = Number(currentQty)
    if (price > 0 && qty > 0) {
      setPurchases([...purchases, { price, quantity: qty }])
      setCurrentPrice('')
      setCurrentQty('')
    }
  }

  const compoundResult = calcCompound()
  const tradeResult = calcTrade()
  const dcaResult = calcDCA()

  const handleVerHistorial = () => {
    if (ticker && dcaResult.isValid) {
      localStorage.setItem(`dca_history_${ticker}`, JSON.stringify(purchases))
      router.push(`/dashboard/history/${ticker}`)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg relative border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">X</button>
        <h2 className="text-xl font-bold mb-4">Calculadora Financiera</h2>
        
        <select className="w-full p-2 mb-4 bg-gray-700 rounded" value={mode} onChange={(e) => setMode(e.target.value as any)}>
          <option value="compound">Interés Compuesto</option>
          <option value="trade">Calculadora de Trade</option>
          <option value="dca">Precio Promedio (DCA)</option>
        </select>

        {mode === 'compound' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Capital Inicial ($)</label>
              <input type="number" placeholder="1000" className="w-full p-2 bg-gray-700 rounded" onChange={e => setCompound({...compound, initial: +e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Aporte Mensual ($)</label>
              <input type="number" placeholder="100" className="w-full p-2 bg-gray-700 rounded" onChange={e => setCompound({...compound, monthly: +e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tasa de Interés Anual (%)</label>
              <input type="number" placeholder="8" className="w-full p-2 bg-gray-700 rounded" onChange={e => setCompound({...compound, rate: +e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Años de Inversión</label>
              <input type="number" placeholder="10" className="w-full p-2 bg-gray-700 rounded" onChange={e => setCompound({...compound, years: +e.target.value})} />
            </div>
            <div className="text-lg mt-6 text-center bg-gray-900 p-4 rounded-lg">
              Monto Final: <span className="font-bold text-green-400">${compoundResult.final.toFixed(2)}</span><br/>
              Ganancia Total: <span className="font-bold text-blue-400">${compoundResult.gain.toFixed(2)}</span>
            </div>
          </div>
        ) : mode === 'trade' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Precio de Compra ($)</label>
              <input type="number" placeholder="100" className="w-full p-2 bg-gray-700 rounded" onChange={e => setTrade({...trade, buy: +e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Precio de Venta / Actual ($)</label>
              <input type="number" placeholder="120" className="w-full p-2 bg-gray-700 rounded" onChange={e => setTrade({...trade, sell: +e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cantidad de Acciones</label>
              <input type="number" placeholder="10" className="w-full p-2 bg-gray-700 rounded" onChange={e => setTrade({...trade, quantity: +e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tiempo de tenencia (Años) - Opcional</label>
              <input type="number" placeholder="1" className="w-full p-2 bg-gray-700 rounded" onChange={e => setTrade({...trade, years: +e.target.value})} />
            </div>
            <div className="text-lg mt-6 text-center bg-gray-900 p-4 rounded-lg">
              Ganancia/Pérdida Neta: <span className={`font-bold ${tradeResult.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>${tradeResult.pnl.toFixed(2)}</span><br/>
              Retorno Total: <span className={`font-bold ${tradeResult.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>{tradeResult.pct.toFixed(2)}%</span>
              {trade.years > 0 && (
                <>
                  <br/>Retorno Anualizado: <span className={`font-bold ${tradeResult.annualized >= 0 ? 'text-green-400' : 'text-red-400'}`}>{tradeResult.annualized.toFixed(2)}%</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input type="text" placeholder="Ticker (ej: AAPL)" className="w-full p-2 bg-gray-700 rounded" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} />
            <div className="flex gap-2">
              <input type="number" placeholder="Precio $" className="flex-1 p-2 bg-gray-700 rounded" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} />
              <input type="number" placeholder="Cant." className="flex-1 p-2 bg-gray-700 rounded" value={currentQty} onChange={e => setCurrentQty(e.target.value)} />
            </div>
            <button onClick={handleAddPurchase} className="w-full p-2 bg-blue-600 rounded"> + Añadir compra</button>
            <p className="text-sm text-gray-400">Compras añadidas: {purchases.length}</p>
            <div className="text-lg mt-6 text-center bg-gray-900 p-4 rounded-lg">
              Precio Promedio: <span className="font-bold text-blue-400">${dcaResult.avgPrice.toFixed(2)}</span><br/>
              Total de Acciones: <span className="font-bold text-green-400">{dcaResult.totalQuantity}</span>
            </div>
            <button onClick={handleVerHistorial} disabled={!dcaResult.isValid || !ticker} className="w-full p-2 bg-green-600 rounded disabled:bg-gray-600">
              Ver historial de {ticker || 'Acción'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
