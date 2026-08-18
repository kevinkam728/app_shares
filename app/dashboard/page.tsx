'use client'

import { useState, useEffect, useRef } from 'react'
import { getStockData, getHistoricalData, searchStocks } from '../actions/finance'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Search, UserCheck, Settings, MessageSquare, Newspaper, Calendar, Calculator, Bell } from 'lucide-react'
import StockHeatmap from '@/components/StockHeatmap'

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userName, setUserName] = useState("Usuario")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [stock, setStock] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const supabase = createClient()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
        const { data: newProfile, error: upsertError } = await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          role: 'user'
        }, { onConflict: 'id' }).select().single()
        
        if (!upsertError) {
          data = newProfile
        }
      }
      
      if (data) {
        setUserProfile(data)
        // Priorizar full_name de profiles, luego metadatos, luego email
        const nameToUse = data.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
        setUserName(nameToUse.charAt(0).toUpperCase() + nameToUse.slice(1))
      }
      setPageLoading(false)
    }
    fetchProfile()
  }, [])

  // Efecto para debounce de búsqueda
  useEffect(() => {
    if (query.length > 1) {
      const timer = setTimeout(async () => {
        const results = await searchStocks(query)
        setSuggestions(results)
        setShowDropdown(true)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [query])

  const handleSearch = async (ticker: string) => {
    setQuery(ticker)
    setShowDropdown(false)
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="flex justify-between items-center mb-8 bg-gray-800 p-6 rounded-xl shadow-lg relative">
        <div className="flex items-center gap-4">
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            {isMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-50 py-1">
                {[
                  { icon: MessageSquare, label: 'Chatbot Financiero' },
                  { icon: Newspaper, label: 'Noticias del Mercado' },
                  { icon: Calendar, label: 'Calendario Económico' },
                  { icon: Calculator, label: 'Calculadora de Inversiones' },
                  { icon: Bell, label: 'Mis Alertas de Precios' },
                ].map((item, i) => (
                  <button key={i} className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-gray-700 transition-colors">
                    <item.icon size={18} /> {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold">Bienvenido, {userName ? userName : 'Inversor'}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {userProfile?.role === 'advisor' && (
            <div className="flex items-center gap-2 bg-green-900/30 text-green-400 px-4 py-2 rounded-full text-sm font-semibold border border-green-700">
              <UserCheck size={16} />
              Asesor Certificado CNV
            </div>
          )}
        </div>
      </header>

      <div className="relative mb-8" ref={dropdownRef}>
        <div className="flex gap-2">
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="Buscar ticker (ej: AAPL)..."
            className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 flex items-center gap-2"
          >
            {loading ? '...' : <Search size={20} />}
          </button>
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.symbol}
                onClick={() => handleSearch(s.symbol)}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
              >
                <span className="font-bold">{s.symbol}</span> - <span className="text-gray-400 text-sm">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <StockHeatmap />
      </div>

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
