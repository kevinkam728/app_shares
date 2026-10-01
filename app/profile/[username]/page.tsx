'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, User, Image as ImageIcon, Heart, MessageCircle, Repeat, Lock } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

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
  const [isFollowing, setIsFollowing] = useState(false)

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
        
        if (user) {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', profileData.id)
            .single();
          if (followData) setIsFollowing(true);
        }

        // 1. Obtener el portfolio_id del usuario
        const { data: port } = await supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', profileData.id)
          .single()

        // 2. Obtener los trades usando el portfolio_id
        if (port) {
          const { data: tradeData } = await supabase
            .from('simulated_trades')
            .select('*')
            .eq('portfolio_id', port.id)
            .order('buy_date', { ascending: false })
          if (tradeData) setTrades(tradeData)
        }
      }
      setLoading(false)
    }
    fetchProfileData()
  }, [identifier])

  const handleToggleFollow = async () => {
    if (!currentUser) { alert("Inicia sesión para seguir usuarios."); return; }
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profile.id);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: profile.id });
      setIsFollowing(true);
    }
  };

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

  const { chartData, totalInvested } = useMemo(() => {
    if (!trades || trades.length === 0) return { chartData: [], totalInvested: 0 };

    const sortedTrades = [...trades].sort((a, b) => new Date(a.buy_date || a.created_at).getTime() - new Date(b.buy_date || b.created_at).getTime());

    let cumulative = 0;
    const data = sortedTrades.map(trade => {
      cumulative += Number(trade.amount_invested || 0);
      return {
        date: new Date(trade.buy_date || trade.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        valor: cumulative
      };
    });

    return { chartData: data, totalInvested: cumulative };
  }, [trades]);

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
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-extrabold text-emerald-400">
                ${totalInvested > 0 ? totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </div>
              <span className="text-sm font-semibold text-slate-400">0.00%</span>
            </div>
            <p className="text-xs text-slate-400">Capital Total Invertido</p>
          </div>

          {/* Gráfico interactivo placeholder */}
          <div className="h-36 bg-slate-900/80 rounded-lg border border-slate-700 relative overflow-hidden flex flex-col justify-end p-3">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Capital Invertido']}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#greenGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-500">
                No hay historial de inversiones aún.
              </div>
            )}
          </div>

          {/* Tenencias / Historial de Activos */}
          <div className="space-y-3 pt-3 border-t border-slate-700/60">
            <h4 className="font-semibold text-sm text-slate-300">Tenencias Públicas</h4>
            {trades.length === 0 ? (
              <p className="text-xs text-slate-500">No hay tenencias registradas.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {trades.map(trade => {
                  const price = Number(trade.buy_price || 0);
                  const amount = Number(trade.amount_invested || 0);
                  const quantity = price > 0 ? (amount / price).toFixed(4) : 0;

                  return (
                    <div key={trade.id} className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/80 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
                          {trade.ticker?.substring(0, 4) || 'UNK'}
                        </div>
                        <div>
                          <p className="font-bold text-white uppercase">{trade.ticker}</p>
                          <p className="text-[10px] text-slate-400">{new Date(trade.buy_date || trade.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">${price.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">{quantity} acciones</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
          <button onClick={handleToggleFollow} className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-colors text-center cursor-pointer">
            {isFollowing ? 'Siguiendo' : 'Seguir'}
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
