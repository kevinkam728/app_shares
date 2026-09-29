'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Settings as SettingsIcon, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUsername(profile.username || '')
        setBio(profile.bio || '')
        setAvatarUrl(profile.avatar_url || '')
      }
      setLoading(false)
    }
    loadUserData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setSaving(true)
    setSuccessMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        bio,
        avatar_url: avatarUrl
      })
      .eq('id', currentUser.id)

    setSaving(false)

    if (error) {
      alert("Error al actualizar perfil: " + error.message)
    } else {
      setSuccessMessage("Perfil actualizado correctamente")
      setTimeout(() => setSuccessMessage(''), 4000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        Cargando configuración...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      {/* Botón Volver */}
      <button 
        onClick={() => router.push('/')} 
        className="mb-6 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <ArrowLeft size={18} />
        Volver al Dashboard
      </button>

      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-8">
        <div className="flex items-center justify-between border-b border-slate-700 pb-6">
          <div className="flex items-center gap-3">
            <SettingsIcon size={28} className="text-blue-400" />
            <h1 className="text-2xl font-bold">Configuración de Perfil</h1>
          </div>
          {username && (
            <button
              onClick={() => router.push(`/profile/${encodeURIComponent(username)}`)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer text-blue-400"
            >
              <ExternalLink size={16} />
              Ver mi perfil público
            </button>
          )}
        </div>

        {successMessage && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-lg text-sm text-center font-medium">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Nombre de Usuario */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Nombre de Usuario</label>
            <input 
              type="text" 
              className="w-full p-3 bg-slate-800 rounded-lg border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          {/* Foto de Perfil (URL externa) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Foto de Perfil (URL Externa)</label>
            <input 
              type="text" 
              className="w-full p-3 bg-slate-800 rounded-lg border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              placeholder="https://imgur.com/tu-avatar.jpg"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
            />
            <p className="text-xs text-slate-500">Pega el enlace directo de una imagen (ej. Imgur).</p>
          </div>

          {/* Biografía */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-300">Biografía</label>
              <span className={`text-xs ${bio.length > 160 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                {bio.length}/160 caracteres
              </span>
            </div>
            <textarea 
              className="w-full p-3 bg-slate-800 rounded-lg border border-slate-700 text-white focus:outline-none focus:border-blue-500 h-32 resize-none"
              placeholder="Cuéntanos sobre tu estilo de inversión..."
              maxLength={160}
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>

          {/* Botón de Guardado */}
          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
