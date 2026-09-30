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

  const [feedPosts, setFeedPosts] = useState<any[]>([])
  const [isFetchingFeed, setIsFetchingFeed] = useState(false)
  const [tabCounts, setTabCounts] = useState({ publicaciones: 0, reposteos: 0, megusta: 0, guardados: 0 })

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (!profile?.id) return;
    
    const fetchFeed = async () => {
      setIsFetchingFeed(true);
      try {
        let queryData: any[] = [];
        
        if (activeTab === 'publicaciones') {
          const { data } = await supabase
            .from('posts')
            .select('*, profiles:profiles!posts_user_id_fkey(username, avatar_url), post_likes(user_id), post_saves(user_id)')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          queryData = data || [];
        } 
        else if (activeTab === 'megusta') {
          const { data } = await supabase
            .from('post_likes')
            .select('post_id, posts(*, profiles:profiles!posts_user_id_fkey(username, avatar_url), post_likes(user_id), post_saves(user_id))')
            .eq('user_id', profile.id);
          queryData = (data || []).map((item: any) => item.posts).filter(Boolean);
        }
        else if (activeTab === 'guardados') {
          const { data } = await supabase
            .from('post_saves')
            .select('post_id, posts(*, profiles:profiles!posts_user_id_fkey(username, avatar_url), post_likes(user_id), post_saves(user_id))')
            .eq('user_id', profile.id);
          queryData = (data || []).map((item: any) => item.posts).filter(Boolean);
        }
        
        // Formatear datos para la UI (igual que en SocialFeed)
        const formatted = queryData.map((p: any) => ({
          ...p,
          profile: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
          likesCount: p.post_likes?.length || 0,
          savesCount: p.post_saves?.length || 0,
        }));
        
        setFeedPosts(formatted);
      } catch (err) {
        console.error("Error fetching feed:", err);
      } finally {
        setIsFetchingFeed(false);
      }
    };
    
    fetchFeed();
  }, [activeTab, profile?.id]);

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Decodificar el parámetro de la URL para quitar %20 y otros caracteres
      const cleanIdentifier = decodeURIComponent(identifier);

      // 1. Intentar buscar por username exacto
      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanIdentifier)
        .single()

      // 2. Si no lo encuentra por username, intentar por ID
      // Solo hacer esta consulta si cleanIdentifier parece un UUID válido (formato 36 caracteres con guiones)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!profileData && uuidRegex.test(cleanIdentifier)) {
        const { data: profileById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', cleanIdentifier)
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

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !currentUser || !profile) return
    setIsSendingMessage(true)
    
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: profile.id,
        content: messageContent.trim()
      })

      if (error) throw error

      alert("Mensaje enviado correctamente")
      setIsMessageModalOpen(false)
      setMessageContent('')
    } catch (err: any) {
      console.error("Error al enviar mensaje:", err)
      alert("Hubo un error al enviar el mensaje.")
    } finally {
      setIsSendingMessage(false)
    }
  }

  const username = profile?.username || decodeURIComponent(identifier)
  const bio = profile?.bio || 'Sin biografía.'

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
          <button onClick={() => {
            if (!currentUser) {
              alert("Debes iniciar sesión para enviar mensajes.")
              return
            }
            setIsMessageModalOpen(true)
          }} className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-colors text-center cursor-pointer">
            Mensaje
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Enlace copiado al portapapeles"); }} className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-colors text-center cursor-pointer">
            Compartir
          </button>
        </div>

        {/* Pestañas (Tabs) */}
        <div className="flex border-b border-slate-700 text-sm overflow-x-auto">
          {[
            { id: 'publicaciones', label: 'Publicaciones', count: 0 },
            { id: 'reposteos', label: 'Reposteos', count: 0 },
            { id: 'megusta', label: 'Me Gusta', count: 0 },
            { id: 'guardados', label: 'Guardados', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors relative whitespace-nowrap cursor-pointer ${
                activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feed del Usuario (Posts) */}
        <div className="space-y-4 pt-2">
          {isFetchingFeed ? (
            <div className="text-center py-8 text-slate-400">Cargando publicaciones...</div>
          ) : feedPosts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700/50">
              No hay publicaciones en esta sección.
            </div>
          ) : (
            feedPosts.map((post: any) => (
              <div key={post.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {post.profile?.avatar_url ? (
                      <img src={post.profile.avatar_url} alt={post.profile?.username || username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-700 text-slate-200 rounded-full flex items-center justify-center font-bold">
                        {(post.profile?.username || username || 'U')?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white capitalize">{post.profile?.username || username}</h4>
                      <p className="text-xs text-slate-400">{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                  <span className="text-slate-500 hover:text-white cursor-pointer font-bold">•••</span>
                </div>

                {/* Body */}
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

                {/* Footer / Action buttons */}
                <div className="flex items-center justify-between text-slate-400 border-t border-slate-700 pt-3 px-1">
                  <button onClick={() => alert("Próximamente")} className="flex items-center gap-1.5 hover:text-red-400 transition-colors cursor-pointer">
                    <Heart size={16} />
                    <span className="text-xs">{post.likesCount || 0}</span>
                  </button>
                  <button onClick={() => alert("Próximamente")} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors cursor-pointer">
                    <MessageCircle size={16} />
                    <span className="text-xs">0</span>
                  </button>
                  <button onClick={() => alert("Próximamente")} className="flex items-center gap-1.5 hover:text-green-400 transition-colors cursor-pointer">
                    <Repeat size={16} />
                    <span className="text-xs">0</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Modal de Mensaje */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold">Enviar mensaje a {username}</h3>
            <textarea 
              rows={4}
              className="w-full p-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Escribe tu mensaje..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsMessageModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSendMessage}
                disabled={isSendingMessage || !messageContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-700 rounded-lg transition-colors font-bold cursor-pointer"
              >
                {isSendingMessage ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
