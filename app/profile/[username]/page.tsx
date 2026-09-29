'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, User, Image as ImageIcon, Heart, MessageCircle, Repeat, Lock } from 'lucide-react'

export default function PublicInvestorProfilePage() {
  const router = useRouter()
  const params = useParams()
  const identifier = (params.username as string) || 'Inversor 2'
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [trades, setTrades] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('publicaciones')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfileData = async () => {
      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', identifier)
        .single()

      if (!profileData) {
        const { data: profileById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', identifier)
          .single()
        profileData = profileById
      }

      if (profileData) {
        setProfile(profileData)
        if (profileData.is_portfolio_public) {
          const { data: tradeData } = await supabase
            .from('simulated_trades')
            .select('*')
            .eq('user_id', profileData.id)
          if (tradeData) setTrades(tradeData)
        }
      }
      setLoading(false)
    }
    fetchProfileData()
  }, [identifier])

  const username = profile?.username || decodeURIComponent(identifier)
  const bio = profile?.bio || 'Inversor centrado en tech, diversificación global y crypto. Buscando valor a largo plazo.'

  const mockPosts = [
    {
      id: 1,
      author: username,
      content: "Mi portafolio tech subió un 5% hoy, gracias a $AAPL.",
      time: "Hace 2 horas",
      likes: 12,
      comments: 4,
      reposts: 2
    },
    {
      id: 2,
      author: username,
      content: "Compartiendo mi análisis sobre $BTC.",
      time: "Hace 5 horas",
      likes: 24,
      comments: 8,
      reposts: 5
    }
  ]

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 relative">
      {/* Botón Volver */}
      <button 
        onClick={() => router.back()} 
        className="mb-6 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <ArrowLeft size={18} />
        Volver
      </button>

      {/* Contenedor Principal */}
      <div className="max-w-2xl mx-auto bg-[#0f172a] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Cabecera */}
        <div className="flex items-center gap-4 border-b border-slate-700 pb-6">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={username} className="w-16 h-16 rounded-full object-cover border border-slate-700" />
          ) : (
            <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-300">
              <User size={32} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{username}</h1>
            <p className="text-xs text-slate-400">Perfil Público de Inversor</p>
          </div>
        </div>

        {/* Tarjeta de Desempeño (Performance) */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">Desempeño del Portafolio</h3>
            <span className="text-xs text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-800">
              ■ Verde: Ganancias
            </span>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-emerald-400 flex items-center gap-1">
              +73% <span className="text-xl">↑</span>
            </div>
            <p className="text-xs text-slate-400">Últimos 12 Meses</p>
          </div>

          {/* Gráfico interactivo placeholder */}
          <div className="h-36 bg-slate-900/80 rounded-lg border border-slate-700 relative overflow-hidden flex flex-col justify-end p-3">
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-20">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border-b border-r border-slate-600"></div>
              ))}
            </div>
            
            <svg className="absolute inset-0 w-full h-full p-2" preserveAspectRatio="none" viewBox="0 0 100 50">
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,45 L10,38 L25,42 L40,30 L55,35 L70,22 L85,28 L100,10 L100,50 L0,50 Z" fill="url(#greenGrad)" />
              <path d="M0,45 L10,38 L25,42 L40,30 L55,35 L70,22 L85,28 L100,10" fill="none" stroke="#10b981" strokeWidth="2" />
            </svg>

            <div className="flex justify-between text-[10px] text-slate-400 z-10 pt-2 border-t border-slate-700/50">
              <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
            <span>Mini análisis histórico</span>
            <span className="text-rose-400 bg-rose-950/50 px-2 py-1 rounded border border-rose-800">
              ■ Rojo: Pérdidas
            </span>
          </div>
        </div>

        {/* Biografía */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Biografía</label>
          <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700 text-sm text-slate-300 leading-relaxed">
            {bio}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <button onClick={() => alert("Próximamente")} className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-colors text-center cursor-pointer">
            Seguir
          </button>
          <button onClick={() => router.push('/messages')} className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-colors text-center cursor-pointer">
            Mensaje
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Enlace copiado al portapapeles"); }} className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-colors text-center cursor-pointer">
            Compartir
          </button>
        </div>

        {/* Pestañas (Tabs) */}
        <div className="flex border-b border-slate-700 text-sm overflow-x-auto">
          {[
            { id: 'publicaciones', label: 'Publicaciones', count: 1 },
            { id: 'reposteos', label: 'Reposteos', count: 1 },
            { id: 'megusta', label: 'Me Gusta', count: 3 },
            { id: 'guardados', label: 'Guardados', count: 3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors relative whitespace-nowrap cursor-pointer ${
                activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Feed del Usuario (Posts) */}
        <div className="space-y-4 pt-2">
          {mockPosts.map((post) => (
            <div key={post.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 text-slate-200 rounded-full flex items-center justify-center font-bold">
                    {post.author[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-white capitalize">{post.author}</h4>
                    <p className="text-xs text-slate-400">{post.time}</p>
                  </div>
                </div>
                <span className="text-slate-500 hover:text-white cursor-pointer font-bold">•••</span>
              </div>

              {/* Body */}
              <p className="text-slate-200 text-sm leading-relaxed">{post.content}</p>

              {/* Placeholder image box as seen in sketch */}
              <div className="w-full h-32 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center text-slate-500">
                <ImageIcon size={32} />
              </div>

              {/* Footer / Action buttons */}
              <div className="flex items-center justify-between text-slate-400 border-t border-slate-700 pt-3 px-1">
                <button onClick={() => alert("Próximamente")} className="flex items-center gap-1.5 hover:text-red-400 transition-colors cursor-pointer">
                  <Heart size={16} />
                  <span className="text-xs">{post.likes}</span>
                </button>
                <button onClick={() => alert("Próximamente")} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors cursor-pointer">
                  <MessageCircle size={16} />
                  <span className="text-xs">{post.comments}</span>
                </button>
                <button onClick={() => alert("Próximamente")} className="flex items-center gap-1.5 hover:text-green-400 transition-colors cursor-pointer">
                  <Repeat size={16} />
                  <span className="text-xs">{post.reposts}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
