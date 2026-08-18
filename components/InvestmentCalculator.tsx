'use client'

import { useState } from 'react'

export default function InvestmentCalculator({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'compound' | 'trade'>('compound')
  
  // States
  const [compound, setCompound] = useState({ initial: 1000, monthly: 100, rate: 8, years: 10 })
  const [trade, setTrade] = useState({ buy: 100, sell: 120, quantity: 10 })

  if (!isOpen) return null

  // Calculations
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
    const totalCost = trade.buy * trade.quantity
    const totalValue = trade.sell * trade.quantity
    const pnl = totalValue - totalCost
    const pct = (pnl / totalCost) * 100
    return { pnl, pct }
  }

  const compoundResult = calcCompound()
  const tradeResult = calcTrade()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg relative border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">X</button>
        <h2 className="text-xl font-bold mb-4">Calculadora Financiera</h2>
        
        <select className="w-full p-2 mb-4 bg-gray-700 rounded" onChange={(e) => setMode(e.target.value as 'compound' | 'trade')}>
          <option value="compound">Interés Compuesto</option>
          <option value="trade">Calculadora de Trade</option>
        </select>

        {mode === 'compound' ? (
          <div className="space-y-3">
            <input type="number" placeholder="Capital Inicial" className="w-full p-2 bg-gray-700 rounded" onChange={e => setCompound({...compound, initial: +e.target.value})} />
            <input type="number" placeholder="Aporte Mensual" className="w-full p-2 bg-gray-700 rounded" onChange={e => setCompound({...compound, monthly: +e.target.value})} />
            <div className="text-lg mt-4 text-center">
              Monto Final: <span className="font-bold text-green-400">${compoundResult.final.toFixed(2)}</span><br/>
              Ganancia: <span className="font-bold text-blue-400">${compoundResult.gain.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="number" placeholder="Precio Compra" className="w-full p-2 bg-gray-700 rounded" onChange={e => setTrade({...trade, buy: +e.target.value})} />
            <input type="number" placeholder="Precio Venta" className="w-full p-2 bg-gray-700 rounded" onChange={e => setTrade({...trade, sell: +e.target.value})} />
            <input type="number" placeholder="Cantidad" className="w-full p-2 bg-gray-700 rounded" onChange={e => setTrade({...trade, quantity: +e.target.value})} />
            <div className="text-lg mt-4 text-center">
              PNL: <span className={`font-bold ${tradeResult.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>${tradeResult.pnl.toFixed(2)}</span><br/>
              Retorno: <span className={`font-bold ${tradeResult.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>{tradeResult.pct.toFixed(2)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
