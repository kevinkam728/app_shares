'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { searchStocks } from '@/app/actions/finance'
import { PlusCircle, ArrowLeft } from 'lucide-react'

export default function AddStockPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [ticker, setTicker] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [precio, setPrecio] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [suggestions, setSuggestions] = useState<{symbol: string, name: string}[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (ticker.length > 1) {
      const timer = setTimeout(async () => {
        try {
          const results = await searchStocks(ticker)
          setSuggestions(results)
          setShowDropdown(true)
        } catch (error) {
          console.error("Error searching stocks:", error)
          setSuggestions([])
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [ticker])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMessage('')

    const priceNum = parseFloat(precio)
    const qtyNum = parseFloat(cantidad)

    if (!ticker || isNaN(priceNum) || priceNum <= 0 || isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Por favor completa todos los campos con valores válidos.')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const currentUser = user

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', currentUser.id)
        .single();
        
      if (profileError || !profile) {
        setErrorMsg('No se pudo obtener tu saldo actual.');
        setLoading(false);
        return;
      }

      const totalCost = priceNum * qtyNum

      if (profile.balance < totalCost) {
        setErrorMsg('Fondos insuficientes en el portafolio para realizar esta compra.');
        setLoading(false);
        return;
      }

      // 1. Get or create portfolio
      let { data: port } = await supabase.from('portfolios').select('*').eq('user_id', currentUser.id).single()
      if (!port) {
        const { data: newPort } = await supabase.from('portfolios').insert({ user_id: currentUser.id, balance_usd: 10000 }).select().single()
        port = newPort
      }

      if (!port) {
        setErrorMsg('No se pudo obtener la información de tu cuenta. Por favor, recarga la página.')
        setLoading(false)
        return
      }

      // 2. Insert simulated trade
      const { error: tradeError } = await supabase.from('simulated_trades').insert({
        portfolio_id: port.id,
        ticker: ticker.toUpperCase(),
        amount_invested: totalCost,
        buy_price: priceNum,
        buy_date: new Date(fecha).toISOString()
      })

      if (tradeError) {
        throw tradeError
      }

      // 3. Update profile balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - totalCost })
        .eq('id', currentUser.id)

      if (updateError) {
        throw updateError
      }

      setSuccessMessage('¡Compra registrada con éxito en tu portafolio!')
      setTicker('')
      setPrecio('')
      setCantidad('')
      setTimeout(() => {
        router.push('/portfolio')
      }, 1500)
    } catch (err: any) {
      console.error(err)
      setErrorMsg('Ocurrió un error al registrar la compra.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <button onClick={() => router.push('/')} className="fixed top-6 left-6 z-50 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-2">
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="max-w-md mx-auto mt-16 bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <PlusCircle className="text-blue-500" size={32} />
          <h1 className="text-2xl font-bold">Añadir al Portafolio</h1>
        </div>

        {errorMsg && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">{errorMsg}</div>}
        {successMessage && <div className="mb-4 p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-sm">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ticker</label>
            <input 
              type="text" 
              placeholder="ej: AAPL" 
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" 
              value={ticker} 
              onChange={e => setTicker(e.target.value.toUpperCase())} 
              required
            />
            {showDropdown && suggestions.length > 0 && (
              <ul className="absolute w-full bg-gray-800 border border-gray-700 rounded-md mt-1 max-h-48 overflow-y-auto z-50 shadow-xl">
                {suggestions.map((s, index) => (
                  <li key={`${s.symbol}-${index}`} onClick={() => { setTicker(s.symbol); setShowDropdown(false); }} className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                    <span className="font-bold">{s.symbol}</span> - <span className="text-gray-400 text-sm">{s.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Fecha de Compra</label>
            <input 
              type="date" 
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" 
              value={fecha} 
              onChange={e => setFecha(e.target.value)} 
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Precio por Acción ($)</label>
            <input 
              type="number" 
              step="any"
              placeholder="150.00" 
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" 
              value={precio} 
              onChange={e => setPrecio(e.target.value)} 
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Cantidad de Acciones</label>
            <input 
              type="number" 
              step="any"
              placeholder="10" 
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" 
              value={cantidad} 
              onChange={e => setCantidad(e.target.value)} 
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg shadow-md transition-colors disabled:bg-gray-600 mt-6"
          >
            {loading ? 'Registrando...' : 'Registrar Compra'}
          </button>
        </form>
      </div>
    </div>
  )
}
