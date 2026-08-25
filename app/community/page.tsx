'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false })
    
    if (data) setPosts(data)
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
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center font-bold">
                  {p.profiles?.username?.[0] || '?'}
                </div>
                <div>
                  <h3 className="font-bold">{p.profiles?.username || 'Usuario'}</h3>
                  <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</p>
                </div>
              </div>
              <p className="mb-4">{p.content}</p>
              {p.tagged_ticker && (
                <span className="inline-block px-2 py-1 bg-gray-700 text-blue-400 rounded text-sm font-mono mb-4">
                  ${p.tagged_ticker}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
