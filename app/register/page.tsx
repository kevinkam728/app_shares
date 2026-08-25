'use client'

import { useState } from 'react'
import { signUpAction } from '../actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [role, setRole] = useState<'user' | 'advisor'>('user')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    formData.append('role', role)
    
    const result = await signUpAction(formData)
    setLoading(false)
    
    if (result?.error) alert(result.error)
    else router.push('/')
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <form action={handleSubmit} className="p-8 bg-gray-800 rounded-lg shadow-xl w-96 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Registro</h1>
        
        <input name="fullName" placeholder="Nombre Completo" required className="p-2 bg-gray-700 rounded" />
        <input name="email" type="email" placeholder="Email" required className="p-2 bg-gray-700 rounded" />
        <input name="password" type="password" placeholder="Contraseña" required className="p-2 bg-gray-700 rounded" />

        <select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'advisor')} className="p-2 bg-gray-700 rounded">
            <option value="user">Usuario Común</option>
            <option value="advisor">Asesor Financiero</option>
        </select>
        {role === 'advisor' && (
            <input name="cnvPdf" type="file" accept=".pdf" required className="p-2 bg-gray-700 rounded" />
        )}

        <button type="submit" disabled={loading} className="p-2 bg-blue-600 rounded font-bold hover:bg-blue-500">
          {loading ? 'Cargando...' : 'Registrarse'}
        </button>

        <Link href="/login" className="text-sm text-gray-400 text-center">
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </form>
    </div>
  )
}
