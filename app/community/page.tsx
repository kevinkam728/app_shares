'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThumbsUp, MessageCircle } from 'lucide-react'

export default function CommunityPage() {
  const router = useRouter()
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostTicker, setNewPostTicker] = useState('')
  const [loading, setLoading] = useState(false)

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *, 
        profiles!posts_user_id_fkey(username, avatar_url),
        likes(count)
      `)
      .order('created_at', { ascending: false })
    
    if (data) setPosts(data)
  }

  async function handleToggleLike(postId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        alert("Debes iniciar sesión para dar 'Me gusta'.")
        return
    }

    // Verificar si ya existe un like
    const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()

    if (existingLike) {
        // Quitar like
        await supabase.from('likes').delete().eq('id', existingLike.id)
    } else {
        // Dar like
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
    }

    fetchPosts()
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handlePost = async () => {
    if (!newPostContent.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        alert("Debes iniciar sesión para publicar.")
        setLoading(false)
        return
    }

    await supabase.from('posts').insert({
        user_id: user.id,
        content: newPostContent,
        tagged_ticker: newPostTicker || null
    })

    setNewPostContent('')
    setNewPostTicker('')
    setLoading(false)
    fetchPosts()
  }

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
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <div className="flex gap-4 items-center">
            <input 
              type="text" 
              className="p-2 bg-gray-700 rounded border border-gray-600 w-32" 
              placeholder="Ticker (ej: AAPL)"
              value={newPostTicker}
              onChange={(e) => setNewPostTicker(e.target.value.toUpperCase())}
            />
            <button 
                onClick={handlePost}
                disabled={loading}
                className="ml-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold"
            >
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>

        {/* Feed de Publicaciones */}
        <div className="space-y-6">
          {posts.map((p) => (
            <div key={p.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              {/* Modificado para manejar correctamente el perfil */}
              {(() => {
                const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                return (
                  <div className="flex items-center gap-3 mb-4">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username || 'User'} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center font-bold">
                        {profile?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold">{profile?.username || 'Usuario Desconocido'}</h3>
                      <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })()}
              <p className="mb-4">{p.content}</p>
              {p.tagged_ticker && (
                <span className="inline-block px-2 py-1 bg-gray-700 text-blue-400 rounded text-sm font-mono mb-4">
                  ${p.tagged_ticker}
                </span>
              )}
              {/* Contenedor flex para botones */}
              <div className="flex gap-6 text-gray-400 text-sm border-t border-gray-700 pt-4">
                <button 
                    onClick={() => handleToggleLike(p.id)}
                    className="flex items-center gap-2 hover:text-red-400 transition-colors"
                >
                  <ThumbsUp size={18} /> 
                  <span>Me gusta</span> 
                  <span className="text-gray-500">({p.likes?.[0]?.count || 0})</span>
                </button>
                <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <MessageCircle size={18} /> <span>Comentar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
