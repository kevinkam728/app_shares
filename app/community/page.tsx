'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MOCK_POSTS = [
  { id: 1, user: 'InvestorPro', time: 'Hace 2 horas', content: '¿Qué opinan de la caída de $AAPL? Creo que es una oportunidad de compra increíble para el largo plazo.', ticker: 'AAPL', likes: 12 },
  { id: 2, user: 'CryptoKing', time: 'Hace 5 horas', content: 'Diversificando mi portafolio hacia activos digitales. ¿Alguien más viendo $BTC?', ticker: 'BTC', likes: 25 },
  { id: 3, user: 'FinanzasSanas', time: 'Hace 1 día', content: 'El análisis técnico sugiere un soporte fuerte en $TSLA, pero la macroeconomía me preocupa...', ticker: 'TSLA', likes: 8 },
]

export default function CommunityPage() {
  const router = useRouter()
  const [post, setPost] = useState('')
  const [ticker, setTicker] = useState('')

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <button onClick={() => router.push('/')} className="fixed top-6 left-6 z-50 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-gray-600">
        Volver
      </button>

      <div className="max-w-2xl mx-auto mt-16">
        <h1 className="text-3xl font-bold mb-8 text-center">Muro de Inversores</h1>

        {/* Caja de Nueva Publicación */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 border border-gray-700">
          <textarea 
            className="w-full p-4 bg-gray-700 rounded-lg border border-gray-600 mb-4" 
            rows={3} 
            placeholder="Comparte tu estrategia o análisis..."
            value={post}
            onChange={(e) => setPost(e.target.value)}
          />
          <div className="flex gap-4 items-center">
            <input 
              type="text" 
              className="p-2 bg-gray-700 rounded border border-gray-600 w-32" 
              placeholder="Ticker (ej: AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
            />
            <button className="ml-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold">
              Publicar
            </button>
          </div>
        </div>

        {/* Feed de Publicaciones */}
        <div className="space-y-6">
          {MOCK_POSTS.map((p) => (
            <div key={p.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center font-bold">
                  {p.user[0]}
                </div>
                <div>
                  <h3 className="font-bold">{p.user}</h3>
                  <p className="text-xs text-gray-400">{p.time}</p>
                </div>
              </div>
              <p className="mb-4">{p.content}</p>
              {p.ticker && (
                <span className="inline-block px-2 py-1 bg-gray-700 text-blue-400 rounded text-sm font-mono mb-4">
                  ${p.ticker}
                </span>
              )}
              <div className="flex gap-4 text-gray-400 text-sm">
                <button className="hover:text-white">Me gusta ({p.likes})</button>
                <button className="hover:text-white">Comentar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
