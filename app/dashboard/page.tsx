'use client'

import { useState, useEffect } from 'react'
import { getStockData, getHistoricalData } from '../actions/finance'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Search, UserCheck } from 'lucide-react'

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [ticker, setTicker] = useState('')
  const [stock, setStock] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setPageLoading(false)
        return
      }

      let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      
      if (error || !data) {
        // Intentar crear perfil si no existe
        const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: 'Usuario Nuevo',
          role: 'user'
        }).select().single()
        
        if (!insertError) {
          data = newProfile
        } else {
          console.error("Error creating profile:", insertError)
        }
      }
      
      setUserProfile(data)
      setPageLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const [stockData, historyData] = await Promise.all([
      getStockData(ticker),
      getHistoricalData(ticker)
    ])
    setStock(stockData)
    setHistory(historyData || [])
    setLoading(false)
  }

  if (pageLoading) {
    return <div className="min-h-screen bg-gray-900 text-white p-8">Cargando perfil...</div>
  }

  if (!userProfile) {
    return <div className="min-h-screen bg-gray-900 text-white p-8">No se pudo cargar el perfil.</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="flex justify-between items-center mb-8 bg-gray-800 p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold">Bienvenido, {userProfile.full_name}</h1>
        {userProfile.role === 'advisor' && (
          <div className="flex items-center gap-2 bg-green-900/30 text-green-400 px-4 py-2 rounded-full text-sm font-semibold border border-green-700">
            <UserCheck size={16} />
            Asesor Certificado CNV
          </div>
        )}
      </header>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input 
          value={ticker} 
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Ej: AAPL o YPFD.BA"
          className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 flex items-center gap-2"
        >
          {loading ? 'Buscando...' : <><Search size={20} /> Buscar</>}
        </button>
      </form>

      {stock && (
        <div className="bg-gray-800 p-8 rounded-xl shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold">{stock.symbol}</h2>
              <p className="text-gray-400">{stock.longName}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-mono">${stock.regularMarketPrice?.toFixed(2)}</p>
              <p className={`font-semibold ${stock.regularMarketChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stock.regularMarketChangePercent?.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="h-80 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis dataKey="date" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px'}}
                  itemStyle={{color: '#60a5fa'}}
                />
                <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
