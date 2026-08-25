'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [isPublic, setIsPublic] = useState(false)

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

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
            <input type="text" className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600" placeholder="Tu nombre de usuario" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Biografía</label>
            <textarea className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 h-32" placeholder="Cuéntanos sobre ti..." />
          </div>
          <div className="flex items-center gap-4">
            <input type="checkbox" checked={isPublic} onChange={() => setIsPublic(!isPublic)} className="w-5 h-5 accent-blue-600" />
            <label className="text-sm font-medium text-gray-400">Hacer mi portafolio público</label>
          </div>
          <button type="button" className="w-full p-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors">
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  )
}
