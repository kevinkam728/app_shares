'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      
      if (data) {
        setUsername(data.username || '')
        setBio(data.bio || '')
        setIsPublic(data.is_portfolio_public || false)
      }
      setFetching(false)
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').update({
      username,
      bio,
      is_portfolio_public: isPublic
    }).eq('id', user.id)
    
    setLoading(false)
    alert('¡Guardado!')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <button onClick={() => router.push('/')} className="fixed top-6 left-6 z-50 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-gray-600">
        Volver
      </button>

      <div className="max-w-2xl mx-auto mt-20 p-8 bg-gray-800 rounded-xl shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-gray-700 rounded-full mb-4 flex items-center justify-center">
            <span className="text-gray-400 text-4xl">👤</span>
          </div>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
        </div>

        {fetching ? (
            <div className="text-center text-gray-400">Cargando perfil...</div>
        ) : (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                <input type="text" className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600" placeholder="Tu nombre de usuario" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Biografía</label>
                <textarea className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 h-32" placeholder="Cuéntanos sobre ti..." value={bio} onChange={e => setBio(e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
                <input type="checkbox" checked={isPublic} onChange={() => setIsPublic(!isPublic)} className="w-5 h-5 accent-blue-600" />
                <label className="text-sm font-medium text-gray-400">Hacer mi portafolio público</label>
            </div>
            <button type="submit" disabled={loading} className="w-full p-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors">
                {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            </form>
        )}
      </div>
    </div>
  )
}
