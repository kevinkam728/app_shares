'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, MessageCircle, Repeat, Bookmark, Send } from 'lucide-react'

export default function SocialFeed() {
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function initUserAndPosts() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      await fetchPosts(user)
    }
    initUserAndPosts()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchPosts(currentUser);
    }
  }, [activeTab]);

  const fetchPosts = async (userParam = currentUser) => {
    const activeUser = userParam !== undefined ? userParam : currentUser

    try {
      let followingIds: string[] = [];
      if (activeUser) {
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', activeUser.id);
        followingIds = (follows || []).map((f: any) => f.following_id);
      }

      if (activeTab === 'operaciones') {
        if (followingIds.length === 0) { setPosts([]); return; }

        // Buscar trades de los usuarios seguidos
        const { data: trades } = await supabase
          .from('simulated_trades')
          .select('*, profiles(username, avatar_url)')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false });

        const tradeAlerts = (trades || []).map((t: any) => ({
          id: `trade-${t.id}`,
          isTradeAlert: true,
          profile: Array.isArray(t.profiles) ? t.profiles[0] : t.profiles,
          content: `Compró $${Number(t.amount_invested || 0).toFixed(2)} USD en acciones de ${t.ticker}`,
          created_at: t.created_at
        }));
        setPosts(tradeAlerts);
        return; // Terminamos aquí para esta pestaña
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:profiles!posts_user_id_fkey(username, avatar_url), post_likes(user_id), post_saves(user_id)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error al descargar posts:", error)
        return
      }

      console.log("Posts obtenidos de Supabase:", data)

      const formattedPosts = (data || []).map((p: any) => {
        const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
        const likes = p.post_likes || []
        const saves = p.post_saves || []
        const isLiked = activeUser ? likes.some((l: any) => l.user_id === activeUser.id) : false
        const isSaved = activeUser ? saves.some((s: any) => s.user_id === activeUser.id) : false

        return {
          ...p,
          profile,
          likesCount: likes.length,
          isLiked,
          isSaved
        }
      })

      let finalPosts = [...formattedPosts];

      if (activeTab === 'tendencias') {
        finalPosts.sort((a, b) => b.likesCount - a.likesCount);
      } else if (activeTab === 'siguiendo') {
        finalPosts = finalPosts.filter(p => followingIds.includes(p.user_id));
      }

      setPosts(finalPosts);
    } catch (err) {
      console.error("Error inesperado en fetchPosts:", err)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      alert("El mensaje está vacío.")
      return
    }
    if (!currentUser) {
      alert("Error de sesión: El componente no detecta al usuario logueado. Por favor recarga la página.")
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('posts')
        .insert([{ user_id: currentUser.id, content: newPostContent.trim() }])

      if (error) {
        console.error("Error detallado de Supabase:", error)
        alert("Error al publicar: " + error.message)
        return
      }

      // Éxito: limpiar input y recargar posts
      setNewPostContent('')
      await fetchPosts(currentUser)
    } catch (err: any) {
      console.error("Error inesperado:", err)
      alert("Ocurrió un error inesperado al publicar.")
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(postId: string, isLiked: boolean) {
    if (!currentUser) {
      alert("Debes iniciar sesión para dar 'Me gusta'.")
      return
    }

    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: currentUser.id })
    }

    fetchPosts(currentUser)
  }

  async function handleSave(postId: string, isSaved: boolean) {
    if (!currentUser) {
      alert("Debes iniciar sesión para guardar publicaciones.")
      return
    }

    if (isSaved) {
      await supabase
        .from('post_saves')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
    } else {
      await supabase
        .from('post_saves')
        .insert({ post_id: postId, user_id: currentUser.id })
    }

    fetchPosts(currentUser)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Barra de Pestañas */}
      <div className="flex border-b border-slate-700 font-medium text-sm">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 pb-3 text-center transition-colors relative ${activeTab === 'general' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          General
          {activeTab === 'general' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tendencias')}
          className={`flex-1 pb-3 text-center transition-colors relative ${activeTab === 'tendencias' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Tendencias
          {activeTab === 'tendencias' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('siguiendo')}
          className={`flex-1 pb-3 text-center transition-colors relative ${activeTab === 'siguiendo' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Siguiendo
          {activeTab === 'siguiendo' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('operaciones')}
          className={`flex-1 pb-3 text-center transition-colors relative ${activeTab === 'operaciones' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Operaciones
          {activeTab === 'operaciones' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Caja de redacción */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <textarea
          className="w-full p-4 bg-slate-900 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 resize-none"
          rows={3}
          placeholder="¿Qué está pasando en los mercados hoy? Comparte tu análisis..."
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleCreatePost}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-lg font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Send size={16} />
            {loading ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>

      {/* Lista de Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700/50">
            {activeTab === 'siguiendo'
              ? 'Aún no sigues a nadie o tus contactos no han publicado nada. ¡Explora perfiles y empieza a seguirlos!'
              : activeTab === 'operaciones'
              ? 'Tus contactos aún no han realizado operaciones. ¡Sigue a más inversores para ver su actividad!'
              : 'No hay publicaciones aún. ¡Sé el primero en compartir algo!'}
          </div>
        ) : (
          posts.map((p) => (
            <div key={p.id} className={`bg-slate-800 p-6 rounded-xl border ${p.isTradeAlert ? 'border-emerald-800' : 'border-slate-700'} shadow-md`}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                {p.profile?.avatar_url || p.profiles?.avatar_url ? (
                  <img
                    src={p.profile?.avatar_url || p.profiles?.avatar_url}
                    alt={p.profile?.username || p.profiles?.username || 'Avatar'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-700 text-slate-200 rounded-full flex items-center justify-center font-bold">
                    {(p.profile?.username || p.profiles?.username || 'U')?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-white">
                    {p.profile?.username || p.profiles?.username || 'Usuario'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {p.created_at ? new Date(p.created_at).toLocaleString() : ''}
                  </p>
                </div>
              </div>

              {/* Body */}
              <p className="text-slate-200 mb-6 whitespace-pre-wrap leading-relaxed">{p.content}</p>

              {/* Footer / Action Buttons */}
              {!p.isTradeAlert && (
                <div className="flex items-center justify-between text-slate-400 border-t border-slate-700 pt-4 px-2">
                  <button
                    onClick={() => alert("Próximamente")}
                    className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                  >
                    <MessageCircle size={18} />
                    <span className="text-xs">Responder</span>
                  </button>

                  <button
                    onClick={() => alert("Próximamente")}
                    className="flex items-center gap-2 hover:text-green-400 transition-colors"
                  >
                    <Repeat size={18} />
                    <span className="text-xs">Repostear</span>
                  </button>

                  <button
                    onClick={() => handleLike(p.id, p.isLiked)}
                    className={`flex items-center gap-2 transition-colors ${
                      p.isLiked ? 'text-red-500' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Heart size={18} className={p.isLiked ? 'fill-red-500' : ''} />
                    <span className="text-xs">{p.likesCount || 0}</span>
                  </button>

                  <button
                    onClick={() => handleSave(p.id, p.isSaved)}
                    className={`flex items-center gap-2 transition-colors ${
                      p.isSaved ? 'text-blue-500' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bookmark size={18} className={p.isSaved ? 'fill-blue-500' : ''} />
                    <span className="text-xs">Guardar</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
