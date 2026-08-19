'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewsPage() {
  const router = useRouter()
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [ticker, setTicker] = useState('')
  const [searchTrigger, setSearchTrigger] = useState(0)

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
        let url = `https://finnhub.io/api/v1/news?category=general&token=${token}`
        
        if (ticker.trim()) {
            url = `https://finnhub.io/api/v1/company-news?symbol=${ticker.toUpperCase()}&from=${selectedDate}&to=${selectedDate}&token=${token}`
        }

        const response = await fetch(url)
        if (!response.ok) throw new Error('Error al cargar noticias')
        
        const data = await response.json()
        setNews(data)
      } catch (err) {
        setError('No se pudieron cargar las noticias')
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [searchTrigger])

  const filteredNews = ticker.trim() 
    ? news 
    : news.filter(article => {
        const articleDate = new Date(article.datetime * 1000).toLocaleDateString('en-CA')
        return articleDate === selectedDate
    })

  if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Cargando noticias...</div>
  if (error) return <div className="min-h-screen bg-gray-900 text-white p-8">{error}</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Noticias del Mercado</h1>
        <div className="flex gap-4 items-center">
            <button onClick={() => router.push('/dashboard')} className="p-3 bg-blue-600 rounded-lg hover:bg-blue-500">
                Volver al Dashboard
            </button>
            <input 
                type="text"
                placeholder="Buscar Ticker (ej: AAPL)..."
                className="p-2 bg-gray-800 rounded border border-gray-700"
                value={ticker}
                onChange={e => setTicker(e.target.value)}
            />
            <input 
                type="date" 
                className="p-2 bg-gray-800 rounded border border-gray-700"
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
            />
            <button onClick={() => setSearchTrigger(prev => prev + 1)} className="p-2 bg-green-600 rounded hover:bg-green-500">
                Buscar Noticias
            </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredNews.length > 0 ? (
          filteredNews.map((article) => (
            <a 
              key={article.id} 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <img src={article.image} alt={article.headline} className="w-24 h-24 object-cover rounded" />
              <div>
                <h3 className="font-semibold text-lg line-clamp-2">{article.headline}</h3>
                <p className="text-sm text-gray-400 mt-1">{article.source} • {new Date(article.datetime * 1000).toLocaleDateString()}</p>
                <p className="text-sm text-gray-300 mt-2 line-clamp-2">{article.summary}</p>
              </div>
            </a>
          ))
        ) : (
          <p className="text-gray-400">No hay noticias disponibles para esta fecha.</p>
        )}
      </div>
    </div>
  )
}
